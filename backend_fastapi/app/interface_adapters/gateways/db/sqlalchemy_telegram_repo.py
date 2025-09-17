# app/interface_adapters/gateways/db/sqlalchemy_telegram_repo.py
from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from app.use_cases.ports.telegram_repo_port import TelegramRepoPort
from app.interface_adapters.orm.models_telegram import TelegramAccountModel

class SqlAlchemyTelegramRepo(TelegramRepoPort):
    def __init__(self, session: AsyncSession, cache):
        self.s = session
        self.cache = cache

    async def link_telegram(self, token: str, telegram_user_id: int, chat_id: int, username: str | None) -> bool:
        key = f"tg:link:{token}"
        uid_bytes = await (self.cache.get(key) if self.cache else None)
        if not uid_bytes:
            return False
        await self.cache.delete(key)

        user_id = uuid.UUID(uid_bytes.decode())

        existing = await self.s.execute(
            sa.select(TelegramAccountModel).where(TelegramAccountModel.telegram_user_id == telegram_user_id)
        )
        row = existing.scalars().first()
        if row:
            row.usuario_id = user_id
            row.chat_id = chat_id
            row.telegram_username = username
        else:
            row = TelegramAccountModel(
                usuario_id=user_id,
                telegram_user_id=telegram_user_id,
                chat_id=chat_id,
                telegram_username=username,
            )
            self.s.add(row)
        await self.s.commit()
        return True

    async def find_user_id_by_telegram(self, telegram_user_id: int):
        q = await self.s.execute(
            sa.select(TelegramAccountModel.usuario_id).where(TelegramAccountModel.telegram_user_id == telegram_user_id)
        )
        uid = q.scalar_one_or_none()
        return str(uid) if uid else None
