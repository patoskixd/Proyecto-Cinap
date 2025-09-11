from __future__ import annotations
from typing import Callable, Optional, Literal
from uuid import UUID
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.use_cases.slots.open_slots import (OpenSlotsUseCase, OpenSlotsInput, UIRuleIn, OpenSlotsConflict)
from app.interface_adapters.gateways.db.sqlalchemy_slots_repo import SqlAlchemySlotsRepo
from app.interface_adapters.orm.models_scheduling import (CupoModel, ServicioModel, CategoriaModel, RecursoModel, EdificioModel, CampusModel, EstadoCupo)


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
        status: Literal["disponible", "ocupado", "cancelado", "expirado"]
        student: dict | None = None
        notes: str | None = None

class MySlotPatchIn(BaseModel):
        date: str | None = None       
        time: str | None = None      
        duration: int | None = None   
        location: str | None = None
        room: str | None = None
        notes: str | None = None
        status: Literal["disponible","ocupado","cancelado","expirado"] | None = None
        tz: str = "America/Santiago"

def make_slots_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/slots", tags=["slots"])


    def db_to_ui_estado(s) -> str:
        if isinstance(s, EstadoCupo):
            s = s.value
        return {
            "ABIERTO": "disponible",
            "RESERVADO": "ocupado",
            "CANCELADO": "cancelado",
            "EXPIRADO": "expirado",
        }.get(s, "disponible")

    def ui_to_db_estado(s: str) -> EstadoCupo:
        return {
            "disponible": EstadoCupo.ABIERTO,
            "ocupado":    EstadoCupo.RESERVADO,
            "cancelado":  EstadoCupo.CANCELADO,
            "expirado":   EstadoCupo.EXPIRADO,
        }[s]


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
            notes=row.notas
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
            res = await uc.exec(OpenSlotsInput(
                usuario_id=str(data.get("sub")),
                service_id=payload.serviceId,
                recurso_id=payload.recursoId,
                location=payload.location,
                room=payload.room,
                roomNotes=payload.roomNotes,
                schedules=[UIRuleIn(
                    day=r.day, startTime=r.startTime, endTime=r.endTime, isoDate=r.isoDate
                ) for r in payload.schedules],
                tz=payload.tz,
            ))
            await session.commit()
            return {"createdSlots": res.createdSlots, "skipped": res.skipped}

        except OpenSlotsConflict as e:
            await session.rollback()
            code = getattr(e, "kind", "RESOURCE_BUSY")
            message = ("Estas horas ya están utilizadas para este recurso."
                    if code == "RESOURCE_BUSY"
                    else "Ya tienes otros cupos en ese horario. Elige otra hora.")
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
        
    @r.get("/my", response_model=list[MySlotOut])
    async def my_slots(request: Request, session: AsyncSession = Depends(get_session_dep)):
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
            return []

        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio, CupoModel.fin, CupoModel.estado, CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero, RecursoModel.nombre.label("recurso_alias"),
                EdificioModel.nombre.label("edificio"),
                CampusModel.nombre.label("campus"),
            )
            .join(ServicioModel, ServicioModel.id == CupoModel.servicio_id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .join(RecursoModel, RecursoModel.id == CupoModel.recurso_id)
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id)
            .where(CupoModel.asesor_id == UUID(asesor_id))
            .order_by(CupoModel.inicio.asc())
        )
        rows = (await session.execute(j)).all()
        return [fmt_slot_row_to_out(r) for r in rows]

    @r.patch("/{slot_id}", response_model=MySlotOut)
    async def update_slot(slot_id: str, request: Request, payload: MySlotPatchIn = Body(...), session: AsyncSession = Depends(get_session_dep)):
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

        q = (
            sa.select(CupoModel)
            .where(
                CupoModel.id == UUID(slot_id),
                CupoModel.asesor_id == UUID(asesor_id),
            )
        )
        slot = (await session.execute(q)).scalar_one_or_none()
        if not slot:
            raise HTTPException(status_code=404, detail="Cupo no encontrado")
        if slot.estado == "RESERVADO":
            raise HTTPException(status_code=409, detail="No puedes editar un cupo reservado")


        if payload.date or payload.time or payload.duration:
            tz = slot.inicio.tzinfo or ZoneInfo(payload.tz or "America/Santiago")
            cur_ini = slot.inicio.astimezone(tz)
            cur_fin = slot.fin.astimezone(tz)

            new_date = payload.date or cur_ini.strftime("%Y-%m-%d")
            new_time = payload.time or cur_ini.strftime("%H:%M")
            dur_min = int((cur_fin - cur_ini).total_seconds() // 60)

            try:
                naive_dt = datetime.strptime(f"{new_date} {new_time}", "%Y-%m-%d %H:%M")
                new_ini = naive_dt.replace(tzinfo=None).astimezone(ZoneInfo(payload.tz or "America/Santiago"))
            except ValueError:
                raise HTTPException(status_code=422, detail="Fecha/Hora inválida")

            new_fin = new_ini + timedelta(minutes=dur_min)

            conflicts = await repo.find_conflicting_slots(str(slot.recurso_id), [(new_ini, new_fin)])
            conflicts = [c for c in conflicts if c[0] != str(slot.id)]
            if conflicts:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "RESOURCE_BUSY",
                        "message": "Conflicto de horario con otro cupo de este recurso.",
                        "conflicts": [{"cupoId": c[0], "inicio": c[1].isoformat(), "fin": c[2].isoformat()} for c in conflicts],
                    },
                )

            j_conf_asesor = sa.select(CupoModel.id, CupoModel.inicio, CupoModel.fin).where(
                CupoModel.asesor_id == slot.asesor_id,
                CupoModel.id != slot.id,
                sa.func.tstzrange(CupoModel.inicio, CupoModel.fin, '[)').op('&&')(sa.func.tstzrange(new_ini, new_fin, '[)'))
            )
            rows = (await session.execute(j_conf_asesor)).all()
            if rows:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "ADVISOR_TIME_CLASH",
                        "message": "Ya tienes otro cupo en ese horario. Elige otra hora.",
                        "conflicts": [{"cupoId": str(r.id), "inicio": r.inicio.isoformat(), "fin": r.fin.isoformat()} for r in rows],
                    },
                )
            slot.inicio, slot.fin = new_ini, new_fin


        if payload.notes is not None:
            slot.notas = (payload.notes or "").strip() or None


        if payload.status:
            target = ui_to_db_estado(payload.status)
            if target == "RESERVADO":
                raise HTTPException(status_code=400, detail="Estado RESERVADO solo mediante flujo de reserva")
            if slot.estado == "RESERVADO":
                raise HTTPException(status_code=409, detail="No puedes cambiar estado de un cupo reservado")
            slot.estado = target

        await session.flush()


        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio, CupoModel.fin, CupoModel.estado, CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero, RecursoModel.nombre.label("recurso_alias"),
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
        if slot.estado == "RESERVADO":
            raise HTTPException(status_code=409, detail="No puedes eliminar un cupo reservado")

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
        if slot.estado == "RESERVADO":
            raise HTTPException(status_code=409, detail="No puedes reactivar un reservado")

        slot.estado = "ABIERTO"
        await session.flush()

        j = (
            sa.select(
                CupoModel.id,
                CupoModel.inicio, CupoModel.fin, CupoModel.estado, CupoModel.notas,
                ServicioModel.nombre.label("servicio"),
                ServicioModel.duracion_minutos,
                CategoriaModel.nombre.label("categoria"),
                RecursoModel.sala_numero, RecursoModel.nombre.label("recurso_alias"),
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
