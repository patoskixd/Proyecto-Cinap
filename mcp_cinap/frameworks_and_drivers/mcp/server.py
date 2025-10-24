from __future__ import annotations
import os
from zoneinfo import ZoneInfo

import httpx
from mcp.server.fastmcp import FastMCP

from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID
from application.ports import Pagination, TimeRange
from application.use_cases.list_user_asesorias import ListUserAsesorias, ListUserAsesoriasIn
from application.use_cases.upsert_calendar_event import UpsertCalendarEvent, UpsertCalendarEventIn
from frameworks_and_drivers.db.sa_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from frameworks_and_drivers.db.sa_repos import ServicioORM
from interface_adapters.services.text_norm import norm_key
from sqlalchemy import delete, select, text

from application.dto import AvailabilityIn, OverlapIn
from application.use_cases.resolve_advisor import ResolveAdvisor, ResolveAdvisorIn
from application.use_cases.resolve_service import ResolveService, ResolveServiceIn
from application.use_cases.check_availability import CheckAvailability
from application.use_cases.detect_overlaps import DetectOverlaps
from frameworks_and_drivers.db.config import SAUnitOfWork
from frameworks_and_drivers.db.orm_models import AsesoriaORM, CalendarEventORM, CupoORM, EstadoAsesoria, EstadoCupo
from frameworks_and_drivers.db.sa_repos import UsuarioORM as UsuarioModel, AsesorPerfilORM as AsesorPerfilModel, DocentePerfilORM as DocentePerfilModel
from frameworks_and_drivers.db.orm_models import UserIdentityORM as UserIdentityModel
from interface_adapters.gateways.calendar_gateway import NullCalendarGateway

SEMANTIC_URL = os.getenv("SEMANTIC_URL", "http://localhost:8000/search/semantic")
_client: httpx.AsyncClient | None = None
async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=2.0), http2=True)
    return _client

class OverlapInput(BaseModel):
    asesor_id: int
    start: datetime
    end: datetime
    include_calendar: bool = False

class ResolveInput(BaseModel):
    query: str
    limit: int = 10

class CheckAvailabilityInput(BaseModel):
    service: str = Field(..., description="Nombre del servicio (obligatorio)")
    start: datetime = Field(..., description="Inicio ISO8601 con TZ America/Santiago")
    end: datetime = Field(..., description="Término ISO8601 con TZ America/Santiago")
    advisor: Optional[str] = Field(None, description="Nombre o email del asesor (opcional)")
    page: int = Field(1, ge=1)
    per_page: int = Field(50, ge=1, le=100)

class ListAsesoriasInput(BaseModel):
    start: datetime = Field(..., description="Inicio ISO8601 con TZ America/Santiago")
    end:   datetime = Field(..., description="Fin ISO8601 con TZ America/Santiago")
    user_id: UUID   = Field(..., description="ID del usuario autenticado (JWT)")
    role: Literal["auto","docente","asesor"] = Field("auto")
    estado: Optional[str] = Field(None, description="PENDIENTE/CANCELADA/CONFIRMADA/REPROGRAMADA")
    page: int = Field(1, ge=1)
    per_page: int = Field(50, ge=1, le=100)

class ScheduleAsesoriaInput(BaseModel):
    advisor: str = Field(..., description="Nombre o email del asesor")
    service: str = Field(..., description="Nombre del servicio")
    start: datetime = Field(..., description="Inicio ISO8601 con TZ (America/Santiago)")
    end: Optional[datetime] = Field(None, description="(Opcional) Fin ISO8601 con TZ (America/Santiago)")
    origen: str = Field("chat", description="Origen de la reserva")
    notas: Optional[str] = Field(None, description="Notas opcionales")
    confirm: bool = Field(False, description="False=preview, True=ejecuta")
    user_id: Optional[UUID] = Field(None, description="ID de usuario autenticado, la tool resuelve docente_id")

class UpsertCalendarEventInput(BaseModel):
    asesoria_id: str = Field(..., description="UUID de la asesoría (asesoria.id)")
    organizer_usuario_id: str = Field(..., description="UUID del usuario organizador (asesor.usuario_id)")
    calendar_event_id: str = Field(..., description="ID del evento creado en Google Calendar")
    html_link: Optional[str] = Field(None, description="Link HTML del evento en Google")

class CancelAsesoriaInput(BaseModel):
    advisor: Optional[str] = Field(None, description="(Docente) Nombre o email del asesor")
    service: Optional[str] = Field(None, description="(Docente, opcional) Nombre del servicio")
    start: datetime = Field(..., description="Inicio ISO con TZ America/Santiago")
    end:   Optional[datetime] = Field(None, description="(Opcional) Fin ISO con TZ America/Santiago")
    confirm: bool = Field(False, description="False=preview, True=ejecuta")
    user_id: Optional[UUID] = Field(None, description="ID de usuario autenticado (JWT)")

class ConfirmAsesoriaInput(BaseModel):
    start: datetime = Field(..., description="Inicio ISO con TZ America/Santiago")
    end:   Optional[datetime] = Field(None, description="(Opcional) Fin ISO con TZ America/Santiago")
    advisor: str = Field(..., description="Nombre o email del asesor")
    confirm: bool = Field(False, description="False=preview, True=ejecuta")
    user_id: Optional[UUID] = Field(None, description="ID del usuario autenticado (JWT)")

async def _docente_id_from_user_id(session, user_id: UUID) -> UUID | None:
    row = (await session.execute(
        text("SELECT id FROM docente_perfil WHERE usuario_id = :uid AND activo IS TRUE LIMIT 1"),
        {"uid": str(user_id)}
    )).first()
    return row[0] if row else None

async def _profiles_from_user_id(session, user_id: UUID) -> dict:
    row = (await session.execute(
        text("""
        SELECT
          (SELECT id FROM docente_perfil WHERE usuario_id = :uid AND activo IS TRUE LIMIT 1) AS docente_id,
          (SELECT id FROM asesor_perfil  WHERE usuario_id = :uid AND activo IS TRUE LIMIT 1) AS asesor_id
        """),
        {"uid": str(user_id)}
    )).first()
    return {"docente_id": row[0] if row else None, "asesor_id": row[1] if row else None}

