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

    router = APIRouter(prefix="/api/telegram", tags=["telegram"])

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
        import logging
        logger = logging.getLogger("telegram.me")
        
        user_claims = request.state.user
        user_id = user_claims.get("sub") or user_claims.get("id") or user_claims.get("user_id")
        logger.info(f"Consultando estado de Telegram para user_id={user_id}")
        
        if not user_id:
            logger.warning("No se pudo obtener user_id de los claims")
            return {"linked": False, "username": None}

        # Consultar si existe el registro de vinculación
        q = sa.select(
            TelegramAccountModel.id,
            TelegramAccountModel.telegram_user_id,
            TelegramAccountModel.telegram_username
        ).where(
            TelegramAccountModel.usuario_id == uuid.UUID(user_id)
        )
        result = (await session.execute(q)).first()
        logger.info(f"Resultado de la consulta completa: {result}")
        
        if result is None:
            logger.info("No se encontró registro de Telegram para este usuario")
            return {"linked": False, "username": None}
        
        # result es una tupla: (id, telegram_user_id, telegram_username)
        telegram_username = result[2]  # El tercer elemento es telegram_username
        
        # Si el usuario está vinculado, siempre devolvemos linked=True
        # El username puede ser None, un @username, o un nombre completo
        logger.info(f"Usuario vinculado encontrado. Username/Display name: {telegram_username}")
        return {"linked": True, "username": telegram_username}
    

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
