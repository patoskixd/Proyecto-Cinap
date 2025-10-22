from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
import sqlalchemy as sa
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import enum
from sqlalchemy.dialects.postgresql import ENUM

class Base(DeclarativeBase):
    pass

class EstadoCupo(str, enum.Enum):
    ABIERTO = "ABIERTO"
    RESERVADO = "RESERVADO"
    CANCELADO = "CANCELADO"
    EXPIRADO = "EXPIRADO"

class EstadoAsesoria(str, enum.Enum):
    PENDIENTE   = "PENDIENTE"
    CONFIRMADA  = "CONFIRMADA"
    REPROGRAMADA= "REPROGRAMADA"
    CANCELADA   = "CANCELADA"
    COMPLETADA   = "COMPLETADA"

class CupoORM(Base):
    __tablename__ = "cupo"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    asesor_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    servicio_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    estado: Mapped[EstadoCupo] = mapped_column(
        ENUM(EstadoCupo, name="estado_cupo", create_type=False, native_enum=True),
        nullable=False
    )

class AsesoriaORM(Base):
    __tablename__ = "asesoria"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    docente_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    cupo_id: Mapped[UUID] = mapped_column(ForeignKey("cupo.id", ondelete="RESTRICT"), nullable=False)
    estado: Mapped[EstadoAsesoria] = mapped_column(
        sa.Enum(EstadoAsesoria, name="estado_asesoria", create_type=False, native_enum=True),
        nullable=False,
    )
    origen: Mapped[str] = mapped_column(String, nullable=False)
    notas: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class UserIdentityORM(Base):
    __tablename__ = "user_identity"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(50), default="google", index=True)
    provider_user_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    conectado: Mapped[bool] = mapped_column(sa.Boolean, default=False, nullable=False)
    refresh_token_hash: Mapped[Optional[str]] = mapped_column(sa.Text)
    ultimo_sync: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

class CalendarEventORM(Base):
    __tablename__ = "calendar_event"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)

    asesoria_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("asesoria.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_identity_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_identity.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    calendar_event_id: Mapped[str] = mapped_column(String, nullable=False)
    calendar_html_link: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    creado_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actualizado_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    asesoria: Mapped["AsesoriaORM"] = relationship("AsesoriaORM", backref="calendar_events", lazy="selectin")
    user_identity: Mapped[Optional["UserIdentityORM"]] = relationship("UserIdentityORM", lazy="selectin")