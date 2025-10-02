from __future__ import annotations
from typing import Callable, Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.orm.models_scheduling import (
    CategoriaModel, ServicioModel
)

class ServiceOut(BaseModel):
    id: str
    categoryId: str
    name: str
    durationMinutes: int
    active: bool

class CategoryOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    active: bool
    services: list[ServiceOut] = Field(default_factory=list)

class CategoryCreateIn(BaseModel):
    name: str
    description: str

class CategoryPatchIn(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class ServiceCreateIn(BaseModel):
    name: str
    durationMinutes: int
    active: Optional[bool] = True

class ServicePatchIn(BaseModel):
    name: Optional[str] = None
    durationMinutes: Optional[int] = None
    active: Optional[bool] = None

class StatusPatchIn(BaseModel):
    active: bool

def make_admin_catalog_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/admin/catalog", tags=["admin-catalog"])

    async def require_user(req: Request):
        token = req.cookies.get("app_session")
        if not token: raise HTTPException(status_code=401, detail="No autenticado")
        try: jwt_port.decode(token)
        except Exception: raise HTTPException(status_code=401, detail="Token inválido")

    @r.get("/categories", response_model=list[CategoryOut])
    async def list_categories(request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        cats = (await session.execute(sa.select(CategoriaModel).order_by(CategoriaModel.nombre.asc()))).scalars().all()
        svcs = (await session.execute(sa.select(ServicioModel).order_by(ServicioModel.nombre.asc()))).scalars().all()

        by_cat: dict[str, list[ServiceOut]] = {}
        for s in svcs:
            svc = ServiceOut(
                id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre,
                durationMinutes=int(s.duracion_minutos), active=bool(s.activo)
            )
            by_cat.setdefault(str(s.categoria_id), []).append(svc)

        out: list[CategoryOut] = []
        for c in cats:
            out.append(CategoryOut(
                id=str(c.id), name=c.nombre, description=c.descripcion, active=bool(c.activo),
                services=by_cat.get(str(c.id), [])
            ))
        return out

    @r.post("/categories", response_model=CategoryOut)
    async def create_category(payload: CategoryCreateIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        c = CategoriaModel(nombre=payload.name.strip(), descripcion=payload.description.strip())
        session.add(c)
        await session.flush()
        await session.commit()
        return CategoryOut(id=str(c.id), name=c.nombre, description=c.descripcion, active=bool(c.activo), services=[])

    @r.patch("/categories/{cat_id}", response_model=CategoryOut)
    async def patch_category(cat_id: str, payload: CategoryPatchIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        c = (await session.execute(sa.select(CategoriaModel).where(CategoriaModel.id == UUID(cat_id)))).scalar_one_or_none()
        if not c: raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if payload.name is not None: c.nombre = payload.name.strip()
        if payload.description is not None: c.descripcion = payload.description.strip()
        if payload.active is not None: c.activo = bool(payload.active)
        await session.flush()

        svcs = (await session.execute(sa.select(ServicioModel).where(ServicioModel.categoria_id == c.id))).scalars().all()
        out = CategoryOut(
            id=str(c.id), name=c.nombre, description=c.descripcion, active=bool(c.activo),
            services=[
                ServiceOut(id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre, durationMinutes=int(s.duracion_minutos), active=bool(s.activo))
                for s in svcs
            ]
        )
        await session.commit()
        return out


    @r.delete("/categories/{cat_id}")
    async def delete_category(cat_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        c = (await session.execute(
            sa.select(CategoriaModel).where(CategoriaModel.id == UUID(cat_id))
        )).scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")

        # 1) borrar servicios hijos para evitar el FK RESTRICT
        await session.execute(sa.delete(ServicioModel).where(ServicioModel.categoria_id == c.id))

        # 2) borrar la categoría
        await session.delete(c)
        await session.commit()
        return {"ok": True}


    @r.post("/categories/{cat_id}/reactivate", response_model=CategoryOut)
    async def reactivate_category(cat_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        c = (await session.execute(sa.select(CategoriaModel).where(CategoriaModel.id == UUID(cat_id)))).scalar_one_or_none()
        if not c: raise HTTPException(status_code=404, detail="Categoría no encontrada")
        c.activo = True
        await session.flush()
        svcs = (await session.execute(sa.select(ServicioModel).where(ServicioModel.categoria_id == c.id))).scalars().all()
        out = CategoryOut(
            id=str(c.id), name=c.nombre, description=c.descripcion, active=bool(c.activo),
            services=[
                ServiceOut(id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre, durationMinutes=int(s.duracion_minutos), active=bool(s.activo))
                for s in svcs
            ]
        )
        await session.commit()
        return out

    @r.post("/categories/{cat_id}/services", response_model=ServiceOut)
    async def create_service(cat_id: str, payload: ServiceCreateIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        c = (await session.execute(sa.select(CategoriaModel).where(CategoriaModel.id == UUID(cat_id)))).scalar_one_or_none()
        if not c: raise HTTPException(status_code=404, detail="Categoría no encontrada")

        s = ServicioModel(
            categoria_id=c.id,
            nombre=payload.name.strip(),
            duracion_minutos=int(payload.durationMinutes),
            activo=bool(payload.active) if payload.active is not None else True,
        )
        session.add(s)
        await session.flush()
        out = ServiceOut(
            id=str(s.id),
            categoryId=str(s.categoria_id),
            name=s.nombre,
            durationMinutes=int(s.duracion_minutos),
            active=bool(s.activo),
        )
        await session.commit()
        return out


    @r.patch("/services/{svc_id}", response_model=ServiceOut)
    async def patch_service(svc_id: str, payload: ServicePatchIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        s = (await session.execute(sa.select(ServicioModel).where(ServicioModel.id == UUID(svc_id)))).scalar_one_or_none()
        if not s: raise HTTPException(status_code=404, detail="Servicio no encontrado")
        if payload.name is not None: s.nombre = payload.name.strip()
        if payload.durationMinutes is not None: s.duracion_minutos = int(payload.durationMinutes)
        if payload.active is not None: s.activo = bool(payload.active)
        await session.flush()
        out = ServiceOut(id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre, durationMinutes=int(s.duracion_minutos), active=bool(s.activo))
        await session.commit()
        return out

    @r.delete("/services/{svc_id}")
    async def delete_service(svc_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        s = (await session.execute(sa.select(ServicioModel).where(ServicioModel.id == UUID(svc_id)))).scalar_one_or_none()
        if not s: raise HTTPException(status_code=404, detail="Servicio no encontrado")
        await session.delete(s)
        await session.commit()
        return {"ok": True}

    @r.post("/services/{svc_id}/reactivate", response_model=ServiceOut)
    async def reactivate_service(svc_id: str, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        s = (await session.execute(sa.select(ServicioModel).where(ServicioModel.id == UUID(svc_id)))).scalar_one_or_none()
        if not s: raise HTTPException(status_code=404, detail="Servicio no encontrado")
        s.activo = True
        await session.flush()
        out = ServiceOut(id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre, durationMinutes=int(s.duracion_minutos), active=bool(s.activo))
        await session.commit()
        return out

    @r.patch("/services/{svc_id}/status", response_model=ServiceOut)
    async def patch_service_status(svc_id: str, payload: StatusPatchIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        await require_user(request)
        s = (await session.execute(sa.select(ServicioModel).where(ServicioModel.id == UUID(svc_id)))).scalar_one_or_none()
        if not s: raise HTTPException(status_code=404, detail="Servicio no encontrado")
        s.activo = bool(payload.active)
        await session.flush()
        out = ServiceOut(id=str(s.id), categoryId=str(s.categoria_id), name=s.nombre, durationMinutes=int(s.duracion_minutos), active=bool(s.activo))
        await session.commit()
        return out

    return r
