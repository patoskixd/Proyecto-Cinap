from __future__ import annotations
from typing import Callable, Optional, Literal
from uuid import UUID
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo



import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Request, Body, Query
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.use_cases.slots.open_slots import (
    OpenSlotsUseCase, OpenSlotsInput, UIRuleIn, OpenSlotsConflict
)
from app.interface_adapters.gateways.db.sqlalchemy_slots_repo import SqlAlchemySlotsRepo
from app.interface_adapters.orm.models_scheduling import (
    CupoModel,
    ServicioModel,
    CategoriaModel,
    RecursoModel,
    EdificioModel,
    CampusModel,
    EstadoCupo,
    AsesoriaModel,
)
from app.interface_adapters.orm.models_scheduling import EstadoAsesoria


class ResourceOut(BaseModel):
    id: str
    tipo: str
    number: str | None = None
    alias: str
    capacity: int | None = None
    buildingId: str | None = None
    building: str | None = None
    campusId: str | None = None
    campus: str | None = None


class CreateDataOut(BaseModel):
    categories: list[dict]
    servicesByCategory: dict[str, list[dict]]
    times: list[str]
    resources: list[ResourceOut]


class RuleIn(BaseModel):
    day: str
    startTime: str
    endTime: str
    isoDate: str | None = None


class OpenSlotsIn(BaseModel):
    serviceId: str
    recursoId: Optional[str] = None
    location: str = ""
    room: str = ""
    roomNotes: str | None = None
    schedules: list[RuleIn] = Field(default_factory=list)
    tz: str = "America/Santiago"


class MySlotOut(BaseModel):
    id: str
    category: str
    service: str
    date: str        
    time: str        
    duration: int
    location: str
    room: str
    status: Literal["disponible", "ocupado", "cancelado", "expirado", "realizado"]
    student: dict | None = None
    notes: str | None = None
    locked: bool = False


class MySlotPatchIn(BaseModel):
    date: str | None = None
    time: str | None = None
    duration: int | None = None
    location: str | None = None
    room: str | None = None
    notes: str | None = None
    status: Literal["disponible", "ocupado", "cancelado", "expirado"] | None = None
    tz: str = "America/Santiago"


class FindSlotOut(BaseModel):
    cupoId: str
    serviceId: str
    category: str
    service: str
    date: str          
    time: str          
    duration: int
    campus: str | None = None
    building: str | None = None
    roomNumber: str | None = None
    resourceAlias: str | None = None
    notas: str | None = None  

class MySlotsStatsOut(BaseModel):
    total: int
    disponibles: int
    ocupadas_min: int

class MySlotsPageOut(BaseModel):
    items: list[MySlotOut]
    page: int
    per_page: int
    total: int
    pages: int
    stats: MySlotsStatsOut



