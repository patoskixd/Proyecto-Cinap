from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.gateways.db.sqlalchemy_teacher_confirmations_repo import SqlAlchemyTeacherConfirmationsRepo
from app.use_cases.ports.teacher_confirmations_repo import GetTeacherPendingConfirmations

class PendingTeacherConfirmationOut(BaseModel):
    id: str
    categoria: str
    servicio: str
    inicioISO: str
    ubicacion: str | None = None
    estudiante: str | None = None

def make_teacher_confirmations_router(*, get_session_dep, jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/teacher/confirmations", tags=["teacher-confirmations"])

    @r.get("/pending", response_model=list[PendingTeacherConfirmationOut])
    async def pending(request: Request, session: AsyncSession = Depends(get_session_dep)):
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

        repo = SqlAlchemyTeacherConfirmationsRepo(session)
        uc = GetTeacherPendingConfirmations(repo)
        rows = await uc.exec(uuid.UUID(str(data.get("sub"))))

        return [
            PendingTeacherConfirmationOut(
                id=str(x.id),
                categoria=x.categoria,
                servicio=x.servicio,
                inicioISO=x.inicio.isoformat(),
                ubicacion=x.ubicacion,
                estudiante=x.solicitante,
            )
            for x in rows
        ]

    return r
