from __future__ import annotations
from typing import Callable, Optional
import uuid
import sqlalchemy as sa

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.domain.auth.asesor_perfil import RegisterAdvisorRequest, AdvisorInfo
from app.use_cases.admin.advisor_management import (
    RegisterAdvisorUseCase,
    ListAdvisorsUseCase,
    GetAdvisorUseCase,
    UpdateAdvisorUseCase,
    UpdateAdvisorServicesUseCase,
    DeleteAdvisorUseCase
)
from app.interface_adapters.gateways.db.sqlalchemy_asesor_repo import SqlAlchemyAsesorRepo
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.orm.models_auth import RolModel

class RegisterAdvisorIn(BaseModel):
    name: str
    email: str
    service_ids: list[str]

class ServiceOut(BaseModel):
    id: str
    name: str
    category_id: str
    category_name: str

class AdvisorOut(BaseModel):
    id: str
    usuario_id: str
    name: str
    email: str
    activo: bool
    services: list[ServiceOut]
    categories: list[str] | None = None

class AdvisorsPageOut(BaseModel):
    items: list[AdvisorOut]
    page: int
    per_page: int
    total: int
    pages: int

class UpdateAdvisorServicesIn(BaseModel):
    service_ids: list[str]

class UpdateAdvisorIn(BaseModel):
    name: str | None = None
    email: str | None = None
    service_ids: list[str] | None = None
    active: bool | None = None

