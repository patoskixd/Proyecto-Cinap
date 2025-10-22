from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.interface_adapters.controllers.auth_helpers import get_user_profile_info
from app.interface_adapters.gateways.calendar.google_calendar_client import GoogleCalendarClient
from app.interface_adapters.gateways.db.sqlalchemy_asesoria_repo import SqlAlchemyAsesoriaRepo
from app.interface_adapters.gateways.db.sqlalchemy_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from app.interface_adapters.gateways.db.sqlalchemy_reservations_repo import SqlAlchemyReservationsRepo
from app.interface_adapters.gateways.db.sqlalchemy_slot_reader import SqlAlchemySlotReader
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.orm.models_auth import UsuarioModel
from app.interface_adapters.orm.models_scheduling import (
    AsesorPerfilModel,
    AsesorServicioModel,
    CategoriaModel,
    CupoModel,
    ServicioModel,
)
from app.frameworks_drivers.config.settings import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from app.use_cases.asesorias.cancel_reservation import CancelReservation
from app.use_cases.asesorias.confirm_reservation import ConfirmReservation
from app.use_cases.asesorias.decline_reservation import DeclineReservation
from app.use_cases.asesorias.create_asesoria_and_invite import CreateAsesoriaAndInvite
from app.use_cases.ports.asesoria_port import CreateAsesoriaIn
from app.use_cases.ports.reservations_repo import ReservationsQuery
from app.use_cases.ports.token_port import JwtPort


class CreateAsesoriaBody(BaseModel):
    cupoId: str = Field(..., alias="cupo_id")
    origen: str | None = None
    notas: str | None = None


