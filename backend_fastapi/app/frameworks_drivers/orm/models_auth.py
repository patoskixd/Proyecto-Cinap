from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
from app.frameworks_drivers.config.db import Base

class RolModel(Base):
    __tablename__ = "rol"

    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False, unique=True)

class UsuarioModel(Base):
    __tablename__ = "usuario"

    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True)
    rol_id: Mapped[uuid.UUID] = sa.Column(
        UUID(as_uuid=True),
        sa.ForeignKey("rol.id", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    email: Mapped[str] = sa.Column(sa.Text, nullable=False, unique=True)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    creado_en = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"))
    actualizado_en = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"))

    rol = relationship("RolModel", lazy="selectin")
    identities = relationship(
        "UserIdentityModel",
        back_populates="usuario",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

class UserIdentityModel(Base):
    __tablename__ = "user_identity"

    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[uuid.UUID] = sa.Column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuario.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = sa.Column(sa.Text, nullable=False)
    provider_user_id: Mapped[str] = sa.Column(sa.Text, nullable=False)
    email: Mapped[str] = sa.Column(sa.Text, nullable=False)
    conectado: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    refresh_token_hash: Mapped[str | None] = sa.Column(sa.Text)
    ultimo_sync = sa.Column(sa.DateTime(timezone=True))

    usuario = relationship("UsuarioModel", back_populates="identities", lazy="selectin")

    __table_args__ = (
        sa.UniqueConstraint("usuario_id", "provider", name="uq_identity_user_provider"),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_identity_provider_sub"),
    )
