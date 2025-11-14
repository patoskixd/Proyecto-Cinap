from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from app.use_cases.ports.telegram_repo_port import TelegramRepoPort
from app.interface_adapters.orm.models_telegram import TelegramAccountModel

class SqlAlchemyTelegramRepo(TelegramRepoPort):
    def __init__(self, session: AsyncSession, cache):
        self.s = session
        self.cache = cache

    async def link_telegram(self, token: str, telegram_user_id: int, chat_id: int, username: str | None) -> bool:
        import logging
        logger = logging.getLogger("telegram.link")
        
        # Validar que el token existe ANTES de iniciar la transacción
        key = f"tg:link:{token}"
        uid_bytes = await (self.cache.get(key) if self.cache else None)
        if not uid_bytes:
            logger.warning(f"Token no encontrado: {token}")
            return False

        user_id = uuid.UUID(uid_bytes.decode())
        logger.info(f"Vinculando user_id={user_id}, telegram_user_id={telegram_user_id}, username={username}")

        try:
            # PASO 1: Usar UPSERT atómico para manejar concurrencia
            # Basado en el constraint uq_tg_user 
            stmt = insert(TelegramAccountModel).values(
                usuario_id=user_id,
                telegram_user_id=telegram_user_id,
                chat_id=chat_id,
                telegram_username=username,
            )
            
            # Si telegram_user_id ya existe, actualizar con los nuevos datos
            stmt = stmt.on_conflict_do_update(
                constraint='uq_tg_user',  # Usar el nombre exacto del constraint en tu BD
                set_={
                    'usuario_id': stmt.excluded.usuario_id,
                    'chat_id': stmt.excluded.chat_id,
                    'telegram_username': stmt.excluded.telegram_username,
                    'actualizado_en': sa.text('now()')
                }
            )
            
            result = await self.s.execute(stmt)
            
            # PASO 2: Limpiar vinculaciones duplicadas del mismo usuario 
            # Solo elimina si hay otras cuentas telegram vinculadas al mismo usuario
            cleanup_stmt = sa.delete(TelegramAccountModel).where(
                sa.and_(
                    TelegramAccountModel.usuario_id == user_id,
                    TelegramAccountModel.telegram_user_id != telegram_user_id
                )
            )
            
            cleanup_result = await self.s.execute(cleanup_stmt)
            if cleanup_result.rowcount > 0:
                logger.info(f"Eliminadas {cleanup_result.rowcount} vinculaciones previas del usuario {user_id}")
            
            # PASO 3: Commit ANTES de eliminar el token (muy importante)
            await self.s.commit()
            
            # PASO 4: Solo eliminar el token después del commit exitoso
            if self.cache:
                await self.cache.delete(key)
            
            logger.info(f"Vinculación completada exitosamente. Username: '{username}', User: {user_id}")
            return True
            
        except IntegrityError as e:
            logger.error(f"Error de integridad en vinculación: {e}")
            await self.s.rollback()
            return False
        except Exception as e:
            logger.error(f"Error inesperado en vinculación: {e}")
            await self.s.rollback()
            return False

    async def find_user_id_by_telegram(self, telegram_user_id: int):
        q = await self.s.execute(
            sa.select(TelegramAccountModel.usuario_id).where(TelegramAccountModel.telegram_user_id == telegram_user_id)
        )
        uid = q.scalar_one_or_none()
        return str(uid) if uid else None
