from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
from .base import Base

class DocentePerfilModel(Base):
    __tablename__ = "docente_perfil"

    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[uuid.UUID] = sa.Column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuario.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))

    # Relación con usuario
    usuario = relationship("UsuarioModel", lazy="selectin")