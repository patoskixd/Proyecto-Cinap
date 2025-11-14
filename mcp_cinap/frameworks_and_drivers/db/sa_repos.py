from typing import Optional, Sequence, Dict, Any
from uuid import UUID
from sqlalchemy import String, ForeignKey, Boolean, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, selectinload
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from application.ports import SlotRepository, AppointmentRepository, TimeRange, Pagination, AdvisorRepository, ServiceRepository
from frameworks_and_drivers.db.orm_models import Base, CampusORM, CupoORM, AsesoriaORM, EdificioORM, EstadoCupo, RecursoORM

class UsuarioORM(Base):
    __tablename__ = "usuario"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    email: Mapped[str] = mapped_column(String)
    nombre: Mapped[str] = mapped_column(String)

class AsesorPerfilORM(Base):
    __tablename__ = "asesor_perfil"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuario.id"))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

class DocentePerfilORM(Base):
    __tablename__ = "docente_perfil"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("usuario.id"))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

class ServicioORM(Base):
    __tablename__ = "servicio"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    nombre: Mapped[str] = mapped_column(String)

class AsesorServicioORM(Base):
    __tablename__ = "asesor_servicio"
    asesor_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("asesor_perfil.id"), primary_key=True)
    servicio_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("servicio.id"), primary_key=True)

class SAAdvisorRepository(AdvisorRepository):
    def __init__(self, s: AsyncSession): self.s = s

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        q = (
            select(AsesorPerfilORM.id.label("id"), UsuarioORM.nombre, UsuarioORM.email)
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .where(func.lower(UsuarioORM.email) == func.lower(email))
            .where(AsesorPerfilORM.activo == True)
        )
        row = (await self.s.execute(q)).first()
        return dict(row._mapping) if row else None

    async def search_by_name(self, text: str, limit: int = 10) -> Sequence[Dict[str, Any]]:
        t = f"%{text.lower()}%"
        q = (
            select(AsesorPerfilORM.id.label("id"), UsuarioORM.nombre, UsuarioORM.email)
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .where(AsesorPerfilORM.activo == True)
            .where(func.unaccent(func.lower(UsuarioORM.nombre)).like(func.unaccent(t)))
            .order_by(UsuarioORM.nombre.asc())
            .limit(limit)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]
    
    async def list_all(self) -> Sequence[Dict[str, Any]]:
        q = (
            select(AsesorPerfilORM.id, UsuarioORM.nombre, UsuarioORM.email)
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .where(AsesorPerfilORM.activo == True)
            .order_by(UsuarioORM.nombre.asc())
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]

    async def find_with_services(self, asesor_id: UUID) -> Dict[str, Any]:
        q = (
            select(
                AsesorPerfilORM.id, UsuarioORM.nombre, UsuarioORM.email,
                ServicioORM.id.label("servicio_id"), ServicioORM.nombre.label("servicio_nombre")
            )
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .join(AsesorServicioORM, AsesorServicioORM.asesor_id == AsesorPerfilORM.id)
            .join(ServicioORM, ServicioORM.id == AsesorServicioORM.servicio_id)
            .where(AsesorPerfilORM.id == asesor_id)
        )
        rows = (await self.s.execute(q)).all()
        if not rows:
            return {}
        base = {"id": str(rows[0].id), "nombre": rows[0].nombre, "email": rows[0].email}
        base["servicios"] = [{"id": str(r.servicio_id), "nombre": r.servicio_nombre} for r in rows]
        return base
    
    async def get_by_ids(self, ids: Sequence[UUID]) -> Sequence[Dict[str, Any]]:
        if not ids:
            return []
        q = (
            select(AsesorPerfilORM.id.label("id"), UsuarioORM.nombre, UsuarioORM.email)
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .where(AsesorPerfilORM.id.in_(list(ids)))
            .where(AsesorPerfilORM.activo == True)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]

class SAServiceRepository(ServiceRepository):
    def __init__(self, s: AsyncSession): self.s = s

    async def search_by_name(self, text: str, limit: int = 10) -> Sequence[Dict[str, Any]]:
        t = f"%{text.lower()}%"

        q = (
            select(ServicioORM.id.label("id"), ServicioORM.nombre.label("nombre"))
            .where(func.unaccent(func.lower(ServicioORM.nombre)).like(func.unaccent(t)))
            .order_by(ServicioORM.nombre.asc())
            .limit(limit)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]
    
    async def list_all(self) -> Sequence[Dict[str, Any]]:
        q = select(ServicioORM.id, ServicioORM.nombre).order_by(ServicioORM.nombre.asc())
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]

    async def find_with_advisors(self, servicio_id: UUID) -> Dict[str, Any]:
        q = (
            select(ServicioORM.id, ServicioORM.nombre,
                   AsesorPerfilORM.id.label("asesor_id"), UsuarioORM.nombre.label("asesor_nombre"),
                   UsuarioORM.email.label("asesor_email"))
            .join(AsesorServicioORM, AsesorServicioORM.servicio_id == ServicioORM.id)
            .join(AsesorPerfilORM, AsesorPerfilORM.id == AsesorServicioORM.asesor_id)
            .join(UsuarioORM, UsuarioORM.id == AsesorPerfilORM.usuario_id)
            .where(ServicioORM.id == servicio_id)
        )
        rows = (await self.s.execute(q)).all()
        if not rows: return {}
        base = {"id": str(rows[0].id), "nombre": rows[0].nombre}
        base["asesores"] = [
            {"id": str(r.asesor_id), "nombre": r.asesor_nombre, "email": r.asesor_email}
            for r in rows
        ]
        return base

