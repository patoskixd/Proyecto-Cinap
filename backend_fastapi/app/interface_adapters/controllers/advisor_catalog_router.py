from __future__ import annotations
from typing import Callable, Literal, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.gateways.db.sqlalchemy_advisor_catalog_repo import (
    SqlAlchemyAdvisorCatalogRepo,
)

class ServiceVM(BaseModel):
    id: str
    name: str
    description: str | None = None
    duration: int
    selected: bool

class CategoryVM(BaseModel):
    id: str
    name: str
    description: str | None = None
    icon: str | None = "📚"
    services: List[ServiceVM]

class AdvisorCategoryVM(BaseModel):
    category: CategoryVM
    services: List[ServiceVM]
    status: Literal["active", "available"]

class AdvisorCatalogVM(BaseModel):
    active: List[AdvisorCategoryVM]
    available: List[AdvisorCategoryVM]
    stats: Dict[str, int]

def make_advisor_catalog_router(
    *, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort
) -> APIRouter:
    r = APIRouter(prefix="/advisor-catalog", tags=["advisor-catalog"])

    def ensure_auth(req: Request) -> dict[str, Any]:
        token = req.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            return jwt_port.decode(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

    @r.get("", response_model=AdvisorCatalogVM)
    async def get_catalog(
        request: Request, session: AsyncSession = Depends(get_session_dep)
    ):
        data = ensure_auth(request)
        repo = SqlAlchemyAdvisorCatalogRepo(session)
        asesor_id = await repo.resolve_asesor_id(str(data.get("sub")))
        if not asesor_id:
            return AdvisorCatalogVM(active=[], available=[], stats={"activeCategories": 0, "activeServices": 0})
        out = await repo.get_advisor_catalog(asesor_id)
        await session.commit()
        return out

    return r