def make_asesorias_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/api/asesorias", tags=["asesorias"])

    def ensure_user(req: Request) -> dict[str, Any]:
        token = req.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            return jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    def calendar_client(session: AsyncSession) -> GoogleCalendarClient:
        user_repo = SqlAlchemyUserRepo(session, default_role_id=None)
        return GoogleCalendarClient(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            get_refresh_token_by_usuario_id=user_repo.get_refresh_token_by_usuario_id,
        )

    @r.post("", status_code=201)
    async def create_asesoria(
        request: Request,
        body: CreateAsesoriaBody,
        db: AsyncSession = Depends(get_session_dep),
    ):
        data = ensure_user(request)
        usuario_id = str(data.get("sub"))
        asesoria_repo = SqlAlchemyAsesoriaRepo(db)
        slot_reader = SqlAlchemySlotReader(db)
        cal = calendar_client(db)
        cal_repo = SqlAlchemyCalendarEventsRepo(db)

        uc = CreateAsesoriaAndInvite(asesoria_repo, cal, slot_reader, cal_repo)

        out = await uc.exec(
            CreateAsesoriaIn(
                docente_usuario_id=usuario_id,
                cupo_id=body.cupoId,
                origen=body.origen,
                notas=body.notas,
            )
        )
        return out

    @r.get("/create-data")
    async def create_data(
        request: Request,
        db: AsyncSession = Depends(get_session_dep),
    ):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

        cupos_abiertos = (
            await db.execute(select(CupoModel.servicio_id, CupoModel.asesor_id).where(CupoModel.estado == "ABIERTO"))
        ).all()
        servicios_con_cupo = set(str(sid) for sid, _ in cupos_abiertos)
        asesores_por_servicio: dict[str, set[str]] = {}
        for sid, aid in cupos_abiertos:
            asesores_por_servicio.setdefault(str(sid), set()).add(str(aid))

        svcs = (await db.execute(select(ServicioModel).where(ServicioModel.activo == True))).scalars().all()
        services_by_cat: dict[str, list[dict]] = {}
        for s in svcs:
            if str(s.id) not in servicios_con_cupo:
                continue
            services_by_cat.setdefault(str(s.categoria_id), []).append(
                {
                    "id": str(s.id),
                    "categoryId": str(s.categoria_id),
                    "name": s.nombre,
                    "description": "",
                    "duration": f"{s.duracion_minutos} min",
                }
            )

        cats = (await db.execute(select(CategoriaModel).where(CategoriaModel.activo == True))).scalars().all()
        categories = [
            {"id": str(c.id), "icon": "📘", "name": c.nombre, "description": c.descripcion or ""}
            for c in cats
            if str(c.id) in services_by_cat
        ]

        asesores = (
            await db.execute(
                select(AsesorPerfilModel, UsuarioModel)
                .join(UsuarioModel, UsuarioModel.id == AsesorPerfilModel.usuario_id)
                .where(AsesorPerfilModel.activo == True)
            )
        ).all()
        asesores_dict = {str(a[0].id): a for a in asesores}

        asesores_servicio = (await db.execute(select(AsesorServicioModel))).scalars().all()
        advisors_by_service: dict[str, list[dict]] = {}
        for asv in asesores_servicio:
            sid = str(asv.servicio_id)
            aid = str(asv.asesor_id)
            if sid not in servicios_con_cupo:
                continue
            if aid not in asesores_por_servicio.get(sid, set()):
                continue
            asesor_tuple = asesores_dict.get(aid)
            if asesor_tuple:
                asesor, usuario = asesor_tuple
                advisors_by_service.setdefault(sid, []).append(
                    {
                        "id": str(asesor.id),
                        "name": usuario.nombre,
                        "email": usuario.email,
                        "specialties": [],
                    }
                )

        times = [f"{h:02d}:00" for h in range(8, 19)]

        return {
            "categories": categories,
            "servicesByCategory": services_by_cat,
            "advisorsByService": advisors_by_service,
            "times": times,
        }

    @r.get("")
    async def list_reservations(
        request: Request,
        kind: Literal["upcoming", "past"] = Query("upcoming"),
        page: int = Query(1, ge=1),
        limit: int = Query(30, ge=1, le=100),
        status_filter: Optional[str] = Query(None, alias="status"),
        category: Optional[str] = Query(None),
        service: Optional[str] = Query(None),
        advisor: Optional[str] = Query(None),
        date_from: Optional[str] = Query(None),
        db: AsyncSession = Depends(get_session_dep),
    ):
        data = ensure_user(request)
        role_name, profile_uuid = await get_user_profile_info(data, db)
        role_norm = role_name.strip().lower()

        parsed_date = None
        if date_from:
            try:
                parsed_date = datetime.fromisoformat(date_from).date()
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="dateFrom inválida")

        repo = SqlAlchemyReservationsRepo(db)
        query = ReservationsQuery(
            role=role_norm,
            profile_id=profile_uuid,
            kind=kind,
            page=page,
            limit=min(limit, 100),
            status=status_filter.upper() if status_filter else None,
            category=category,
            service=service,
            advisor=advisor,
            date_from=parsed_date,
        )

        page_data = await repo.list(query)

        items = []
        for item in page_data.items:
            items.append(
                {
                    "id": str(item.id),
                    "status": item.estado.lower(),
                    "inicio": item.inicio.isoformat(),
                    "fin": item.fin.isoformat(),
                    "servicio": {
                        "id": str(item.servicio_id),
                        "nombre": item.servicio_nombre,
                        "categoria": {
                            "id": str(item.categoria_id),
                            "nombre": item.categoria_nombre,
                        },
                    },
                    "duracionMinutos": item.duracion_minutos,
                    "asesor": (
                        None
                        if item.asesor_id is None and item.asesor_nombre is None and item.asesor_email is None
                        else {
                            "id": str(item.asesor_id) if item.asesor_id else None,
                            "nombre": item.asesor_nombre,
                            "email": item.asesor_email,
                        }
                    ),
                    "docente": {
                        "nombre": item.docente_nombre,
                        "email": item.docente_email,
                    },
                    "location": item.location_text,
                }
            )

        capabilities = {
            "canCancel": kind != "past" and role_norm in ("admin", "asesor", "profesor"),
            "canConfirm": kind != "past" and role_norm in ("profesor",),
        }

        return {
            "success": True,
            "meta": {
                "page": page_data.page,
                "pages": page_data.pages,
                "total": page_data.total,
                "role": role_norm,
                "capabilities": capabilities,
            },
            "data": items,
        }

    @r.post("/{asesoria_id}/cancel", status_code=204)
    async def cancel_reservation(
        asesoria_id: str,
        request: Request,
        db: AsyncSession = Depends(get_session_dep),
    ):
        data = ensure_user(request)
        role_name, _ = await get_user_profile_info(data, db)
        role_norm = role_name.strip().lower()
        if role_norm not in ("admin", "asesor", "profesor"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para cancelar")

        cal_repo = SqlAlchemyCalendarEventsRepo(db)
        reservations_repo = SqlAlchemyReservationsRepo(db)
        calendar = calendar_client(db)

        if role_norm == "profesor":
            usecase = DeclineReservation(reservations_repo, cal_repo, calendar)
            actor_id = UUID(str(data.get("sub")))
            await usecase.exec(UUID(asesoria_id), actor_usuario_id=actor_id)
        else:
            usecase = CancelReservation(cal_repo, calendar)
            await usecase.exec(UUID(asesoria_id))
        return None

    @r.post("/{asesoria_id}/confirm", status_code=204)
    async def confirm_reservation(
        asesoria_id: str,
        request: Request,
        db: AsyncSession = Depends(get_session_dep),
    ):
        data = ensure_user(request)
        role_name, _ = await get_user_profile_info(data, db)
        role_norm = role_name.strip().lower()
        if role_norm not in ("admin", "profesor"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para confirmar")

        calendar = calendar_client(db)
        cal_repo = SqlAlchemyCalendarEventsRepo(db)
        reservations_repo = SqlAlchemyReservationsRepo(db)
        usecase = ConfirmReservation(reservations_repo, cal_repo, calendar)
        actor_id = UUID(str(data.get("sub")))
        await usecase.exec(UUID(asesoria_id), actor_usuario_id=actor_id)
        return None

    return r
