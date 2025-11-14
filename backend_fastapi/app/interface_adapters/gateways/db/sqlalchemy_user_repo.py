from __future__ import annotations
from typing import Optional
import uuid
import logging
from datetime import datetime, timezone
import sqlalchemy as sa
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
from app.interface_adapters.services.token_cipher import TokenCipher, get_token_cipher

log = logging.getLogger(__name__)

class SqlAlchemyUserRepo(UserRepo):
    def __init__(
        self,
        session: AsyncSession,
        *,
        default_role_id: uuid.UUID | None,
        token_cipher: TokenCipher | None = None,
    ):
        self.session = session
        self.default_role_id = default_role_id
        self._token_cipher = token_cipher or get_token_cipher()

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


    async def get_refresh_token_by_usuario_id(self, usuario_id: str, provider: str = "google") -> Optional[str]:
        try:
            uid = uuid.UUID(usuario_id)
        except Exception:
            return None
        q = (
            select(UserIdentityModel.refresh_token_hash)  
            .where(UserIdentityModel.usuario_id == uid)
            .where(UserIdentityModel.provider == provider)
            .limit(1)
        )
        stored = (await self.session.execute(q)).scalar_one_or_none()
        decrypted = self._token_cipher.decrypt(stored)
        if decrypted and decrypted != stored:
            log.debug("Decrypted refresh token for user %s (len=%s)", usuario_id, len(decrypted))
        return decrypted

    async def upsert_user_with_identity(
        self,
        *,
        email: str,
        name: str | None,
        sub: str,
        refresh_token: str | None,
    ) -> User:
        # 1) ¿Existe identidad por sub?
        ident_q = select(UserIdentityModel).where(
            UserIdentityModel.provider == "google",
            UserIdentityModel.provider_user_id == sub,
        )
        ident_m = (await self.session.execute(ident_q)).scalars().first()

        if ident_m:
            # Actualiza flags básicos y refresh_token SOLO si viene
            user_m = await self._load_user_by_id(ident_m.usuario_id)
            ident_m.conectado = True
            ident_m.ultimo_sync = datetime.now(timezone.utc)
            #  Solo persiste si viene uno NUEVO 
            if refresh_token:
                ident_m.refresh_token_hash = self._token_cipher.encrypt(refresh_token)
                log.debug("Actualizado refresh token (identity existente) usuario=%s len=%s", user_m.id, len(refresh_token))
            await self.session.flush()
            return self._to_domain(user_m)

        # 2) ¿Existe usuario por email?
        user_q = (
            select(UsuarioModel)
            .where(UsuarioModel.email == email)
            .options(selectinload(UsuarioModel.rol))
        )
        user_m = (await self.session.execute(user_q)).scalars().first()

        if not user_m:
            # Crea usuario
            user_m = UsuarioModel(
                id=uuid.uuid4(),
                rol_id=self.default_role_id,
                email=email,
                nombre=(name or email.split("@")[0]),
            )
            self.session.add(user_m)
            await self.session.flush()

        # 3) ¿Ya hay identidad google para ese usuario?
        existing_google_ident_q = select(UserIdentityModel).where(
            UserIdentityModel.usuario_id == user_m.id,
            UserIdentityModel.provider == "google",
        )
        existing_google_ident = (await self.session.execute(existing_google_ident_q)).scalars().first()

        if existing_google_ident:
            # Sincroniza el sub  y flags
            existing_google_ident.provider_user_id = sub
            existing_google_ident.conectado = True
            existing_google_ident.ultimo_sync = datetime.now(timezone.utc)
            if refresh_token:
                existing_google_ident.refresh_token_hash = self._token_cipher.encrypt(refresh_token)
                log.debug("Actualizado refresh token (usuario existente) usuario=%s len=%s", user_m.id, len(refresh_token))

            await self.session.flush()
        else:
            # Crea identidad con refresh_token si vino
            ident_new = UserIdentityModel(
                id=uuid.uuid4(),
                usuario_id=user_m.id,
                provider="google",
                provider_user_id=sub,
                email=email,
                refresh_token_hash=self._token_cipher.encrypt(refresh_token) if refresh_token else None,
                conectado=True,
                ultimo_sync=datetime.now(timezone.utc),
            )
            if refresh_token:
                log.debug("Guardado refresh token nuevo usuario=%s len=%s", user_m.id, len(refresh_token))
            self.session.add(ident_new)
            await self.session.flush()

        # Recarga con rol
        user_m = await self._load_user_by_id(user_m.id)
        return self._to_domain(user_m)

    async def mark_logged_out(self, user_id: str) -> None:
        try:
            uid = uuid.UUID(user_id)
        except Exception:
            return
        await self.session.execute(
            sa.update(UserIdentityModel)
              .where(UserIdentityModel.usuario_id == uid)
              .values(
                  conectado=False,
                  ultimo_sync=datetime.now(timezone.utc),
              )
        )
        await self.session.flush()

    async def invalidate_refresh_token(self, usuario_id: str, provider: str = "google") -> None:
        try:
            uid = uuid.UUID(usuario_id)
        except Exception:
            return
        await self.session.execute(
            sa.update(UserIdentityModel)
              .where(UserIdentityModel.usuario_id == uid)
              .where(UserIdentityModel.provider == provider)
              .values(
                  refresh_token_hash=None,
                  conectado=False,
                  ultimo_sync=datetime.now(timezone.utc),
              )
        )
        await self.session.flush()
