from __future__ import annotations
from typing import Callable, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.use_cases.ports.token_port import JwtPort
from app.use_cases.slots.open_slots import OpenSlotsUseCase, OpenSlotsInput, UIRuleIn, OpenSlotsConflict
from app.interface_adapters.gateways.db.sqlalchemy_slots_repo import SqlAlchemySlotsRepo

def make_slots_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/slots", tags=["slots"])

    class ResourceOut(BaseModel):
        id: str
        tipo: str                    
        number: str | None = None
        alias: str
        capacity: int | None = None
        buildingId: str
        building: str
        campusId: str
        campus: str

    class CreateDataOut(BaseModel):
        categories: list[dict]
        servicesByCategory: dict[str, list[dict]]
        times: list[str]
        resources: list[ResourceOut]

    @r.get("/create-data", response_model=CreateDataOut)
    async def create_data(session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemySlotsRepo(session)
        return await repo.get_create_slots_data()


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
            detail = {
                "code": "RESOURCE_BUSY",
                "message": "Estas horas ya están utilizadas para este recurso.",
                "conflicts": [
                    {"cupoId": cid, "inicio": ini.isoformat(), "fin": fin.isoformat()}
                    for (cid, ini, fin) in e.conflicts
                ],
            }
            raise HTTPException(status_code=409, detail=detail)

        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))
    return r