async def _get_usuario_email(session, usuario_id: UUID) -> str | None:
    q = select(UsuarioModel.email).where(UsuarioModel.id == usuario_id)
    return (await session.execute(q)).scalar_one_or_none()

async def _asesor_usuario_y_email(session, asesor_perfil_id: UUID) -> tuple[UUID | None, str | None]:
    q = (
        select(AsesorPerfilModel.usuario_id, UsuarioModel.email)
        .join(UsuarioModel, UsuarioModel.id == AsesorPerfilModel.usuario_id)
        .where(AsesorPerfilModel.id == asesor_perfil_id)
    )
    row = (await session.execute(q)).first()
    if not row:
        return None, None
    return row[0], row[1]

async def _google_refresh_token(session, usuario_id: UUID) -> str | None:
    q = (
        select(UserIdentityModel.refresh_token_hash)
        .where(UserIdentityModel.usuario_id == usuario_id)
        .where(UserIdentityModel.provider == "google")
        .limit(1)
    )
    return (await session.execute(q)).scalar_one_or_none()

def _fmt_item(it: Dict[str, Any]) -> Dict[str, Any]:
    title = it.get("title") or it.get("kind") or "Resultado"
    dist = it.get("dist")
    sub = f"sim={1.0 - float(dist):.3f}" if isinstance(dist, (int, float)) else ""
    return {"title": title, "subtitle": sub, "start": None, "end": None}

TZ_CL = ZoneInfo("America/Santiago")

def _fmt_local(dt):
    return dt.astimezone(TZ_CL).strftime("%d-%m-%Y %H:%M")

