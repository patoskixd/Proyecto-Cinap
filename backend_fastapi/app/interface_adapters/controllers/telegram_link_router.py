from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
import uuid, sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from app.frameworks_drivers.config.settings import TELEGRAM_BOT_USERNAME
from app.interface_adapters.orm.models_telegram import TelegramAccountModel 

class LinkOut(BaseModel):
    url: str

def make_telegram_link_router(*, require_auth, cache, get_session_dep):
    if not TELEGRAM_BOT_USERNAME:
        raise RuntimeError("Falta TELEGRAM_BOT_USERNAME en .env (sin @).")

    router = APIRouter(prefix="/telegram", tags=["telegram"])

    @router.post("/link", response_model=LinkOut, dependencies=[Depends(require_auth)])
    async def link(request: Request):
        user_claims = request.state.user
        user_id = user_claims.get("sub") or user_claims.get("id") or user_claims.get("user_id")
        if not user_id:
            raise RuntimeError("No pude resolver user_id desde el JWT")

        token = uuid.uuid4().hex
        await cache.set(f"tg:link:{token}", str(user_id).encode(), ttl_seconds=600)
        return LinkOut(url=f"https://t.me/{TELEGRAM_BOT_USERNAME}?start={token}")

    @router.get("/me", dependencies=[Depends(require_auth)])
    async def me_telegram(request: Request, session: AsyncSession = Depends(get_session_dep)):
        user_claims = request.state.user
        user_id = user_claims.get("sub") or user_claims.get("id") or user_claims.get("user_id")
        if not user_id:
            return {"linked": False, "username": None}

        q = sa.select(TelegramAccountModel.telegram_username).where(
            TelegramAccountModel.usuario_id == uuid.UUID(user_id)
        )
        username = (await session.execute(q)).scalar_one_or_none()
        return {"linked": username is not None, "username": username}
    

    @router.delete("/link", dependencies=[Depends(require_auth)])
    async def unlink_telegram(request: Request, session: AsyncSession = Depends(get_session_dep)):
        user_claims = request.state.user
        user_id = user_claims.get("sub") or user_claims.get("id") or user_claims.get("user_id")
        if not user_id:
            return {"ok": True}

        await session.execute(
            sa.delete(TelegramAccountModel).where(TelegramAccountModel.usuario_id == uuid.UUID(user_id))
        )
        await session.commit()
        return {"ok": True}

    return router
