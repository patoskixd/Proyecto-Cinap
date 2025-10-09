from __future__ import annotations
from zoneinfo import ZoneInfo

from mcp.server.fastmcp import FastMCP

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID
from application.ports import Pagination, TimeRange
from frameworks_and_drivers.db.sa_repos import ServicioORM
from interface_adapters.services.text_norm import norm_key
from sqlalchemy import select, text

from application.dto import AvailabilityIn, OverlapIn
from application.use_cases.resolve_advisor import ResolveAdvisor, ResolveAdvisorIn
from application.use_cases.resolve_service import ResolveService, ResolveServiceIn
from application.use_cases.check_availability import CheckAvailability
from application.use_cases.detect_overlaps import DetectOverlaps
from frameworks_and_drivers.db.config import SAUnitOfWork
from frameworks_and_drivers.db.orm_models import AsesoriaORM, CupoORM, EstadoAsesoria, EstadoCupo
from frameworks_and_drivers.db.sa_repos import UsuarioORM as UsuarioModel, AsesorPerfilORM as AsesorPerfilModel
from frameworks_and_drivers.db.orm_models import UserIdentityORM as UserIdentityModel
from interface_adapters.gateways.calendar_gateway import NullCalendarGateway

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
    per_page: int = Field(10, ge=1, le=100)

class ScheduleAsesoriaInput(BaseModel):
    advisor: str = Field(..., description="Nombre o email del asesor")
    service: str = Field(..., description="Nombre del servicio")
    start: datetime = Field(..., description="Inicio ISO8601 con TZ (America/Santiago)")
    end: datetime = Field(..., description="Fin ISO8601 con TZ (America/Santiago)")
    origen: str = Field("chat", description="Origen de la reserva")
    notas: Optional[str] = Field(None, description="Notas opcionales")
    confirm: bool = Field(False, description="False=preview, True=ejecuta")
    user_id: Optional[UUID] = Field(None, description="ID de usuario autenticado, la tool resuelve docente_id")

