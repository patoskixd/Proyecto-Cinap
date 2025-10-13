from __future__ import annotations
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, relationship
from app.interface_adapters.orm.base import Base
from enum import Enum as PyEnum

class AsesorPerfilModel(Base):
    __tablename__ = "asesor_perfil"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    

    usuario = relationship("UsuarioModel", lazy="selectin")
    servicios = relationship("AsesorServicioModel", back_populates="asesor", lazy="selectin")

class CategoriaModel(Base):
    __tablename__ = "categoria"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    descripcion: Mapped[str | None] = sa.Column(sa.Text)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))

class ServicioModel(Base):
    __tablename__ = "servicio"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    categoria_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("categoria.id", ondelete="RESTRICT"), nullable=False)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    duracion_minutos: Mapped[int] = sa.Column(sa.Integer, nullable=False)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    categoria = relationship("CategoriaModel", lazy="selectin")

class AsesorServicioModel(Base):
    __tablename__ = "asesor_servicio"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asesor_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("asesor_perfil.id", ondelete="CASCADE"), nullable=False)
    servicio_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("servicio.id", ondelete="RESTRICT"), nullable=False)
    asesor = relationship("AsesorPerfilModel", back_populates="servicios")
    servicio = relationship("ServicioModel", lazy="selectin")

class CampusModel(Base):
    __tablename__ = "campus"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    direccion: Mapped[str] = sa.Column(sa.Text, nullable=False)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))

class EdificioModel(Base):
    __tablename__ = "edificio"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campus_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("campus.id", ondelete="RESTRICT"), nullable=False)
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))

class RecursoModel(Base):
    __tablename__ = "recurso"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo: Mapped[str] = sa.Column(sa.Text, nullable=False) 
    nombre: Mapped[str] = sa.Column(sa.Text, nullable=False)
    activo: Mapped[bool] = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    edificio_id: Mapped[uuid.UUID | None] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("edificio.id", ondelete="RESTRICT"))
    sala_numero = sa.Column(sa.Text)
    capacidad = sa.Column(sa.Integer)

class EstadoCupo(PyEnum):
    ABIERTO   = "ABIERTO"
    RESERVADO = "RESERVADO"
    CANCELADO = "CANCELADO"
    EXPIRADO  = "EXPIRADO"
    REALIZADO = "REALIZADO"

estado_cupo = sa.Enum(EstadoCupo,name="estado_cupo",native_enum=True,create_type=False)

class CupoModel(Base):
    __tablename__ = "cupo"
    id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asesor_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("asesor_perfil.id", ondelete="CASCADE"), nullable=False)
    servicio_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("servicio.id", ondelete="RESTRICT"), nullable=False)
    recurso_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("recurso.id", ondelete="RESTRICT"))
    inicio = sa.Column(sa.DateTime(timezone=True), nullable=False)
    fin    = sa.Column(sa.DateTime(timezone=True), nullable=False)
    estado = sa.Column(estado_cupo,nullable=False,server_default=EstadoCupo.ABIERTO.value,)
    notas  = sa.Column(sa.Text)

