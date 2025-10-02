from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

from application.dto import AvailabilityIn, OverlapIn
from application.use_cases.resolve_advisor import ResolveAdvisor, ResolveAdvisorIn
from application.use_cases.resolve_service import ResolveService, ResolveServiceIn
from application.use_cases.check_availability import CheckAvailability
from application.use_cases.detect_overlaps import DetectOverlaps
from frameworks_and_drivers.db.config import SAUnitOfWork
from frameworks_and_drivers.db.orm_models import AsesoriaORM, CupoORM, EstadoAsesoria, EstadoCupo
from interface_adapters.gateways.calendar_gateway import NullCalendarGateway

class OverlapInput(BaseModel):
    asesor_id: int
    start: datetime
    end: datetime
    include_calendar: bool = False

class ResolveInput(BaseModel):
    query: str
    limit: int = 10

class AvailabilityInput(BaseModel):
        advisor: str = Field(..., description="nombre o email")
        service: Optional[str] = Field(None, description="nombre del servicio (opcional)")
        start: datetime
        end: datetime
        page: int = 1
        per_page: int = 50

class BookAsesoriaInput(BaseModel):
    docente_id: UUID = Field(..., description="ID del docente solicitante")
    cupo_id: UUID = Field(..., description="ID del cupo a reservar")
    origen: str = "chat"
    notas: str | None = None
    confirm: bool = False

class CancelAsesoriaInput(BaseModel):
    asesoria_id: UUID
    confirm: bool = False

