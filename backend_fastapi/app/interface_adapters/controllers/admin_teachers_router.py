from __future__ import annotations
from typing import Callable, Optional
import sqlalchemy as sa

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.use_cases.admin.teachers_management import (
    ListTeachersUseCase,
    GetTeacherUseCase,
    UpdateTeacherUseCase,
    DeleteTeacherUseCase,
)
from app.interface_adapters.gateways.db.sqlalchemy_admin_teachers_repo import SqlAlchemyDocenteRepo
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.orm.models_auth import RolModel


class TeacherOut(BaseModel):
    id: str
    usuario_id: str
    name: str
    email: str
    activo: bool

class TeachersPageOut(BaseModel):
    items: list[TeacherOut]
    page: int
    per_page: int
    total: int
    pages: int

class UpdateTeacherIn(BaseModel):
    name: str | None = None
    email: str | None = None
    active: bool | None = None

def make_admin_teachers_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/admin/teachers", tags=["admin-teachers"])

    async def require_user(req: Request):
        token = req.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

    async def build_repos(session: AsyncSession):
        rol_result = await session.execute(sa.select(RolModel).where(RolModel.nombre.in_(["Docente", "Profesor", "Teacher"])))
        docente_role = rol_result.scalar_one_or_none()
        if not docente_role:
            all_roles_result = await session.execute(sa.select(RolModel))
            all_roles = all_roles_result.scalars().all()
            if not all_roles:
                raise HTTPException(status_code=400, detail='No hay roles disponibles en el sistema')
            docente_role = all_roles[0]  
        user_repo = SqlAlchemyUserRepo(session, default_role_id=docente_role.id)
        docente_repo = SqlAlchemyDocenteRepo(session, user_repo, docente_role.id)
        return docente_repo

    @r.get("/", response_model=TeachersPageOut)
    async def list_teachers(
        request: Request,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=200),
        q: str | None = Query(None),
        session: AsyncSession = Depends(get_session_dep),
    ):
        docente_repo = await build_repos(session)
        use_case = ListTeachersUseCase(docente_repo=docente_repo)
        page_result = await use_case.execute(page=page, limit=limit, query=q)
        return TeachersPageOut(
            items=[
                TeacherOut(
                    id=t.id,
                    usuario_id=t.usuario_id,
                    name=t.name,
                    email=t.email,
                    activo=t.activo,
                )
                for t in page_result.items
            ],
            page=page_result.page,
            per_page=page_result.per_page,
            total=page_result.total,
            pages=page_result.pages,
        )


    @r.get("/{teacher_id}", response_model=TeacherOut)
    async def get_teacher(teacher_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        docente_repo = await build_repos(session)
        use_case = GetTeacherUseCase(docente_repo=docente_repo)
        teacher = await use_case.execute(teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Docente no encontrado")
        return TeacherOut(id=teacher.id, usuario_id=teacher.usuario_id, name=teacher.name, email=teacher.email, activo=teacher.activo)

    @r.patch("/{teacher_id}", response_model=TeacherOut)
    async def update_teacher(teacher_id: str, payload: UpdateTeacherIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        docente_repo = await build_repos(session)
        use_case = UpdateTeacherUseCase(docente_repo=docente_repo)
        try:
            teacher = await use_case.execute(teacher_id, name=payload.name, email=payload.email, active=payload.active)
            await session.commit()
            return TeacherOut(id=teacher.id, usuario_id=teacher.usuario_id, name=teacher.name, email=teacher.email, activo=teacher.activo)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al actualizar docente: {e}")

    @r.delete("/{teacher_id}")
    async def delete_teacher(teacher_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        docente_repo = await build_repos(session)
        use_case = DeleteTeacherUseCase(docente_repo=docente_repo)
        try:
            await use_case.execute(teacher_id)
            await session.commit()
            return {"ok": True}
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al eliminar docente: {e}")

    return r