def make_slots_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/api/slots", tags=["slots"])

    def db_to_ui_estado(s) -> str:
        if isinstance(s, EstadoCupo):
            s = s.value
        return {
            "ABIERTO": "disponible",
            "RESERVADO": "ocupado",
            "CANCELADO": "cancelado",
            "EXPIRADO": "expirado",
            "REALIZADO": "realizado",
        }.get(s, "disponible")

    def ui_to_db_estado(s: str) -> EstadoCupo:
        return {
            "disponible": EstadoCupo.ABIERTO,
            "ocupado": EstadoCupo.RESERVADO,
            "cancelado": EstadoCupo.CANCELADO,
            "expirado": EstadoCupo.EXPIRADO,
            "realizado": EstadoCupo.REALIZADO,
        }[s]

    locked_expr = sa.exists(
        sa.select(sa.literal(1))
        .select_from(AsesoriaModel)
        .where(
            AsesoriaModel.cupo_id == CupoModel.id,
            AsesoriaModel.estado == EstadoAsesoria.CANCELADA,
        )
    ).label("locked")

    def fmt_slot_row_to_out(row) -> MySlotOut:
        ini = row.inicio.astimezone(ZoneInfo("America/Santiago"))
        fin = row.fin.astimezone(ZoneInfo("America/Santiago"))
        dur = int((fin - ini).total_seconds() // 60) or int(row.duracion_minutos)
        loc = " / ".join(x for x in [row.campus, row.edificio, row.recurso_alias] if x)
        return MySlotOut(
            id=str(row.id),
            category=row.categoria,
            service=row.servicio,
            date=ini.strftime("%Y-%m-%d"),
            time=ini.strftime("%H:%M"),
            duration=dur,
            location=loc,
            room=row.sala_numero or "",
            status=db_to_ui_estado(row.estado),
            student=None,
            notes=row.notas,
            locked=bool(getattr(row, "locked", False)),
        )

    @r.get("/create-data", response_model=CreateDataOut)
    async def create_data(request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        repo = SqlAlchemySlotsRepo(session)
        asesor_id = await repo.resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            base = await repo.get_common_times_and_resources()
            return {
                "categories": [],
                "servicesByCategory": {},
                "times": base["times"],
                "resources": base["resources"],
            }
        return await repo.get_create_slots_data_for_advisor(asesor_id)

    @r.get("/find", response_model=list[FindSlotOut])
    async def find_slots(
        request: Request,
        session: AsyncSession = Depends(get_session_dep),
        serviceId: Optional[str] = Query(None),
        fromDate: str = Query(..., description="YYYY-MM-DD"),
        toDate: str = Query(..., description="YYYY-MM-DD"),
        campusId: Optional[str] = Query(None),
        buildingId: Optional[str] = Query(None),
        resourceId: Optional[str] = Query(None),
        tz: str = Query("America/Santiago"),
    ):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            jwt_port.decode(token) 
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")
        try:
            start_local = datetime.strptime(fromDate, "%Y-%m-%d").replace(tzinfo=ZoneInfo(tz))
            end_local = (datetime.strptime(toDate, "%Y-%m-%d") + timedelta(days=1)).replace(tzinfo=ZoneInfo(tz))
        except ValueError:
            raise HTTPException(status_code=422, detail="Parámetros de fecha inválidos")

        start_dt = start_local
        end_dt = end_local

        repo = SqlAlchemySlotsRepo(session)

        exp = await repo.expire_open_slots()        # ABIERTO -> EXPIRADO
        done = await repo.complete_reserved_slots()  # RESERVADO -> REALIZADO

        if exp or done:
            await session.commit()

        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio,
                CupoModel.fin,
                CupoModel.notas,  
                ServicioModel.id.label("servicio_id"),
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero,
                RecursoModel.nombre.label("recurso_alias"),
                EdificioModel.nombre.label("edificio"),
                CampusModel.nombre.label("campus"),
                locked_expr,
            )
            .join(ServicioModel, ServicioModel.id == CupoModel.servicio_id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .join(RecursoModel, RecursoModel.id == CupoModel.recurso_id)
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id, isouter=True)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id, isouter=True)
            .where(
                CupoModel.estado == EstadoCupo.ABIERTO,
                CupoModel.inicio >= start_dt,
                CupoModel.inicio < end_dt,
            )
            .order_by(CupoModel.inicio.asc())
        )

        if serviceId:
            j = j.where(CupoModel.servicio_id == UUID(serviceId))
        if resourceId:
            j = j.where(CupoModel.recurso_id == UUID(resourceId))
        if buildingId:
            j = j.where(EdificioModel.id == UUID(buildingId))
        if campusId:
            j = j.where(CampusModel.id == UUID(campusId))

        rows = (await session.execute(j)).all()

        out: list[FindSlotOut] = []
        for r in rows:
            ini_local = r.inicio.astimezone(ZoneInfo(tz))
            fin_local = r.fin.astimezone(ZoneInfo(tz))
            duration = int((fin_local - ini_local).total_seconds() // 60) or int(r.duracion_minutos)
            out.append(
                FindSlotOut(
                    cupoId=str(r.id),
                    serviceId=str(r.servicio_id),
                    category=r.categoria,
                    service=r.servicio,
                    date=ini_local.strftime("%Y-%m-%d"),
                    time=ini_local.strftime("%H:%M"),
                    duration=duration,
                    campus=r.campus,
                    building=r.edificio,
                    roomNumber=r.sala_numero,
                    resourceAlias=r.recurso_alias,
                    notas=r.notas,  
                )
            )
        return out

    @r.post("/find", response_model=list[FindSlotOut])
    async def find_slots_post(
        request: Request,
        session: AsyncSession = Depends(get_session_dep),
    ):
        data = await request.json()
        serviceId = data.get("serviceId")
        fromDate = data.get("dateFrom") or data.get("fromDate")
        toDate = data.get("dateTo") or data.get("toDate")
        campusId = data.get("campusId")
        buildingId = data.get("buildingId")
        resourceId = data.get("resourceId")
        tz = data.get("tz", "America/Santiago")

        return await find_slots(
            request=request,
            session=session,
            serviceId=serviceId,
            fromDate=fromDate,
            toDate=toDate,
            campusId=campusId,
            buildingId=buildingId,
            resourceId=resourceId,
            tz=tz,
        )

    @r.post("/open")
    async def open_slots(request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        raw = await request.json()
        try:
            payload = OpenSlotsIn(**raw)
        except ValidationError as ve:
            raise HTTPException(status_code=422, detail=ve.errors())

        uc = OpenSlotsUseCase(SqlAlchemySlotsRepo(session))
        try:
            res = await uc.exec(
                OpenSlotsInput(
                    usuario_id=str(data.get("sub")),
                    service_id=payload.serviceId,
                    recurso_id=payload.recursoId,
                    location=payload.location,
                    room=payload.room,
                    roomNotes=payload.roomNotes,
                    schedules=[
                        UIRuleIn(
                            day=r.day, startTime=r.startTime, endTime=r.endTime, isoDate=r.isoDate
                        )
                        for r in payload.schedules
                    ],
                    tz=payload.tz,
                )
            )
            await session.commit()
            return {"createdSlots": res.createdSlots, "skipped": res.skipped}

        except OpenSlotsConflict as e:
            await session.rollback()
            code = getattr(e, "kind", "RESOURCE_BUSY")
            message = (
                "Estas horas ya están utilizadas para este recurso."
                if code == "RESOURCE_BUSY"
                else "Ya tienes otros cupos en ese horario. Elige otra hora."
            )
            detail = {
                "code": code,
                "message": message,
                "conflicts": [
                    {"cupoId": cid, "inicio": ini.isoformat(), "fin": fin.isoformat()}
                    for (cid, ini, fin) in e.conflicts
                ],
            }
            raise HTTPException(status_code=409, detail=detail)
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    @r.get("/my", response_model=MySlotsPageOut)
    async def my_slots(
            request: Request,
            session: AsyncSession = Depends(get_session_dep),
            page: int = Query(1, ge=1),
            limit: int = Query(36, ge=1, le=100),
            status: Optional[Literal["disponible","ocupado","cancelado","expirado","realizado"]] = Query(None),
            date: Optional[str] = Query(None),
            category: Optional[str] = Query(None),
            service: Optional[str] = Query(None),
            campus: Optional[str] = Query(None),
    ):
        # --- auth ---
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        #  roll de estados antes de consultar 
        repo = SqlAlchemySlotsRepo(session)
        exp = await repo.expire_open_slots()         # ABIERTO -> EXPIRADO
        done = await repo.complete_reserved_slots()  # RESERVADO -> REALIZADO
        if exp or done:
            await session.commit()

        asesor_id = await repo.resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            return MySlotsPageOut(items=[], page=1, per_page=limit, total=0, pages=1)
        #  base 
        base = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio,
                CupoModel.fin,
                CupoModel.estado,
                CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero,
                RecursoModel.nombre.label("recurso_alias"),
                EdificioModel.nombre.label("edificio"),
                CampusModel.nombre.label("campus"),
                locked_expr,
            )
            .join(ServicioModel, ServicioModel.id == CupoModel.servicio_id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .join(RecursoModel, RecursoModel.id == CupoModel.recurso_id)
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id, isouter=True)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id, isouter=True)
            .where(CupoModel.asesor_id == UUID(asesor_id))
        )

        # estado 
        if status is None:
            base = base.where(CupoModel.estado.in_([EstadoCupo.ABIERTO, EstadoCupo.RESERVADO]))
        else:
            map_status = {
                "disponible": EstadoCupo.ABIERTO,
                "ocupado": EstadoCupo.RESERVADO,
                "cancelado": EstadoCupo.CANCELADO,
                "expirado": EstadoCupo.EXPIRADO,
                "realizado": EstadoCupo.REALIZADO,
            }
            base = base.where(CupoModel.estado == map_status[status])

        # fecha (YYYY-MM-DD) -> rango [start, end)
        if date:
            try:
                d = datetime.strptime(date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=422, detail="Fecha inválida (YYYY-MM-DD)")
            tz = ZoneInfo("America/Santiago")
            start_dt = datetime(d.year, d.month, d.day, tzinfo=tz)
            end_dt = start_dt + timedelta(days=1)
            base = base.where(CupoModel.inicio >= start_dt, CupoModel.inicio < end_dt)

        # filtros por textos (coincidencia exacta case-insensitive)
        if category:
            base = base.where(sa.func.lower(CategoriaModel.nombre) == category.lower())
        if service:
            base = base.where(sa.func.lower(ServicioModel.nombre) == service.lower())
        if campus:
            base = base.where(sa.func.lower(CampusModel.nombre) == campus.lower())

        # --- total / pages ---
        total = (await session.execute(
            sa.select(sa.func.count()).select_from(base.subquery())
        )).scalar_one()
        pages = max(1, (total + limit - 1) // limit)
        offset = (page - 1) * limit

        # --- page rows ---
        q = base.order_by(CupoModel.inicio.asc()).offset(offset).limit(limit)
        rows = (await session.execute(q)).all()
        items = [fmt_slot_row_to_out(r) for r in rows]

        # --- stats globales del conjunto filtrado ---
        s = base.subquery()
        disponibles = (await session.execute(
            sa.select(sa.func.coalesce(sa.func.sum(
                sa.case((s.c.estado == EstadoCupo.ABIERTO, 1), else_=0)
            ), 0))
        )).scalar_one()

        ocupadas_min = (await session.execute(
            sa.select(sa.func.coalesce(sa.func.sum(
                sa.case(
                    (s.c.estado == EstadoCupo.RESERVADO,
                    sa.func.extract('epoch', s.c.fin - s.c.inicio) / 60.0),
                    else_=0.0
                )
            ), 0.0))
        )).scalar_one()

        return MySlotsPageOut(
            items=items,
            page=page,
            per_page=limit,
            total=total,
            pages=pages,
            stats=MySlotsStatsOut(
                total=int(total),
                disponibles=int(disponibles or 0),
                ocupadas_min=int(round(ocupadas_min or 0)),
            ),
        )



    @r.patch("/{slot_id}", response_model=MySlotOut)
    async def update_slot(
        slot_id: str,
        request: Request,
        payload: MySlotPatchIn = Body(...),
        session: AsyncSession = Depends(get_session_dep),
    ):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        repo = SqlAlchemySlotsRepo(session)
        asesor_id = await repo.resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            raise HTTPException(status_code=403, detail="Sin perfil de asesor")

        q = sa.select(CupoModel).where(
            CupoModel.id == UUID(slot_id),
            CupoModel.asesor_id == UUID(asesor_id),
        )
        slot = (await session.execute(q)).scalar_one_or_none()
        if not slot:
            raise HTTPException(status_code=404, detail="Cupo no encontrado")
        if slot.estado == EstadoCupo.RESERVADO:
            raise HTTPException(status_code=409, detail="No puedes editar un cupo reservado")
        
        if slot.estado in (EstadoCupo.RESERVADO, EstadoCupo.REALIZADO):
            raise HTTPException(status_code=409, detail="No puedes reactivar un reservado/realizado")

        if payload.date or payload.time or payload.duration is not None:
            # Zona horaria a usar
            tzinfo = ZoneInfo(payload.tz or "America/Santiago")

            # Estado actual del cupo en TZ local
            cur_ini = slot.inicio.astimezone(tzinfo)
            cur_fin = slot.fin.astimezone(tzinfo)

            # Valores base (si no vienen en el patch, se mantienen)
            new_date = (payload.date or cur_ini.strftime("%Y-%m-%d")).strip()
            new_time = (payload.time or cur_ini.strftime("%H:%M")).strip()

            # Duración: si viene en el patch, úsala; si no, conserva la actual
            cur_dur_min = int((cur_fin - cur_ini).total_seconds() // 60)
            dur_min = int(payload.duration) if payload.duration is not None else cur_dur_min
            if dur_min <= 0:
                raise HTTPException(status_code=422, detail="Duración inválida")

            # Construir datetime *aware* directamente en la TZ local
            try:
                naive_local = datetime.strptime(f"{new_date} {new_time}", "%Y-%m-%d %H:%M")
            except ValueError:
                raise HTTPException(status_code=422, detail="Fecha/Hora inválida (use YYYY-MM-DD y HH:MM)")

            new_ini = naive_local.replace(tzinfo=tzinfo)
            new_fin = new_ini + timedelta(minutes=dur_min)

            # Conflictos con el recurso (excluyendo el propio cupo)
            conflicts = await repo.find_conflicting_slots(str(slot.recurso_id), [(new_ini, new_fin)])
            conflicts = [c for c in conflicts if c[0] != str(slot.id)]
            if conflicts:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "RESOURCE_BUSY",
                        "message": "Conflicto de horario con otro cupo de este recurso.",
                        "conflicts": [
                            {"cupoId": cid, "inicio": ini.isoformat(), "fin": fin.isoformat()}
                            for (cid, ini, fin) in conflicts
                        ],
                    },
                )

            # Conflictos con otros cupos del mismo asesor
            j_conf_asesor = sa.select(CupoModel.id, CupoModel.inicio, CupoModel.fin).where(
                CupoModel.asesor_id == slot.asesor_id,
                CupoModel.id != slot.id,
                sa.func.tstzrange(CupoModel.inicio, CupoModel.fin, "[)").op("&&")(
                    sa.func.tstzrange(new_ini, new_fin, "[)")
                ),
            )
            rows = (await session.execute(j_conf_asesor)).all()
            if rows:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "ADVISOR_TIME_CLASH",
                        "message": "Ya tienes otro cupo en ese horario. Elige otra hora.",
                        "conflicts": [
                            {"cupoId": str(r.id), "inicio": r.inicio.isoformat(), "fin": r.fin.isoformat()}
                            for r in rows
                        ],
                    },
                )
            slot.inicio, slot.fin = new_ini, new_fin

        if payload.notes is not None:
            slot.notas = (payload.notes or "").strip() or None

        if payload.status:
            target = ui_to_db_estado(payload.status)
            if target == EstadoCupo.RESERVADO:
                raise HTTPException(status_code=400, detail="Estado RESERVADO solo mediante flujo de reserva")
            if slot.estado == EstadoCupo.RESERVADO:
                raise HTTPException(status_code=409, detail="No puedes cambiar estado de un cupo reservado")
            slot.estado = target

        await session.flush()

        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio,
                CupoModel.fin,
                CupoModel.estado,
                CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero,
                RecursoModel.nombre.label("recurso_alias"),
                EdificioModel.nombre.label("edificio"),
                CampusModel.nombre.label("campus"),
                locked_expr,
            )
            .join(ServicioModel, ServicioModel.id == CupoModel.servicio_id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .join(RecursoModel, RecursoModel.id == CupoModel.recurso_id)
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id)
            .where(CupoModel.id == UUID(slot_id))
        )
        row = (await session.execute(j)).one()
        await session.commit()
        return fmt_slot_row_to_out(row)

    @r.delete("/{slot_id}")
    async def delete_slot(slot_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        asesor_id = await SqlAlchemySlotsRepo(session).resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            raise HTTPException(status_code=403, detail="Sin perfil de asesor")

        q = sa.select(CupoModel).where(
            CupoModel.id == UUID(slot_id),
            CupoModel.asesor_id == UUID(asesor_id),
        )
        slot = (await session.execute(q)).scalar_one_or_none()
        if not slot:
            raise HTTPException(status_code=404, detail="Cupo no encontrado")
        if slot.estado == EstadoCupo.RESERVADO:
            raise HTTPException(status_code=409, detail="No puedes eliminar un cupo reservado")

        has_cancelled_asesoria = (
            await session.execute(
                sa.select(sa.literal(True))
                .select_from(AsesoriaModel)
                .where(
                    AsesoriaModel.cupo_id == slot.id,
                    AsesoriaModel.estado == EstadoAsesoria.CANCELADA,
                )
                .limit(1)
            )
        ).scalar_one_or_none()
        if has_cancelled_asesoria:
            raise HTTPException(
                status_code=409,
                detail="No puedes eliminar un cupo asociado a una asesoria cancelada",
            )

        await session.delete(slot)
        await session.commit()
        return {"ok": True}

    @r.post("/{slot_id}/reactivate", response_model=MySlotOut)
    async def reactivate_slot(slot_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

        asesor_id = await SqlAlchemySlotsRepo(session).resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            raise HTTPException(status_code=403, detail="Sin perfil de asesor")

        q = sa.select(CupoModel).where(
            CupoModel.id == UUID(slot_id),
            CupoModel.asesor_id == UUID(asesor_id),
        )
        slot = (await session.execute(q)).scalar_one_or_none()
        if not slot:
            raise HTTPException(status_code=404, detail="Cupo no encontrado")
        if slot.estado == EstadoCupo.RESERVADO:
            raise HTTPException(status_code=409, detail="No puedes reactivar un reservado")

        has_cancelled_asesoria = (
            await session.execute(
                sa.select(sa.literal(True))
                .select_from(AsesoriaModel)
                .where(
                    AsesoriaModel.cupo_id == slot.id,
                    AsesoriaModel.estado == EstadoAsesoria.CANCELADA,
                )
                .limit(1)
            )
        ).scalar_one_or_none()
        if has_cancelled_asesoria:
            raise HTTPException(
                status_code=409,
                detail="No puedes reactivar un cupo asociado a una asesoria cancelada",
            )

        now_q = sa.func.now()
        too_late = (await session.execute(
            sa.select(sa.literal(True)).where(CupoModel.id == slot.id, CupoModel.fin < now_q)
        )).scalar_one_or_none()
        if too_late:
            raise HTTPException(status_code=409, detail="No puedes reactivar un cupo cuya hora ya pasó")

        slot.estado = EstadoCupo.ABIERTO
        await session.flush()

        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio,
                CupoModel.fin,
                CupoModel.estado,
                CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero,
                RecursoModel.nombre.label("recurso_alias"),
                EdificioModel.nombre.label("edificio"),
                CampusModel.nombre.label("campus"),
            )
            .join(ServicioModel, ServicioModel.id == CupoModel.servicio_id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .join(RecursoModel, RecursoModel.id == CupoModel.recurso_id)
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id)
            .where(CupoModel.id == UUID(slot_id))
        )
        row = (await session.execute(j)).one()
        await session.commit()
        return fmt_slot_row_to_out(row)

    return r