def build_mcp() -> FastMCP:
    app = FastMCP(name="cinap-db-mcp")

    @app.tool(name="list_advisors", description="Lista todos los asesores activos.")
    async def list_advisors():
        async with SAUnitOfWork() as uow:
            rows = await uow.advisors.list_all()
        items = [{"title": f"{r['nombre']} — {r.get('email','')}", "id": r["id"]} for r in rows]
        return {"ok": True, "say": f"{len(items)} asesores encontrados.", "data": {"items": items}}

    @app.tool(name="list_services", description="Lista todos los servicios disponibles.")
    async def list_services():
        async with SAUnitOfWork() as uow:
            rows = await uow.services.list_all()
        items = [{"title": r["nombre"], "id": r["id"]} for r in rows]
        return {"ok": True, "say": f"{len(items)} servicios disponibles.", "data": {"items": items}}

    @app.tool(
    name="resolve_advisor",
    description="Resuelve un asesor por nombre o email, devuelve 1 match o candidatos."
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
        description="Resuelve un servicio por nombre, devuelve servicio con asesores."
    )
    async def resolve_service(query: str, limit: int = 10):
        async with SAUnitOfWork() as uow:
            uc = ResolveService(uow.services)
            winner, cands = await uc.execute(ResolveServiceIn(query=query, limit=limit))
            if winner:
                detail = await uow.services.find_with_advisors(UUID(winner.id))
                return {"ok": True, "say": f"Servicio: {detail.get('nombre')}", "data": {"service": detail}}
            return {"ok": False, "reason":"AmbiguousService", "candidates":[c.__dict__ for c in cands]}

    @app.tool(
    name="check_availability",
    description="Resolución por texto: advisor (nombre/email) y service (nombre). Si hay ambigüedad, devuelve candidatos."
    )
    async def check_availability(input: AvailabilityInput):
        async with SAUnitOfWork() as uow:
            adv_win, adv_cands = await ResolveAdvisor(uow.advisors).execute(
                ResolveAdvisorIn(query=input.advisor)
            )
            if adv_win is None:
                return {
                    "ok": False,
                    "reason": "AmbiguousAdvisor",
                    "candidates": [c.__dict__ for c in adv_cands]
                }

            svc_id: Optional[UUID] = None
            svc_name: Optional[str] = None
            if input.service:
                svc_win, svc_cands = await ResolveService(uow.services).execute(
                    ResolveServiceIn(query=input.service)
                )
                if svc_win is None:
                    return {
                        "ok": False,
                        "reason": "AmbiguousService",
                        "candidates": [c.__dict__ for c in svc_cands]
                    }
                svc_id = UUID(svc_win.id)
                svc_name = svc_win.nombre

            out = await CheckAvailability(uow).execute(
                AvailabilityIn(
                    asesor_id=UUID(adv_win.id),
                    servicio_id=svc_id,
                    start=input.start,
                    end=input.end,
                    page=input.page,
                    per_page=input.per_page,
                )
            )

            advisor_title = adv_win.nombre if getattr(adv_win, "nombre", None) else "Asesor"
            service_title = svc_name or "Servicio"
            def _mk_title(slot) -> str:
                return f"Cupo — {advisor_title}" + (f" — {service_title}" if svc_name else "")

            items = [{
                "id": str(slot.id),
                "title": _mk_title(slot),
                "start": slot.inicio.isoformat(),
                "end": slot.fin.isoformat(),
                "servicio_id": str(slot.servicio_id),
            } for slot in out]

            say = f"{len(items)} cupo(s) disponibles."
            return {"ok": True, "say": say, "data": {"items": items}}

    @app.tool(
        name="detect_overlaps",
        description="Detecta solapamientos de un asesor en un rango."
    )
    async def detect_overlaps(input: OverlapInput):
        calendar = NullCalendarGateway()
        uc = DetectOverlaps(SAUnitOfWork(), calendar)
        out = await uc.execute(OverlapIn(**input.model_dump()))
        return [o.__dict__ for o in out]
    
    @app.tool(name="book_asesoria", description="Reserva un cupo creando una asesoría. Usa confirm=false para preview y confirm=true para ejecutar.")
    async def book_asesoria(input: BookAsesoriaInput):
        async with SAUnitOfWork() as uow:
            cupo = await uow.session.get(CupoORM, input.cupo_id)
            if not cupo:
                return {"ok": False, "error": {"code": "CUPO_NOT_FOUND", "message": "Cupo inexistente"}}
            if cupo.estado != EstadoCupo.ABIERTO:
                return {"ok": False, "error": {"code": "CUPO_NOT_OPEN", "message": f"Cupo no disponible (estado={cupo.estado})"}}

            preview = {
                "asesor_id": str(cupo.asesor_id),
                "cupo_id": str(cupo.id),
                "inicio": cupo.inicio.isoformat(),
                "fin": cupo.fin.isoformat(),
                "servicio_id": str(cupo.servicio_id),
                "origen": input.origen,
                "notas": input.notas,
            }
            if not input.confirm:
                return {"ok": True, "say": f"¿Confirmas la reserva para el {cupo.inicio:%Y-%m-%d %H:%M}?", "data": {"preview": preview}}

            nueva = AsesoriaORM(
                docente_id=input.docente_id,
                cupo_id=input.cupo_id,
                estado=EstadoAsesoria.PENDIENTE,
                origen=input.origen,
                notas=input.notas,
            )
            uow.session.add(nueva)
            await uow.session.flush()

            return {
                "ok": True,
                "say": f"Asesoría reservada para {cupo.inicio:%Y-%m-%d %H:%M}.",
                "data": {"asesoria_id": str(nueva.id), "cupo_id": str(cupo.id)}
            }
        
    @app.tool(name="cancel_asesoria",
          description="Cancela una asesoría y reabre el cupo.")
    async def cancel_asesoria(input: CancelAsesoriaInput):
        async with SAUnitOfWork() as uow:
            a = await uow.session.get(AsesoriaORM, input.asesoria_id)
            if not a:
                return {"ok": False, "error": {"code":"NOT_FOUND","message":"Asesoría inexistente"}}
            if not input.confirm:
                return {"ok": True, "say":"¿Confirmas cancelar esta asesoría?", "data":{"preview":{"asesoria_id": str(a.id)}}}
            await uow.session.delete(a)
            await uow.session.flush()
            return {"ok": True, "say":"Asesoría cancelada.", "data":{"asesoria_id": str(a.id)}}

    return app