class SASlotRepository(SlotRepository):
    def __init__(self, s: AsyncSession): self.s = s

    async def list_open_by_advisor_service_range(
        self, asesor_id: UUID, servicio_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[Dict[str, Any]]:
        q = (
            select(
                CupoORM.id.label("id"),
                CupoORM.inicio.label("inicio"),
                CupoORM.fin.label("fin"),
                CupoORM.servicio_id.label("servicio_id"),
                CupoORM.asesor_id.label("asesor_id"),
            )
            .where(CupoORM.asesor_id == asesor_id)
            .where(CupoORM.servicio_id == servicio_id)
            .where(CupoORM.estado == EstadoCupo.ABIERTO)
            .where(CupoORM.inicio >= tr.start, CupoORM.fin <= tr.end)
            .order_by(CupoORM.inicio)
            .limit(pag.per_page)
            .offset((pag.page - 1) * pag.per_page)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]

    async def list_open_by_advisor_range(
        self, asesor_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[Dict[str, Any]]:
        q = (
            select(
                CupoORM.id.label("id"),
                CupoORM.inicio.label("inicio"),
                CupoORM.fin.label("fin"),
                CupoORM.servicio_id.label("servicio_id"),
                CupoORM.asesor_id.label("asesor_id"),
            )
            .where(CupoORM.asesor_id == asesor_id)
            .where(CupoORM.estado == EstadoCupo.ABIERTO)
            .where(CupoORM.inicio >= tr.start, CupoORM.fin <= tr.end)
            .order_by(CupoORM.inicio)
            .limit(pag.per_page)
            .offset((pag.page - 1) * pag.per_page)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]
    
    async def list_open_by_service_range(
        self, servicio_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[Dict[str, Any]]:
        q = (
            select(
                CupoORM.id.label("id"),
                CupoORM.inicio.label("inicio"),
                CupoORM.fin.label("fin"),
                CupoORM.servicio_id.label("servicio_id"),
                CupoORM.asesor_id.label("asesor_id"),
            )
            .where(CupoORM.servicio_id == servicio_id)
            .where(CupoORM.inicio >= tr.start)
            .where(CupoORM.fin    <= tr.end)
            .where(CupoORM.estado == EstadoCupo.ABIERTO)
            .order_by(CupoORM.inicio.asc())
            .offset((pag.page - 1) * pag.per_page)
            .limit(pag.per_page)
        )
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]


class SAApptRepository(AppointmentRepository):
    def __init__(self, s: AsyncSession): self.s = s

    async def _base_select(self):
        return select(
            AsesoriaORM.id.label("asesoria_id"),
            CupoORM.inicio.label("inicio"),
            CupoORM.fin.label("fin"),
            AsesoriaORM.estado.label("estado"),
            CupoORM.servicio_id.label("servicio_id"),
            CupoORM.asesor_id.label("asesor_id"),
            AsesoriaORM.docente_id.label("docente_id"),
        ).join(CupoORM, CupoORM.id == AsesoriaORM.cupo_id)

    async def list_for_docente_range(
        self, docente_id: UUID, tr: TimeRange, states, page: int, per_page: int
    ) -> Sequence[Dict[str, Any]]:
        q = (await self._base_select()).where(
            AsesoriaORM.docente_id == docente_id,
            ~((CupoORM.fin <= tr.start) | (tr.end <= CupoORM.inicio)),
        )
        if states:
            q = q.where(AsesoriaORM.estado.in_(list(states)))
        q = q.order_by(CupoORM.inicio.desc()).offset((page-1)*per_page).limit(per_page)
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]

    async def list_for_asesor_range(
        self, asesor_id: UUID, tr: TimeRange, states, page: int, per_page: int
    ) -> Sequence[Dict[str, Any]]:
        q = (await self._base_select()).where(
            CupoORM.asesor_id == asesor_id,
            ~((CupoORM.fin <= tr.start) | (tr.end <= CupoORM.inicio)),
        )
        if states:
            q = q.where(AsesoriaORM.estado.in_(list(states)))
        q = q.order_by(CupoORM.inicio.desc()).offset((page-1)*per_page).limit(per_page)
        rows = (await self.s.execute(q)).all()
        return [dict(r._mapping) for r in rows]
    
class LocationRepo:
    def __init__(self, s: AsyncSession):
        self.s = s

    async def load_cupo_with_location(self, cupo_id: UUID) -> Optional[CupoORM]:
        stmt = (
            select(CupoORM)
            .options(
                selectinload(CupoORM.recurso)
                .selectinload(RecursoORM.edificio)
                .selectinload(EdificioORM.campus)
            )
            .where(CupoORM.id == cupo_id)
        )
        return (await self.s.execute(stmt)).scalar_one_or_none()

    @staticmethod
    def format_location_from_cupo(cupo: Optional[CupoORM]) -> str:
        if not cupo or not getattr(cupo, "recurso", None):
            return "Por confirmar"

        r: RecursoORM = cupo.recurso
        e: Optional[EdificioORM] = getattr(r, "edificio", None)
        c: Optional[CampusORM] = getattr(e, "campus", None) if e else None

        partes = []
        if c and c.nombre:
            partes.append(c.nombre)
        if e and e.nombre:
            partes.append(f"Edificio {e.nombre}")

        sala = (r.sala_numero or r.nombre)
        if sala:
            low = sala.strip().lower()
            if not (low.startswith("sala") or low.startswith("lab") or low.startswith("laboratorio")):
                sala = f"Sala {sala}"
            partes.append(sala)

        return " / ".join(partes) if partes else "Por confirmar"

    async def get_location_for_cupo(self, cupo_id: UUID) -> str:
        cupo = await self.load_cupo_with_location(cupo_id)
        return self.format_location_from_cupo(cupo)