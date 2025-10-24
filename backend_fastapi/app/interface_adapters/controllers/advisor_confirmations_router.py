from __future__ import annotations
from typing import Callable
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.use_cases.confirmations.get_pending_confirmations import GetPendingConfirmations
from app.interface_adapters.gateways.db.sqlalchemy_advisor_confirmations_repo import SqlAlchemyAdvisorConfirmationsRepo

class PendingConfirmationOut(BaseModel):
    id: str
    category: str
    categoryLabel: str
    serviceTitle: str
    teacher: str
    teacherEmail: str
    dateISO: str
    time: str
    location: str
    room: str
    createdAtISO: str
    status: str

def make_confirmations_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/api/advisor/confirmations", tags=["advisor-confirmations"])

    @r.get("/pending", response_model=list[PendingConfirmationOut])
    async def pending(request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

        repo = SqlAlchemyAdvisorConfirmationsRepo(session)
        uc = GetPendingConfirmations(repo)
        items = await uc.exec(usuario_id=str(data.get("sub")))
        return [PendingConfirmationOut(**i) for i in items]

    return r