def build_mcp() -> FastMCP:
    app = FastMCP(name="cinap-db-mcp")
    TZ_CL = ZoneInfo("America/Santiago")

    @app.tool(name="list_advisors", description="Lista todos los asesores activos.")
    async def list_advisors():
        async with SAUnitOfWork() as uow:
            rows = await uow.advisors.list_all()
        items = [{"title": f"{r['nombre']}\n{r.get('email','')}", "id": r["id"]} for r in rows]
        return {"ok": True, "data": {"items": items}}

    @app.tool(name="list_services", description="Lista todos los servicios disponibles.")
    async def list_services():
        async with SAUnitOfWork() as uow:
            rows = await uow.services.list_all()
        items = [{"title": r["nombre"], "id": r["id"]} for r in rows]
        return {"ok": True, "data": {"items": items}}

    @app.tool(
    name="resolve_advisor",
    description="Resuelve y busca un asesor por nombre o email, devuelve 1 match o candidatos."
    )
    async def resolve_advisor(query: str, limit: int = 10):
        async with SAUnitOfWork() as uow:
            uc = ResolveAdvisor(uow.advisors)
            winner, cands = await uc.execute(ResolveAdvisorIn(query=query, limit=limit))
            if winner:
                detail = await uow.advisors.find_with_services(UUID(winner.id))
                return {"ok": True, "say": f"Asesor encontrado: {detail.get('nombre')}", "data": {"advisor": detail}}
            return {"ok": False, "reason":"AmbiguousAdvisor", "candidates":[c.__dict__ for c in cands]}

    @app.tool(
        name="resolve_service",
        description="Resuelve y busca un servicio por nombre, devuelve servicio con asesores."
    )
    async def resolve_service(query: str, limit: int = 10):
        async with SAUnitOfWork() as uow:
            uc = ResolveService(uow.services)
            winner, cands = await uc.execute(ResolveServiceIn(query=query, limit=limit))
            if winner:
                detail = await uow.services.find_with_advisors(UUID(winner.id))
                return {"ok": True, "say": f"Servicio encontrado: {detail.get('nombre')}", "data": {"service": detail}}
            return {"ok": False, "reason":"AmbiguousService", "candidates":[c.__dict__ for c in cands]}

    @app.tool(
        name="check_availability",
        description=(
            "Verifica y busca cupos abiertos entre start y end para un servicio (obligatorio) "
            "y opcionalmente un asesor."
        )
    )
    async def check_availability(input: CheckAvailabilityInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end   = input.end.astimezone(TZ_CL)   if input.end.tzinfo   else input.end.replace(tzinfo=TZ_CL)
            if start >= end:
                return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        q_service = norm_key(input.service)
        q_advisor = norm_key(input.advisor) if input.advisor else None

        def _get(obj, name, default=None):
            if isinstance(obj, dict):
                return obj.get(name, default)
            return getattr(obj, name, default)

        async with SAUnitOfWork() as uow:
            svc_win, svc_cands = await ResolveService(uow.services).execute(
                ResolveServiceIn(query=input.service, limit=20)
            )
            if not svc_win:
                norm_hits = [c for c in (svc_cands or []) if norm_key(c.nombre) == q_service]
                if len(norm_hits) == 1:
                    svc_win = norm_hits[0]
                else:
                    return {
                        "ok": False,
                        "error": {"code": "AmbiguousService", "message": "No se pudo resolver el servicio"},
                        "candidates": [c.__dict__ for c in (svc_cands or [])]
                    }
            svc_id = UUID(svc_win.id)
            svc_name = svc_win.nombre

            adv_id: Optional[UUID] = None
            adv_name: Optional[str] = None
            if input.advisor:
                adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(
                    ResolveAdvisorIn(query=input.advisor, limit=20)
                )
                if not adv_win:
                    norm_hits = [
                        c for c in (adv_cands or [])
                        if norm_key(c.nombre) == q_advisor or (c.email and norm_key(c.email) == q_advisor)
                    ]
                    if len(norm_hits) == 1:
                        adv_win = norm_hits[0]
                    else:
                        return {
                            "ok": False,
                            "error": {"code": "AmbiguousAdvisor", "message": "No se pudo resolver el asesor"},
                            "candidates": [c.__dict__ for c in (adv_cands or [])]
                        }
                adv_id = UUID(adv_win.id)
                adv_name = adv_win.nombre

            out = await CheckAvailability(uow).execute(AvailabilityIn(
                servicio_id=svc_id,
                asesor_id=adv_id,
                start=start,
                end=end,
                page=input.page,
                per_page=input.per_page,
            )) or []

            if not out:
                delta = timedelta(days=7)

                near_after = await CheckAvailability(uow).execute(AvailabilityIn(
                    servicio_id=svc_id,
                    asesor_id=adv_id,
                    start=end,
                    end=end + delta,
                    page=1,
                    per_page=10,
                )) or []

                near_before = await CheckAvailability(uow).execute(AvailabilityIn(
                    servicio_id=svc_id,
                    asesor_id=adv_id,
                    start=start - delta,
                    end=start,
                    page=1,
                    per_page=10,
                )) or []

                def _dist_seconds(slot):
                    si, sf = _get(slot, "inicio"), _get(slot, "fin")
                    d_after = (si - end).total_seconds() if si >= end else float("inf")
                    d_before = (start - sf).total_seconds() if sf <= start else float("inf")
                    return min(abs(d_after), abs(d_before))

                merged = { str(_get(s,"id")): s for s in [*near_after, *near_before] }.values()
                nearby_sorted = sorted(merged, key=_dist_seconds)[:10]

                if not nearby_sorted:
                    msg = (
                        f"No se encontraron cupos disponibles para el servicio '{svc_name}' "
                        f"{f'con {adv_name} ' if adv_name else ''}en el rango indicado."
                    )
                    return {"ok": True, "say": msg}

                slot_ids_needing_aid = []
                asesor_ids = set()
                for s in nearby_sorted:
                    aid = _get(s, "asesor_id")
                    if aid: asesor_ids.add(aid)
                    else:   slot_ids_needing_aid.append(_get(s, "id"))

                if slot_ids_needing_aid:
                    rows = (await uow.session.execute(
                        select(CupoORM.id, CupoORM.asesor_id).where(CupoORM.id.in_(slot_ids_needing_aid))
                    )).all()
                    cupo_to_asesor = {r.id: r.asesor_id for r in rows}
                else:
                    cupo_to_asesor = {}

                for s in nearby_sorted:
                    if not _get(s, "asesor_id"):
                        cupo_id = _get(s, "id")
                        aid = cupo_to_asesor.get(cupo_id)
                        if aid:
                            asesor_ids.add(aid)

                asesor_name_by_id: dict[str, str] = {}
                if not adv_name and asesor_ids:
                    rows = await uow.advisors.get_by_ids(list(asesor_ids))
                    asesor_name_by_id = { str(r["id"]): r["nombre"] for r in rows }

                items = []
                for slot in nearby_sorted:
                    s_id  = _get(slot, "id")
                    s_ini = _get(slot, "inicio")
                    s_fin = _get(slot, "fin")
                    sid   = _get(slot, "servicio_id")
                    aid   = _get(slot, "asesor_id") or cupo_to_asesor.get(s_id)
                    slot_adv_name = adv_name or (asesor_name_by_id.get(str(aid)) if aid else None) or "Asesor"

                    items.append({
                        "id": str(s_id),
                        "title": f"Cupo cercano — {svc_name}",
                        "subtitle": slot_adv_name,
                        "start": _fmt_local(s_ini),
                        "end":   s_fin.astimezone(TZ_CL).strftime("%H:%M"),
                        "servicio_id": str(sid),
                        "asesor_id": str(aid) if aid else None,
                    })

                return {
                    "ok": True,
                    "say": (
                        f"No hay cupos en el rango indicado, pero encontré opciones cercanas "
                    ),
                    "data": {
                        "items": items,
                        "nearby": True,
                        "pagination": {"page": 1, "per_page": len(items), "has_more": False}
                    }
                }

            def _get(obj, name, default=None):
                if isinstance(obj, dict): return obj.get(name, default)
                return getattr(obj, name, default)

            slot_ids_needing_aid = []
            asesor_ids = set()

            for s in out:
                aid = _get(s, "asesor_id")
                if aid:
                    asesor_ids.add(aid)
                else:
                    slot_ids_needing_aid.append(_get(s, "id"))

            if slot_ids_needing_aid:
                rows = (await uow.session.execute(
                    select(CupoORM.id, CupoORM.asesor_id).where(CupoORM.id.in_(slot_ids_needing_aid))
                )).all()
                cupo_to_asesor = {r.id: r.asesor_id for r in rows}
            else:
                cupo_to_asesor = {}

            for s in out:
                if not _get(s, "asesor_id"):
                    cupo_id = _get(s, "id")
                    aid = cupo_to_asesor.get(cupo_id)
                    if aid:
                        asesor_ids.add(aid)

            asesor_name_by_id: dict[str, str] = {}
            if not adv_name and asesor_ids:
                rows = await uow.advisors.get_by_ids(list(asesor_ids))
                asesor_name_by_id = { str(r["id"]): r["nombre"] for r in rows }

            items = []
            for slot in out:
                s_id  = _get(slot, "id")
                s_ini = _get(slot, "inicio")
                s_fin = _get(slot, "fin")
                sid   = _get(slot, "servicio_id")

                aid = _get(slot, "asesor_id") or cupo_to_asesor.get(s_id)

                slot_adv_name = (
                    adv_name or
                    (asesor_name_by_id.get(str(aid)) if aid else None) or
                    "Asesor"
                )

                items.append({
                    "id": str(s_id),
                    "title": f"Cupo — {svc_name}",
                    "subtitle": slot_adv_name,
                    "start": _fmt_local(s_ini),
                    "end":   s_fin.astimezone(TZ_CL).strftime("%H:%M"),
                    "servicio_id": str(sid),
                    "asesor_id": str(aid) if aid else None,
                })

            return {"ok": True, "data": {"items": items}}
        
    @app.tool(
        name="list_asesorias",
        description=(
            "Lista las asesorías asociadas al usuario (como docente o asesor) "
            "en el rango [start,end) en formato datetime. Requiere user_id."
        )
    )
    async def list_asesorias(input: ListAsesoriasInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end   = input.end.astimezone(TZ_CL)   if input.end.tzinfo   else input.end.replace(tzinfo=TZ_CL)
            if start >= end:
                return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        states = [EstadoAsesoria.PENDIENTE, EstadoAsesoria.CONFIRMADA]
        if input.estado:
            est = input.estado.strip().lower()
            if est in ("activas", "activa"):
                states = [EstadoAsesoria.PENDIENTE, EstadoAsesoria.CONFIRMADA]
            else:
                try:
                    states = [EstadoAsesoria[est.upper()]]
                except Exception:
                    return {"ok": False, "error": {"code": "VALIDATION", "message": f"estado inválido: {input.estado}"}}

        async with SAUnitOfWork() as uow:
            profs = await _profiles_from_user_id(uow.session, UUID(str(input.user_id)))
            my_docente_id, my_asesor_id = profs.get("docente_id"), profs.get("asesor_id")

            uc = ListUserAsesorias(uow)
            rows = await uc.execute(ListUserAsesoriasIn(
                user_docente_id=my_docente_id,
                user_asesor_id=my_asesor_id,
                tr=TimeRange(start=start, end=end),
                role=input.role,
                states=states,
                page=input.page,
                per_page=input.per_page,
            ))

            if rows:
                keep = {"PENDIENTE", "CONFIRMADA"}
                rows = [r for r in rows
                        if (getattr(r.get("estado"), "name", str(r.get("estado"))) in keep)]

            if not rows:
                return {"ok": True, "say": "No hay asesorías activas (pendientes/confirmadas) en el rango indicado."}

            servicio_ids = {r["servicio_id"] for r in rows if r.get("servicio_id")}
            asesor_ids   = {r["asesor_id"] for r in rows if r.get("asesor_id")}
            svc_map, adv_map = {}, {}

            if servicio_ids:
                svc_rows = (await uow.session.execute(
                    select(ServicioORM.id, ServicioORM.nombre).where(ServicioORM.id.in_(list(servicio_ids)))
                )).all()
                svc_map = {r.id: r.nombre for r in svc_rows}

            if asesor_ids:
                adv_rows = (await uow.session.execute(
                    select(AsesorPerfilModel.id, UsuarioModel.nombre, UsuarioModel.email)
                    .join(UsuarioModel, UsuarioModel.id == AsesorPerfilModel.usuario_id)
                    .where(AsesorPerfilModel.id.in_(list(asesor_ids)))
                )).all()
                adv_map = {r.id: (r.nombre or r.email or "Asesor") for r in adv_rows}

            docente_ids = {r["docente_id"] for r in rows if r.get("docente_id")}
            doc_map = {}
            if docente_ids:
                doc_rows = (await uow.session.execute(
                    select(DocentePerfilModel.id, UsuarioModel.nombre, UsuarioModel.email)
                    .join(UsuarioModel, UsuarioModel.id == DocentePerfilModel.usuario_id)
                    .where(DocentePerfilModel.id.in_(list(docente_ids)))
                )).all()
                doc_map = {r.id: (r.nombre or r.email or "Docente") for r in doc_rows}

            items = []
            for r in rows:
                svc = svc_map.get(r["servicio_id"], "Servicio")
                adv = adv_map.get(r["asesor_id"], "Asesor")
                doc = doc_map.get(r["docente_id"], "Docente")
                estado = getattr(r.get("estado"), "name", str(r.get("estado")))
                rol = r.get("rol")
                contraparte = adv if rol == "docente" else doc
                title = f"Asesoría — {svc}"
                subtitle = f"{contraparte} — Estado: {estado}"

                items.append({
                    "id": str(r["asesoria_id"]),
                    "title": title,
                    "subtitle": subtitle,
                    "start": _fmt_local(r["inicio"]),
                    "end":   r["fin"].astimezone(TZ_CL).strftime("%H:%M"),
                    "servicio_id": str(r["servicio_id"]) if r.get("servicio_id") else None,
                    "asesor_id":   str(r["asesor_id"]) if r.get("asesor_id") else None,
                    "estado": estado,
                    "role": rol,
                })

            return {"ok": True, "data": {"items": items}}
    
    @app.tool(
        name="schedule_asesoria",
        description=(
            "Reservar o agendar una asesoría. "
            "Usa confirm=false para preview y confirm=true para ejecutar. "
            "No insertes user_id, dado que lo hace el backend. Fechas en ISO con TZ America/Santiago."
        ),
    )
    async def schedule_asesoria(input: ScheduleAsesoriaInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end   = (input.end.astimezone(TZ_CL) if (input.end and input.end.tzinfo) else
                    (input.end.replace(tzinfo=TZ_CL) if input.end else None))
            if end is not None and start >= end:
                return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        async with SAUnitOfWork() as uow:
            if not input.user_id:
                return {"ok": False, "error": {"code": "MISSING_USER_ID", "message": "user_id no suministrado"}}
            try:
                docente_id = await _docente_id_from_user_id(uow.session, UUID(str(input.user_id)))
            except Exception:
                docente_id = None
            if not docente_id:
                return {"ok": False, "error": {"code": "MISSING_DOCENTE_ID", "message": "El usuario no tiene perfil docente"}}

            adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(ResolveAdvisorIn(query=input.advisor, limit=10))
            if not adv_win:
                return {"ok": False, "error": {"code": "AmbiguousAdvisor", "message": "No se pudo resolver el asesor"},
                        "candidates": [c.__dict__ for c in (adv_cands or [])]}

            svc_win, svc_cands = await ResolveService(uow.services).execute(ResolveServiceIn(query=input.service, limit=10))
            if not svc_win:
                return {"ok": False, "error": {"code": "AmbiguousService", "message": "No se pudo resolver el servicio"},
                        "candidates": [c.__dict__ for c in (svc_cands or [])]}

            asesor_id = UUID(adv_win.id)
            servicio_id = UUID(svc_win.id)

            docente_usuario_id = UUID(str(input.user_id))
            docente_email = await _get_usuario_email(uow.session, docente_usuario_id)

            asesor_usuario_id, asesor_email = await _asesor_usuario_y_email(uow.session, asesor_id)
            if not asesor_usuario_id:
                return {"ok": False, "error": {"code": "MISSING_ADVISOR_USER", "message": "No se encontró el usuario del asesor"}}

            asesor_refresh_token = await _google_refresh_token(uow.session, asesor_usuario_id)
            attendees = [docente_email] if docente_email else []

            chosen = None
            all_tried_slots = []

            if end is not None:
                slots = await CheckAvailability(uow).execute(AvailabilityIn(
                    asesor_id=asesor_id, servicio_id=servicio_id,
                    start=start, end=end, page=1, per_page=50
                )) or []
                all_tried_slots.extend(slots)
                exact = [s for s in slots if s.inicio == start and s.fin == end]
                chosen = exact[0] if exact else (slots[0] if slots else None)
            else:
                end_candidates = [start + timedelta(minutes=30), start + timedelta(minutes=60)]
                for ec in end_candidates:
                    slots = await CheckAvailability(uow).execute(AvailabilityIn(
                        asesor_id=asesor_id, servicio_id=servicio_id,
                        start=start, end=ec, page=1, per_page=50
                    )) or []
                    all_tried_slots.extend(slots)
                    exact = [s for s in slots if s.inicio == start and s.fin == ec]
                    if exact:
                        chosen = exact[0]
                        break

                if chosen is None:
                    win_end = start + timedelta(hours=3)
                    slots = await CheckAvailability(uow).execute(AvailabilityIn(
                        asesor_id=asesor_id, servicio_id=servicio_id,
                        start=start, end=win_end, page=1, per_page=50
                    )) or []
                    all_tried_slots.extend(slots)
                    same_start = sorted([s for s in slots if s.inicio == start], key=lambda x: x.fin)
                    chosen = same_start[0] if same_start else None

            if chosen is None:
                seen = set()
                alt = []
                for s in all_tried_slots:
                    sid = str(s.id)
                    if sid in seen:
                        continue
                    seen.add(sid)
                    alt.append({
                        "id": sid,
                        "title": f"Cupo — {getattr(adv_win,'nombre','Asesor')} — {svc_win.nombre}",
                        "start": s.inicio.astimezone(TZ_CL).isoformat(),
                        "end":   s.fin.astimezone(TZ_CL).isoformat(),
                        "servicio_id": str(s.servicio_id),
                    })
                return {"ok": False, "error": {"code": "NO_SLOT", "message": "No hay cupo exacto para ese inicio"},
                        "data": {"alternatives": alt[:10]}}

            preview = {
                "asesor": getattr(adv_win, "nombre", None) or "Asesor",
                "servicio": svc_win.nombre,
                "cupo_id": str(chosen.id),
                "inicio": chosen.inicio.astimezone(TZ_CL).isoformat(),
                "fin": chosen.fin.astimezone(TZ_CL).isoformat(),
                "origen": input.origen,
                "notas": input.notas,
            }

            if not input.confirm:
                say = (
                    f"¿Confirmas reservar con {preview['asesor']} ({preview['servicio']}) "
                    f"el {_fmt_local(chosen.inicio)}–{chosen.fin.astimezone(TZ_CL).strftime('%H:%M')}?"
                )
                return {"ok": True, "say": say, "data": {"preview": preview}}

            nueva = AsesoriaORM(
                docente_id=docente_id,
                cupo_id=chosen.id,
                estado=EstadoAsesoria.PENDIENTE,
                origen=input.origen,
                notas=input.notas,
            )
            uow.session.add(nueva)
            await uow.session.flush()

            say = (
                f"Asesoría reservada: {svc_win.nombre} con {getattr(adv_win,'nombre','Asesor')} "
                f"el {_fmt_local(chosen.inicio)}–{chosen.fin.astimezone(TZ_CL).strftime('%H:%M')}."
            )

            next_hint = None
            if asesor_refresh_token:
                next_hint = {
                    "next_tool": "event_create",
                    "suggested_args": {
                        "title": f"Asesoría — {svc_win.nombre} con {getattr(adv_win,'nombre','Asesor')}",
                        "start": chosen.inicio.astimezone(TZ_CL).isoformat(),
                        "end": chosen.fin.astimezone(TZ_CL).isoformat(),
                        "attendees": attendees,
                        "description": input.notas or "",
                        "calendar_id": "primary",
                        "refresh_token": asesor_refresh_token,
                        "asesoria_id": str(nueva.id),
                        "organizer_usuario_id": str(asesor_usuario_id),
                    }
                }
            else:
                say += " Ocurrió un error (OAUTH_REQUIRED). Falta vincular Google del asesor para enviar la invitación."

            payload = {
                "ok": True,
                "say": say,
                "data": {
                    "asesoria_id": str(nueva.id),
                    "cupo_id": str(chosen.id),
                    "advisor_id": str(asesor_id),
                    "service_id": str(servicio_id),
                    "start": chosen.inicio.astimezone(TZ_CL).isoformat(),
                    "end": chosen.fin.astimezone(TZ_CL).isoformat(),
                },
            }
            if next_hint:
                payload["data"]["next_hint"] = next_hint
            return payload
        
    @app.tool(
        name="calendar_event_upsert",
        description="Guarda el evento de Google Calendar asociado a una asesoría en la tabla calendar_event."
    )
    async def calendar_event_upsert(input: UpsertCalendarEventInput):
        async with SAUnitOfWork() as uow:
            repo = SqlAlchemyCalendarEventsRepo(uow.session)
            uc = UpsertCalendarEvent(repo)
            try:
                out = await uc.exec(UpsertCalendarEventIn(
                    asesoria_id=input.asesoria_id,
                    organizer_usuario_id=input.organizer_usuario_id,
                    calendar_event_id=input.calendar_event_id,
                    html_link=input.html_link
                ))
                return {"ok": True, "say": "Evento guardado en historial.", "data": out}
            except Exception as e:
                return {"ok": False, "error": {"code": "UPSERT_FAILED", "message": str(e)}}

    @app.tool(
        name="cancel_asesoria",
        description=(
            "Cancela una asesoría del usuario. Si el usuario es DOCENTE: indicar advisor (+service opcional) y el inicio exacto "
            "(end opcional). Si el usuario es ASESOR: basta indicar el inicio exacto; se usará su asesor_id. "
            "Si no se envía end, se asume duración 30m o 60m. "
            "Usa confirm=false para preview y confirm=true para ejecutar. No insertes user_id, lo hace el backend. "
            "La asesoría debe estar PENDIENTE o CONFIRMADA. Al cancelar, el cupo queda CANCELADO. "
            "Si cancela DOCENTE: solo marcar 'declined'. Si cancela ASESOR: solo eliminar el evento."
        ),
    )
    async def cancel_asesoria(input: CancelAsesoriaInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            if input.end is not None:
                end = input.end.astimezone(TZ_CL) if input.end.tzinfo else input.end.replace(tzinfo=TZ_CL)
                if start >= end:
                    return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
            else:
                end = None
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        end_candidates = None
        if end is None:
            end_candidates = [start + timedelta(minutes=30), start + timedelta(hours=1)]

        async with SAUnitOfWork() as uow:
            if not input.user_id:
                return {"ok": False, "error": {"code": "MISSING_USER_ID", "message": "user_id no suministrado"}}

            profs = await _profiles_from_user_id(uow.session, UUID(str(input.user_id)))
            my_docente_id, my_asesor_id = profs.get("docente_id"), profs.get("asesor_id")
            if not my_docente_id and not my_asesor_id:
                return {"ok": False, "error": {"code": "NO_ROLE", "message": "El usuario no es docente ni asesor"}}

            servicio_id = None
            if input.service:
                svc_win, svc_cands = await ResolveService(uow.services).execute(ResolveServiceIn(query=input.service, limit=10))
                if not svc_win:
                    return {"ok": False, "error": {"code": "AmbiguousService", "message": "No se pudo resolver el servicio"},
                            "candidates": [c.__dict__ for c in (svc_cands or [])]}
                servicio_id = UUID(svc_win.id)

            force_docente = bool(input.advisor)

            # Asesor
            if my_asesor_id and not force_docente and my_docente_id is None:
                q = select(CupoORM).where(
                    CupoORM.asesor_id == my_asesor_id,
                    CupoORM.inicio == start,
                )
                if servicio_id:
                    q = q.where(CupoORM.servicio_id == servicio_id)
                if end is not None:
                    q = q.where(CupoORM.fin == end)
                else:
                    q = q.where(CupoORM.fin.in_(end_candidates))

                cupos = (await uow.session.execute(q)).scalars().all()
                if not cupos:
                    return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo tuyo que comience en ese horario"}}
                if len(cupos) > 1 and servicio_id is None:
                    svc_rows = (await uow.session.execute(
                        select(ServicioORM.id, ServicioORM.nombre).where(ServicioORM.id.in_([c.servicio_id for c in cupos]))
                    )).all()
                    svc_name_by_id = {r.id: r.nombre for r in svc_rows}
                    return {
                        "ok": False,
                        "error": {"code": "AmbiguousServiceAtTime", "message": "Hay varios servicios a esa hora"},
                        "candidates": [
                            {"id": str(c.servicio_id),
                            "nombre": svc_name_by_id.get(c.servicio_id, "Servicio"),
                            "fin": c.fin.astimezone(TZ_CL).isoformat()}
                            for c in cupos
                        ],
                    }
                cupo = cupos[0]

                asesoria = (await uow.session.execute(
                    select(AsesoriaORM).where(
                        AsesoriaORM.cupo_id == cupo.id,
                        AsesoriaORM.estado.in_([EstadoAsesoria.PENDIENTE, EstadoAsesoria.CONFIRMADA]),
                    )
                )).scalar_one_or_none()
                if not asesoria:
                    return {"ok": False, "error": {"code": "APPT_NOT_FOUND", "message": "No hay asesoría pendiente o confirmada en ese cupo"}}

                asesor_usuario_id, _ = await _asesor_usuario_y_email(uow.session, cupo.asesor_id)
                asesor_refresh_token = await _google_refresh_token(uow.session, asesor_usuario_id)

                cal_rows = (await uow.session.execute(
                    select(CalendarEventORM).where(CalendarEventORM.asesoria_id == asesoria.id)
                )).scalars().all()

                if not input.confirm:
                    say = "¿Confirmas cancelar la asesoría y marcar el cupo como cancelado?"
                    preview = {
                        "asesor_id": str(my_asesor_id),
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "inicio": cupo.inicio.astimezone(TZ_CL).isoformat(),
                        "fin": cupo.fin.astimezone(TZ_CL).isoformat(),
                        "calendar_event_matches": [
                            {
                                "row_id": str(r.id),
                                "provider": r.provider,
                                "calendar_event_id": r.calendar_event_id,
                                "calendar_html_link": r.calendar_html_link,
                            } for r in cal_rows
                        ],
                    }
                    return {"ok": True, "say": say, "data": {"preview": preview}}

                asesoria.estado = EstadoAsesoria.CANCELADA
                cupo.estado = EstadoCupo.CANCELADO

                if cal_rows:
                    await uow.session.execute(
                        delete(CalendarEventORM).where(CalendarEventORM.id.in_([r.id for r in cal_rows]))
                    )

                await uow.session.flush()
                await uow.session.commit()

                say = "Asesoría cancelada y cupo cancelado."

                next_hint = None
                target = next((r for r in cal_rows if r.calendar_event_id), None)
                if target and asesor_refresh_token:
                    next_hint = {
                        "next_tool": "event_delete_by_id",
                        "suggested_args": {
                            "calendar_id": "primary",
                            "event_id": target.calendar_event_id,
                            "refresh_token": asesor_refresh_token,
                        }
                    }
                else:
                    if not target:
                        say += " No encontré evento de calendario para borrar."
                    if not asesor_refresh_token:
                        say += " Falta vincular Google del asesor para eliminar el evento."

                payload = {
                    "ok": True,
                    "say": say,
                    "data": {
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "estado_asesoria": "CANCELADA",
                        "estado_cupo": "CANCELADO",
                        "deleted_calendar_event_rows": len(cal_rows),
                    },
                }
                if next_hint:
                    payload["data"]["next_hint"] = next_hint
                return payload

            # Docente
            if my_docente_id:
                if not input.advisor:
                    return {"ok": False, "error": {"code": "MISSING_ADVISOR", "message": "Debes indicar el asesor"}}

                adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(
                    ResolveAdvisorIn(query=input.advisor, limit=10)
                )
                if not adv_win:
                    return {"ok": False, "error": {"code": "AmbiguousAdvisor", "message": "No se pudo resolver el asesor"},
                            "candidates": [c.__dict__ for c in (adv_cands or [])]}
                asesor_id = UUID(adv_win.id)

                q = select(CupoORM).where(
                    CupoORM.asesor_id == asesor_id,
                    CupoORM.inicio == start,
                )
                if servicio_id:
                    q = q.where(CupoORM.servicio_id == servicio_id)
                if end is not None:
                    q = q.where(CupoORM.fin == end)
                else:
                    q = q.where(CupoORM.fin.in_(end_candidates))

                cupos = (await uow.session.execute(q)).scalars().all()
                if not cupos:
                    return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo que comience a esa hora"}}
                if len(cupos) > 1 and servicio_id is None:
                    svc_rows = (await uow.session.execute(
                        select(ServicioORM.id, ServicioORM.nombre).where(ServicioORM.id.in_([c.servicio_id for c in cupos]))
                    )).all()
                    svc_name_by_id = {r.id: r.nombre for r in svc_rows}
                    return {
                        "ok": False,
                        "error": {"code": "AmbiguousServiceAtTime", "message": "Hay varios servicios a esa hora para el asesor"},
                        "candidates": [
                            {"id": str(c.servicio_id),
                            "nombre": svc_name_by_id.get(c.servicio_id, "Servicio"),
                            "fin": c.fin.astimezone(TZ_CL).isoformat()}
                            for c in cupos
                        ],
                    }

                cupo = cupos[0]

                asesoria = (await uow.session.execute(
                    select(AsesoriaORM).where(
                        AsesoriaORM.cupo_id == cupo.id,
                        AsesoriaORM.docente_id == my_docente_id,
                        AsesoriaORM.estado.in_([EstadoAsesoria.PENDIENTE, EstadoAsesoria.CONFIRMADA]),
                    )
                )).scalar_one_or_none()
                if not asesoria:
                    return {"ok": False, "error": {"code": "APPT_NOT_FOUND", "message": "No hay una asesoría pendiente o confirmada tuya en ese cupo"}}

                docente_usuario_id = UUID(str(input.user_id))
                docente_email = await _get_usuario_email(uow.session, docente_usuario_id)
                docente_refresh_token = await _google_refresh_token(uow.session, docente_usuario_id)

                asesor_usuario_id, _ = await _asesor_usuario_y_email(uow.session, cupo.asesor_id)
                asesor_refresh_token = await _google_refresh_token(uow.session, asesor_usuario_id)

                cal_rows = (await uow.session.execute(
                    select(CalendarEventORM).where(CalendarEventORM.asesoria_id == asesoria.id)
                )).scalars().all()

                if not input.confirm:
                    say = "¿Confirmas cancelar tu asesoría y marcar el cupo como cancelado?"
                    preview = {
                        "advisor_id": str(asesor_id),
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "inicio": cupo.inicio.astimezone(TZ_CL).isoformat(),
                        "fin": cupo.fin.astimezone(TZ_CL).isoformat(),
                        "calendar_event_matches": [
                            {
                                "row_id": str(r.id),
                                "provider": r.provider,
                                "calendar_event_id": r.calendar_event_id,
                                "calendar_html_link": r.calendar_html_link,
                            } for r in cal_rows
                        ],
                    }
                    return {"ok": True, "say": say, "data": {"preview": preview}}

                asesoria.estado = EstadoAsesoria.CANCELADA
                cupo.estado = EstadoCupo.CANCELADO

                if cal_rows:
                    await uow.session.execute(
                        delete(CalendarEventORM).where(CalendarEventORM.id.in_([r.id for r in cal_rows]))
                    )

                await uow.session.flush()
                await uow.session.commit()

                say = "Asesoría cancelada y cupo cancelado."

                next_hint = None
                target = next((r for r in cal_rows if r.calendar_event_id), None)
                if target and docente_email and docente_refresh_token:
                    next_hint = {
                        "next_tool": "event_patch_attendees",
                        "suggested_args": {
                            "calendar_id": "primary",
                            "event_id": target.calendar_event_id,
                            "attendees_patch": [{"email": docente_email, "responseStatus": "declined"}],
                            "refresh_token": docente_refresh_token,
                        }
                    }
                else:
                    if not target:
                        say += " No encontré evento de calendario asociado."
                    missing = []
                    if not docente_email: missing.append("correo del docente")
                    if not docente_refresh_token: missing.append("vincular Google del docente")
                    if missing:
                        say += " Falta " + " y ".join(missing) + " para actualizar tu asistencia en el calendario."

                payload = {
                    "ok": True,
                    "say": say,
                    "data": {
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "estado_asesoria": "CANCELADA",
                        "estado_cupo": "CANCELADO",
                        "deleted_calendar_event_rows": len(cal_rows),
                    },
                }
                if next_hint:
                    payload["data"]["next_hint"] = next_hint
                return payload

            return {"ok": False, "error": {"code": "MISSING_PARAMS", "message": "Faltan datos para cancelar (revisa asesor, servicio o el rango)"}}
        
    @app.tool(
        name="confirm_asesoria",
        description=(
            "Confirma la asistencia del docente a su asesoría (start obligatorio, end opcional, + advisor), "
            "cambiando estado a CONFIRMADA. Devuelve hints para marcar asistencia (responseStatus=accepted) "
            "en Google Calendar del docente autenticado."
        ),
    )
    async def confirm_asesoria(input: ConfirmAsesoriaInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end = None
            if input.end is not None:
                end = input.end.astimezone(TZ_CL) if input.end.tzinfo else input.end.replace(tzinfo=TZ_CL)
                if start >= end:
                    return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        async with SAUnitOfWork() as uow:
            if not input.user_id:
                return {"ok": False, "error": {"code": "MISSING_USER_ID", "message": "user_id no suministrado"}}

            profs = await _profiles_from_user_id(uow.session, UUID(str(input.user_id)))
            my_docente_id, my_asesor_id = profs.get("docente_id"), profs.get("asesor_id")

            if my_asesor_id and not my_docente_id:
                return {"ok": False, "error": {"code": "FORBIDDEN_ROLE", "message": "La asistencia debe ser confirmada por el DOCENTE."}}
            if not my_docente_id:
                return {"ok": False, "error": {"code": "NO_ROLE", "message": "El usuario no tiene perfil docente activo"}}

            docente_usuario_id = UUID(str(input.user_id))
            docente_email = await _get_usuario_email(uow.session, docente_usuario_id)
            docente_refresh_token = await _google_refresh_token(uow.session, docente_usuario_id)

            adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(ResolveAdvisorIn(query=input.advisor, limit=10))
            if not adv_win:
                return {"ok": False, "error": {"code": "AmbiguousAdvisor", "message": "No se pudo resolver el asesor"},
                        "candidates": [c.__dict__ for c in (adv_cands or [])]}
            asesor_id = UUID(adv_win.id)

            base_q = select(CupoORM).where(
                CupoORM.asesor_id == asesor_id,
                CupoORM.inicio == start,
            )

            if end is None:
                candidate_ends = [start + timedelta(minutes=30), start + timedelta(minutes=60)]
                q = base_q.where(CupoORM.fin.in_(candidate_ends))
            else:
                q = base_q.where(CupoORM.fin == end)

            cupos = (await uow.session.execute(q)).scalars().all()

            if not cupos:
                if end is None:
                    return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo que comience a esa hora (30m/60m)."}}
                return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo exacto para ese rango"}}

            if len(cupos) > 1 and end is None:
                svc_rows = (await uow.session.execute(
                    select(ServicioORM.id, ServicioORM.nombre).where(ServicioORM.id.in_([c.servicio_id for c in cupos]))
                )).all()
                svc_map = {r.id: r.nombre for r in svc_rows}
                candidates = [
                    {"servicio_id": str(c.servicio_id), "servicio": svc_map.get(c.servicio_id, "Servicio"),
                    "fin": c.fin.astimezone(TZ_CL).isoformat()}
                    for c in cupos
                ]
                return {
                    "ok": False,
                    "error": {"code": "AmbiguousDurationOrService", "message": "Hay más de un cupo a esa hora (30m/60m o varios servicios)."},
                    "candidates": candidates,
                }

            cupo = cupos[0]
            if end is None:
                end = cupo.fin

            asesoria = (await uow.session.execute(
                select(AsesoriaORM).where(
                    AsesoriaORM.cupo_id == cupo.id,
                    AsesoriaORM.docente_id == my_docente_id,
                )
            )).scalar_one_or_none()
            if not asesoria:
                return {"ok": False, "error": {"code": "APPT_NOT_FOUND", "message": "No hay una asesoría tuya en ese cupo"}}

            cal_rows = (await uow.session.execute(
                select(CalendarEventORM).where(CalendarEventORM.asesoria_id == asesoria.id)
            )).scalars().all()

            if not input.confirm:
                preview = {
                    "asesoria_id": str(asesoria.id),
                    "cupo_id": str(cupo.id),
                    "estado_actual": getattr(asesoria.estado, "name", str(asesoria.estado)),
                    "inicio": start.isoformat(),
                    "fin": end.isoformat(),
                    "calendar_event_matches": [
                        {
                            "row_id": str(r.id),
                            "provider": r.provider,
                            "calendar_event_id": r.calendar_event_id,
                            "calendar_html_link": r.calendar_html_link,
                        } for r in cal_rows
                    ],
                }
                say = f"¿Confirmas tu asistencia a la asesoría del {_fmt_local(start)}–{end.astimezone(TZ_CL).strftime('%H:%M')}?"
                return {"ok": True, "say": say, "data": {"preview": preview}}

            if asesoria.estado == EstadoAsesoria.CONFIRMADA:
                say = "La asesoría ya estaba confirmada."
                return {
                    "ok": True,
                    "say": say,
                    "data": {
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "estado_asesoria": "CONFIRMADA",
                    },
                }

            if asesoria.estado not in [EstadoAsesoria.PENDIENTE, EstadoAsesoria.REPROGRAMADA]:
                return {"ok": False, "error": {"code": "BAD_STATE", "message": f"No se puede confirmar desde estado {asesoria.estado.name}"}}

            asesoria.estado = EstadoAsesoria.CONFIRMADA
            await uow.session.flush()
            await uow.session.commit()

            say = "Asistencia confirmada."

            next_hint = None
            if docente_email and docente_refresh_token:
                target = next((r for r in cal_rows if r.calendar_event_id), None)
                if target:
                    next_hint = {
                        "next_tool": "event_patch_attendees",
                        "suggested_args": {
                            "calendar_id": "primary",
                            "event_id": target.calendar_event_id,
                            "attendees_patch": [{"email": docente_email, "responseStatus": "accepted"}],
                            "send_updates": "all",
                            "refresh_token": docente_refresh_token,
                        }
                    }
                else:
                    say += " No encontré evento de calendario asociado para marcar asistencia."
            else:
                faltante = []
                if not docente_email: faltante.append("correo del docente")
                if not docente_refresh_token: faltante.append("vincular Google del docente")
                if faltante:
                    say += " Falta " + " y ".join(faltante) + " para actualizar tu asistencia en el calendario."

            payload = {
                "ok": True,
                "say": say,
                "data": {
                    "asesoria_id": str(asesoria.id),
                    "cupo_id": str(cupo.id),
                    "estado_asesoria": "CONFIRMADA",
                },
            }
            if next_hint:
                payload["data"]["next_hint"] = next_hint
            return payload

    @app.tool(description="Busca conocimiento institucional/FAQ por similitud semántica (RAG CINAP). Devuelve solo el texto más relevante.")
    async def semantic_search(
        q: str,
        kinds: Optional[List[str]] = None,
        probes: int = 10
    ) -> Dict[str, Any]:
        payload = {
            "q": q,
            "top_k": 5,
            "probes": probes,
            "kinds": kinds or ["general.page","doc.chunk"],
        }

        try:
            client = await _get_client()
            r = await client.post(SEMANTIC_URL, json=payload)
            r.raise_for_status()
            data = r.json() or {}
        except Exception as e:
            return {"error": {"code": "HTTP_ERROR", "message": f"{e!s}"}}

        best = data.get("best")
        if best and (best.get("text") or "").strip():
            snippet = (best.get("text") or "").strip()
            return {"ok": True, "say": snippet}

        items = data.get("items") or []
        if not items:
            return {"ok": True, "say": "No encontré resultados para esa consulta."}

        it = items[0]
        body  = (it.get("text") or "").strip()
        max_len = 700
        if len(body) > max_len:
            body = body[:max_len].rsplit(" ", 1)[0] + "…"
        return {"ok": True, "say": body}

    return app