class CancelAsesoriaInput(BaseModel):
    advisor: Optional[str] = Field(None, description="(Docente) Nombre o email del asesor")
    service: Optional[str] = Field(None, description="(Docente, opcional) Nombre del servicio")
    start: datetime = Field(..., description="Inicio ISO con TZ America/Santiago")
    end:   datetime = Field(..., description="Fin ISO con TZ America/Santiago")
    confirm: bool = Field(False, description="False=preview, True=ejecuta")
    user_id: Optional[UUID] = Field(None, description="ID de usuario autenticado (JWT)")

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
            "y opcionalmente un asesor. "
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
            ))
            out = out or []

            if not out:
                msg = (
                    f"No se encontraron cupos disponibles para el servicio '{svc_name}' "
                    f"{f"con {adv_name} " if adv_name else ''}en el rango indicado."
                )
                return {"ok": True, "say": msg}

            items = []
            for slot in out:
                title = f"Cupo — {adv_name}" if adv_name else f"Cupo — {svc_name}"
                items.append({
                    "id": str(slot.id),
                    "title": title,
                    "subtitle": svc_name,
                    "start": _fmt_local(slot.inicio),
                    "end":   slot.fin.astimezone(TZ_CL).strftime("%H:%M"),
                    "servicio_id": str(slot.servicio_id),
                })

            return {"ok": True, "data": {"items": items}}
    
    @app.tool(
        name="schedule_asesoria",
        description=(
            "Compuesta: resuelve advisor/service por texto, verifica cupo exacto en [start,end) y reserva. "
            "Usa confirm=false para preview y confirm=true para ejecutar. "
            "Requiere user_id. Fechas en ISO con TZ America/Santiago."
        ),
    )
    async def schedule_asesoria(input: ScheduleAsesoriaInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end   = input.end.astimezone(TZ_CL)   if input.end.tzinfo   else input.end.replace(tzinfo=TZ_CL)
            if start >= end:
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

            slots = await CheckAvailability(uow).execute(AvailabilityIn(
                asesor_id=asesor_id, servicio_id=servicio_id,
                start=start, end=end, page=1, per_page=50
            ))
            exact = [s for s in slots if s.inicio == start and s.fin == end]
            chosen = exact[0] if exact else (slots[0] if slots else None)

            if chosen is None:
                alt_items = [{
                    "id": str(s.id),
                    "title": f"Cupo — {getattr(adv_win,'nombre','Asesor')} — {svc_win.nombre}",
                    "start": s.inicio.astimezone(TZ_CL).isoformat(),
                    "end":   s.fin.astimezone(TZ_CL).isoformat(),
                    "servicio_id": str(s.servicio_id),
                } for s in slots]
                return {"ok": False, "error": {"code": "NO_SLOT", "message": "No hay cupo exacto para ese rango"},
                        "data": {"alternatives": alt_items}}

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
                say = f"¿Confirmas reservar con {preview['asesor']} ({preview['servicio']}) el {start:%Y-%m-%d %H:%M}–{end:%H:%M}?"
                next_hint = {
                    "next_tool": "event_create",
                    "suggested_args": {
                        "title": f"Asesoría — {preview['servicio']} con {preview['asesor']}",
                        "start": preview["inicio"],
                        "end": preview["fin"],
                        "attendees": attendees,
                        "description": input.notas or "",
                        "calendar_id": "primary",
                    }
                }
                return {"ok": True, "say": say, "data": {"preview": preview, "next_hint": next_hint}}

            nueva = AsesoriaORM(
                docente_id=docente_id,
                cupo_id=chosen.id,
                estado=EstadoAsesoria.PENDIENTE,
                origen=input.origen,
                notas=input.notas,
            )
            uow.session.add(nueva)
            await uow.session.flush()

            say = (f"Asesoría reservada: {svc_win.nombre} con {getattr(adv_win,'nombre','Asesor')} "
                f"el {start:%Y-%m-%d %H:%M}–{end:%H:%M}.")
            next_hint = {
                "next_tool": "event_create",
                "suggested_args": {
                    "title": f"Asesoría — {svc_win.nombre} con {getattr(adv_win,'nombre','Asesor')}",
                    "start": chosen.inicio.astimezone(TZ_CL).isoformat(),
                    "end": chosen.fin.astimezone(TZ_CL).isoformat(),
                    "attendees": attendees,
                    "description": input.notas or "",
                    "calendar_id": "primary",
                    **({"refresh_token": asesor_refresh_token} if asesor_refresh_token else {}),
                }
            }
            return {
                "ok": True,
                "say": say,
                "data": {
                    "asesoria_id": str(nueva.id),
                    "cupo_id": str(chosen.id),
                    "advisor_id": str(asesor_id),
                    "service_id": str(servicio_id),
                    "start": chosen.inicio.astimezone(TZ_CL).isoformat(),
                    "end": chosen.fin.astimezone(TZ_CL).isoformat(),
                    "next_hint": next_hint,
                },
            }
        
    @app.tool(
        name="cancel_asesoria",
        description=(
            "Cancela una asesoría del usuario. Si el usuario es DOCENTE: indicar advisor (+service opcional) y el rango exacto "
            "[start,end). Si el usuario es ASESOR: basta indicar el rango exacto; se usará su asesor_id. "
            "Usa confirm=false para preview y confirm=true para ejecutar. Requiere user_id (del JWT). "
            "La asesoría debe estar PENDIENTE. Al cancelar, el cupo queda ABIERTO."
        ),
    )
    async def cancel_asesoria(input: CancelAsesoriaInput):
        try:
            start = input.start.astimezone(TZ_CL) if input.start.tzinfo else input.start.replace(tzinfo=TZ_CL)
            end   = input.end.astimezone(TZ_CL)   if input.end.tzinfo   else input.end.replace(tzinfo=TZ_CL)
            if start >= end:
                return {"ok": False, "error": {"code": "VALIDATION", "message": "start debe ser anterior a end"}}
        except Exception as e:
            return {"ok": False, "error": {"code": "VALIDATION", "message": f"Fechas inválidas: {e}"}}

        async with SAUnitOfWork() as uow:
            if not input.user_id:
                return {"ok": False, "error": {"code": "MISSING_USER_ID", "message": "user_id no suministrado"}}
            profs = await _profiles_from_user_id(uow.session, UUID(str(input.user_id)))
            my_docente_id, my_asesor_id = profs.get("docente_id"), profs.get("asesor_id")
            if not my_docente_id and not my_asesor_id:
                return {"ok": False, "error": {"code": "NO_ROLE", "message": "El usuario no es docente ni asesor"}}

            # Asesor
            if my_asesor_id:
                cupo = (await uow.session.execute(
                    select(CupoORM).where(
                        CupoORM.asesor_id == my_asesor_id,
                        CupoORM.inicio == start,
                        CupoORM.fin == end,
                    )
                )).scalar_one_or_none()
                if not cupo:
                    if not my_docente_id:
                        return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo exacto tuyo en ese rango"}}
                else:
                    asesoria = (await uow.session.execute(
                        select(AsesoriaORM).where(
                            AsesoriaORM.cupo_id == cupo.id,
                            AsesoriaORM.estado == EstadoAsesoria.PENDIENTE,
                        )
                    )).scalar_one_or_none()
                    if not asesoria:
                        if not my_docente_id:
                            return {"ok": False, "error": {"code": "APPT_NOT_FOUND", "message": "No hay asesoría PENDIENTE en ese cupo"}}
                    else:
                        if not input.confirm:
                            return {
                                "ok": True,
                                "say": "¿Confirmas cancelar la asesoría y reabrir el cupo?",
                                "data": {
                                    "asesoria_id": str(asesoria.id),
                                    "cupo_id": str(cupo.id),
                                    "inicio": start.isoformat(),
                                    "fin": end.isoformat(),
                                }
                            }

                        asesoria.estado = EstadoAsesoria.CANCELADA
                        cupo.estado = EstadoCupo.ABIERTO
                        await uow.session.flush()
                        return {
                            "ok": True,
                            "say": "Asesoría cancelada y cupo reabierto.",
                            "data": {
                                "asesoria_id": str(asesoria.id),
                                "cupo_id": str(cupo.id),
                                "estado_asesoria": "CANCELADA",
                                "estado_cupo": "ABIERTO",
                            }
                        }

            # Docente
            if my_docente_id:
                if not input.advisor:
                    return {"ok": False, "error": {"code": "MISSING_ADVISOR", "message": "Debes indicar el asesor"}}

                adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(
                    ResolveAdvisorIn(query=input.advisor, limit=10)
                )
                if not adv_win:
                    return {"ok": False, "error": {"code": "AmbiguousAdvisor"}, "candidates": [c.__dict__ for c in (adv_cands or [])]}
                asesor_id = UUID(adv_win.id)

                servicio_id = None
                if input.service:
                    svc_win, svc_cands = await ResolveService(uow.services).execute(
                        ResolveServiceIn(query=input.service, limit=10)
                    )
                    if not svc_win:
                        return {"ok": False, "error": {"code": "AmbiguousService"}, "candidates": [c.__dict__ for c in (svc_cands or [])]}
                    servicio_id = UUID(svc_win.id)

                q = select(CupoORM).where(
                    CupoORM.asesor_id == asesor_id,
                    CupoORM.inicio == start,
                    CupoORM.fin == end,
                )
                if servicio_id:
                    q = q.where(CupoORM.servicio_id == servicio_id)

                cupos = (await uow.session.execute(q)).scalars().all()
                if not cupos:
                    return {"ok": False, "error": {"code": "CUP_NOT_FOUND", "message": "No existe un cupo exacto para ese rango"}}

                if len(cupos) > 1 and not servicio_id:
                    svc_rows = (await uow.session.execute(
                        select(ServicioORM.id, ServicioORM.nombre).where(
                            ServicioORM.id.in_([c.servicio_id for c in cupos])
                        )
                    )).all()
                    return {
                        "ok": False,
                        "error": {"code": "AmbiguousServiceAtTime", "message": "Hay varios servicios en ese horario para el asesor"},
                        "candidates": [{"id": str(r.id), "nombre": r.nombre} for r in svc_rows],
                    }

                cupo = cupos[0]

                asesoria = (await uow.session.execute(
                    select(AsesoriaORM).where(
                        AsesoriaORM.cupo_id == cupo.id,
                        AsesoriaORM.docente_id == my_docente_id,
                        AsesoriaORM.estado == EstadoAsesoria.PENDIENTE,
                    )
                )).scalar_one_or_none()
                if not asesoria:
                    return {"ok": False, "error": {"code": "APPT_NOT_FOUND", "message": "No hay una asesoría PENDIENTE tuya en ese cupo"}}

                if not input.confirm:
                    return {
                        "ok": True,
                        "say": "¿Confirmas cancelar tu asesoría y reabrir el cupo?",
                        "data": {
                            "asesoria_id": str(asesoria.id),
                            "cupo_id": str(cupo.id),
                            "inicio": start.isoformat(),
                            "fin": end.isoformat(),
                        }
                    }

                asesoria.estado = EstadoAsesoria.CANCELADA
                cupo.estado = EstadoCupo.ABIERTO
                await uow.session.flush()
                return {
                    "ok": True,
                    "say": "Asesoría cancelada y cupo reabierto.",
                    "data": {
                        "asesoria_id": str(asesoria.id),
                        "cupo_id": str(cupo.id),
                        "estado_asesoria": "CANCELADA",
                        "estado_cupo": "ABIERTO",
                    }
                }

            return {"ok": False, "error": {"code": "MISSING_PARAMS", "message": "Faltan datos para cancelar (revisa advisor/service o el rango)"}}

    return app