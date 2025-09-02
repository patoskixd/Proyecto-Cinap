from __future__ import annotations
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.use_cases.ports.auth_repos import UserRepo
from app.domain.auth.user import User, Role

from app.interface_adapters.orm.models_auth import (
    UsuarioModel,
    UserIdentityModel,
    RolModel,
)

class SqlAlchemyUserRepo(UserRepo):
    def __init__(self, session: AsyncSession, *, default_role_id: uuid.UUID):
        self.session = session
        self.default_role_id = default_role_id

    @staticmethod
    def _to_domain(user_m: UsuarioModel) -> User:
        role_m = user_m.rol
        role = Role(id=str(role_m.id), name=role_m.nombre) if role_m else Role(id="", name="(desconocido)")
        return User(
            id=str(user_m.id),
            email=user_m.email,
            name=user_m.nombre,
            role=role,
        )

    async def _load_user_by_id(self, user_id: uuid.UUID) -> Optional[UsuarioModel]:
        q = (
            select(UsuarioModel)
            .where(UsuarioModel.id == user_id)
            .options(selectinload(UsuarioModel.rol))
        )
        return (await self.session.execute(q)).scalars().first()

    async def find_by_google_sub(self, sub: str) -> Optional[User]:
        q = (
            select(UsuarioModel)
            .join(UserIdentityModel, UserIdentityModel.usuario_id == UsuarioModel.id)
            .where(
                UserIdentityModel.provider == "google",
                UserIdentityModel.provider_user_id == sub,
            )
            .options(selectinload(UsuarioModel.rol))
        )
        m = (await self.session.execute(q)).scalars().first()
        return self._to_domain(m) if m else None

    async def find_by_email(self, email: str) -> Optional[User]:
        q = (
            select(UsuarioModel)
            .where(UsuarioModel.email == email)
            .options(selectinload(UsuarioModel.rol))
        )
        m = (await self.session.execute(q)).scalars().first()
        return self._to_domain(m) if m else None

    async def get_role_name(self, user_id: str) -> Optional[str]:
        try:
            uid = uuid.UUID(user_id)
        except Exception:
            return None

        q = (
            select(RolModel.nombre)
            .join(UsuarioModel, UsuarioModel.rol_id == RolModel.id)
            .where(UsuarioModel.id == uid)
        )
        return (await self.session.execute(q)).scalar_one_or_none()

    async def upsert_user_with_identity(
        self,
        *,
        email: str,
        name: str | None,
        sub: str,
        refresh_token: str | None
    ) -> User:
        ident_q = select(UserIdentityModel).where(
            UserIdentityModel.provider == "google",
            UserIdentityModel.provider_user_id == sub,
        )
        ident_m = (await self.session.execute(ident_q)).scalars().first()

        if ident_m:
            user_m = await self._load_user_by_id(ident_m.usuario_id)
            if refresh_token:
                ident_m.refresh_token_hash = refresh_token
                await self.session.flush()
            return self._to_domain(user_m)

        user_q = (
            select(UsuarioModel)
            .where(UsuarioModel.email == email)
            .options(selectinload(UsuarioModel.rol))
        )
        user_m = (await self.session.execute(user_q)).scalars().first()

        if not user_m:
            user_m = UsuarioModel(
                id=uuid.uuid4(),
                rol_id=self.default_role_id,
                email=email,
                nombre=(name or email.split("@")[0]),
            )
            self.session.add(user_m)
            await self.session.flush()

        exists_ident_q = select(UserIdentityModel).where(
            UserIdentityModel.provider == "google",
            UserIdentityModel.provider_user_id == sub,
        )
        exists_ident = (await self.session.execute(exists_ident_q)).scalars().first()
        if not exists_ident:
            ident_new = UserIdentityModel(
                id=uuid.uuid4(),
                usuario_id=user_m.id,
                provider="google",
                provider_user_id=sub,
                email=email,
                refresh_token_hash=refresh_token,
            )
            self.session.add(ident_new)
            await self.session.flush()

        user_m = await self._load_user_by_id(user_m.id)
        return self._to_domain(user_m)
