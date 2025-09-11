from __future__ import annotations
from typing import Callable
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.gateways.db.sqlalchemy_advisor_catalog_repo import SqlAlchemyAdvisorCatalogRepo

class JoinLeaveCategoryIn(BaseModel):
    categoryId: str
    advisorId: str  

def make_admin_catalog_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    r = APIRouter(prefix="/admin/catalog", tags=["admin-catalog"])

    def ensure_admin(req: Request):
        token = req.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        data = jwt_port.decode(token)

        if not data.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Solo admin")
        return data

    @r.post("/join-category")
    async def join_category(payload: JoinLeaveCategoryIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        ensure_admin(request)
        repo = SqlAlchemyAdvisorCatalogRepo(session)
        await repo.join_category(payload.advisorId, payload.categoryId)
        await session.commit()
        return {"ok": True}

    @r.post("/leave-category")
    async def leave_category(payload: JoinLeaveCategoryIn, request: Request, session: AsyncSession = Depends(get_session_dep)):
        ensure_admin(request)
        repo = SqlAlchemyAdvisorCatalogRepo(session)
        await repo.leave_category(payload.advisorId, payload.categoryId)
        await session.commit()
        return {"ok": True}

    return r