def make_admin_advisors_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/api/admin/advisors", tags=["admin-advisors"])

    async def require_user(req: Request):
        token = req.cookies.get("app_session")
        if not token: raise HTTPException(status_code=401, detail="No autenticado")
        try: jwt_port.decode(token)
        except Exception: raise HTTPException(status_code=401, detail="Token inválido")

    @r.get("/", response_model=AdvisorsPageOut)
    async def list_advisors(
        request: Request,
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=200),
        q: str | None = Query(None),
        category_id: str | None = Query(None),
        service_id: str | None = Query(None),
        session: AsyncSession = Depends(get_session_dep),
    ):

        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            return AdvisorsPageOut(items=[], page=page, per_page=limit, total=0, pages=1)


        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = ListAdvisorsUseCase(asesor_repo=asesor_repo)
        
        page_data = await use_case.execute(
            page=page,
            limit=limit,
            query=q,
            category_id=category_id,
            service_id=service_id,
        )
        return AdvisorsPageOut(
            items=[
                AdvisorOut(
                    id=advisor.id,
                    usuario_id=advisor.usuario_id,
                    name=advisor.name,
                    email=advisor.email,
                    activo=advisor.activo,
                    services=[
                        ServiceOut(
                            id=getattr(service, "id", "") or (service.get("id") if isinstance(service, dict) else ""),
                            name=getattr(service, "name", "") or (service.get("name") if isinstance(service, dict) else ""),
                            category_id=getattr(service, "category_id", "") or (service.get("category_id") if isinstance(service, dict) else ""),
                            category_name=getattr(service, "category_name", "") or (service.get("category_name") if isinstance(service, dict) else ""),
                        )
                        for service in (advisor.services or [])
                    ],
                    categories=advisor.categories,
                )
                for advisor in page_data.items
            ],
            page=page_data.page,
            per_page=page_data.per_page,
            total=page_data.total,
            pages=page_data.pages,
        )

    @r.post("/", response_model=AdvisorOut)
    async def register_advisor(
        payload: RegisterAdvisorIn, 
        request: Request, 
        session: AsyncSession = Depends(get_session_dep)
    ):
        
        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            raise HTTPException(status_code=400, detail="Rol de asesor no encontrado")
        
        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = RegisterAdvisorUseCase(asesor_repo=asesor_repo)
        
        domain_request = RegisterAdvisorRequest(
            name=payload.name.strip(),
            email=payload.email.strip(),
            service_ids=payload.service_ids
        )
        
        try:
            advisor = await use_case.execute(domain_request)
            await session.commit()
            
            return AdvisorOut(
                id=advisor.id,
                usuario_id=advisor.usuario_id,
                name=advisor.name,
                email=advisor.email,
                activo=advisor.activo,
                services=[
                    ServiceOut(
                        id=service.id,
                        name=service.name,
                        category_id=service.category_id,
                        category_name=service.category_name
                    ) for service in advisor.services
                ] if advisor.services else [],
                categories=advisor.categories
            )
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al registrar asesor: {str(e)}")

    @r.get("/{advisor_id}", response_model=AdvisorOut)
    async def get_advisor(
        advisor_id: str, 
        request: Request, 
        session: AsyncSession = Depends(get_session_dep)
    ):
        await require_user(request)
    
        
        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            raise HTTPException(status_code=400, detail="Rol de asesor no encontrado")
        
        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = GetAdvisorUseCase(asesor_repo=asesor_repo)
        
        advisor = await use_case.execute(advisor_id)
        if not advisor:
            raise HTTPException(status_code=404, detail="Asesor no encontrado")
        
        return AdvisorOut(
            id=advisor.id,
            usuario_id=advisor.usuario_id,
            name=advisor.name,
            email=advisor.email,
            activo=advisor.activo,
            services=[
                ServiceOut(
                    id=service.id,
                    name=service.name,
                    category_id=service.category_id,
                    category_name=service.category_name
                ) for service in advisor.services
            ] if advisor.services else [],
            categories=advisor.categories
        )

    @r.patch("/{advisor_id}", response_model=AdvisorOut)
    async def update_advisor(
        advisor_id: str,
        payload: UpdateAdvisorIn,
        request: Request,
        session: AsyncSession = Depends(get_session_dep)
    ):

        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            raise HTTPException(status_code=400, detail="Rol de asesor no encontrado")
        
        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = UpdateAdvisorUseCase(asesor_repo=asesor_repo)
        
        try:
            advisor = await use_case.execute(
                advisor_id, 
                name=payload.name, 
                email=payload.email, 
                service_ids=payload.service_ids,
                active=payload.active
            )
            await session.commit()
            
            return AdvisorOut(
                id=advisor.id,
                usuario_id=advisor.usuario_id,
                name=advisor.name,
                email=advisor.email,
                activo=advisor.activo,
                services=[
                    ServiceOut(
                        id=service.id,
                        name=service.name,
                        category_id=service.category_id,
                        category_name=service.category_name
                    ) for service in advisor.services
                ] if advisor.services else [],
                categories=advisor.categories
            )
        except LookupError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al actualizar asesor: {str(e)}")

    @r.patch("/{advisor_id}/services", response_model=AdvisorOut)
    async def update_advisor_services(
        advisor_id: str,
        payload: UpdateAdvisorServicesIn,
        request: Request,
        session: AsyncSession = Depends(get_session_dep)
    ):
        await require_user(request)
        
        
        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            raise HTTPException(status_code=400, detail="Rol de asesor no encontrado")
        
        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = UpdateAdvisorServicesUseCase(asesor_repo=asesor_repo)
        
        try:
            advisor = await use_case.execute(advisor_id, payload.service_ids)
            await session.commit()
            
            return AdvisorOut(
                id=advisor.id,
                usuario_id=advisor.usuario_id,
                name=advisor.name,
                email=advisor.email,
                activo=advisor.activo,
                services=[
                    ServiceOut(
                        id=service.id,
                        name=service.name,
                        category_id=service.category_id,
                        category_name=service.category_name
                    ) for service in advisor.services
                ] if advisor.services else [],
                categories=advisor.categories
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al actualizar servicios: {str(e)}")

    @r.delete("/{advisor_id}")
    async def delete_advisor(
        advisor_id: str,
        request: Request,
        session: AsyncSession = Depends(get_session_dep)
    ):
        rol_result = await session.execute(
            sa.select(RolModel).where(RolModel.nombre == "Asesor")
        )
        asesor_role = rol_result.scalar_one_or_none()
        if not asesor_role:
            raise HTTPException(status_code=400, detail="Rol de asesor no encontrado")
        
        user_repo = SqlAlchemyUserRepo(session, default_role_id=asesor_role.id)
        asesor_repo = SqlAlchemyAsesorRepo(session, user_repo, asesor_role.id)
        use_case = DeleteAdvisorUseCase(asesor_repo=asesor_repo)
        
        try:
            await use_case.execute(advisor_id)
            await session.commit()
            return {"ok": True}
        except LookupError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except ValueError as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al eliminar asesor: {str(e)}")

    return r
