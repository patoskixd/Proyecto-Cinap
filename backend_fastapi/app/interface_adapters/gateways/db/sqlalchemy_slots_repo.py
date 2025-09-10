from __future__ import annotations
import uuid
from typing import Optional, Iterable, Tuple
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.use_cases.ports.slots_port import SlotsRepo
from app.interface_adapters.orm.models_scheduling import (
    AsesorPerfilModel, ServicioModel, CategoriaModel, AsesorServicioModel,
    CupoModel, RecursoModel, EdificioModel, CampusModel
)

class SqlAlchemySlotsRepo(SlotsRepo):
    def __init__(self, session: AsyncSession):
        self.s = session

    async def resolve_asesor_id(self, usuario_id: str) -> Optional[str]:
        q = select(AsesorPerfilModel.id).where(AsesorPerfilModel.usuario_id == uuid.UUID(usuario_id))
        x = (await self.s.execute(q)).scalar_one_or_none()
        return str(x) if x else None

    async def get_servicio_minutes(self, servicio_id: str) -> int:
        q = select(ServicioModel.duracion_minutos).where(ServicioModel.id == uuid.UUID(servicio_id))
        mins = (await self.s.execute(q)).scalar_one()
        return int(mins)

    async def ensure_asesor_puede_dicto_servicio(self, asesor_id: str, servicio_id: str) -> bool:
        q = select(AsesorServicioModel.id).where(
            AsesorServicioModel.asesor_id == uuid.UUID(asesor_id),
            AsesorServicioModel.servicio_id == uuid.UUID(servicio_id),
        )
        return (await self.s.execute(q)).scalar_one_or_none() is not None

    async def find_conflicting_slots(
        self,
        recurso_id: str,
        periods: Iterable[tuple[datetime, datetime]],
    ) -> list[tuple[str, datetime, datetime]]:
        """
        Choques para un RECURSO específico (LAB/SALA/etc.).
        Se considera overlap abierto/cerrado: [inicio, fin)
        """
        conds = []
        for ini, fin in periods:
            conds.append(sa.and_(CupoModel.inicio < fin, CupoModel.fin > ini))

        if not conds:
            return []

        q = (
            select(CupoModel.id, CupoModel.inicio, CupoModel.fin)
            .where(
                CupoModel.recurso_id == uuid.UUID(recurso_id),
                sa.or_(*conds)
            )
            .order_by(CupoModel.inicio.asc(), CupoModel.fin.asc())
        )
        rows = (await self.s.execute(q)).all()
        return [(str(r.id), r.inicio, r.fin) for r in rows]

    async def find_conflicting_slots_for_advisor(
        self,
        asesor_id: str,
        periods: Iterable[tuple[datetime, datetime]],
    ) -> list[tuple[str, datetime, datetime]]:
        """
        Choques para el ASESOR (independiente del recurso/servicio/categoría).
        Se considera overlap [inicio, fin).
        """
        conds = []
        for ini, fin in periods:
            conds.append(sa.and_(CupoModel.inicio < fin, CupoModel.fin > ini))

        if not conds:
            return []

        q = (
            select(CupoModel.id, CupoModel.inicio, CupoModel.fin)
            .where(
                CupoModel.asesor_id == uuid.UUID(asesor_id),
                sa.or_(*conds)
            )
            .order_by(CupoModel.inicio.asc(), CupoModel.fin.asc())
        )
        rows = (await self.s.execute(q)).all()
        return [(str(r.id), r.inicio, r.fin) for r in rows]

    async def get_create_slots_data(self) -> dict:

        cats = (await self.s.execute(select(CategoriaModel).where(CategoriaModel.activo == True))).scalars().all()
        cats_out = [
            {"id": str(c.id), "icon": "🎓", "name": c.nombre, "description": c.descripcion or ""}
            for c in cats
        ]

        svcs = (await self.s.execute(select(ServicioModel).where(ServicioModel.activo == True))).scalars().all()
        by_cat: dict[str, list] = {}
        for s in svcs:
            by_cat.setdefault(str(s.categoria_id), []).append({
                "id": str(s.id),
                "categoryId": str(s.categoria_id),
                "name": s.nombre,
                "description": "",
                "duration": f"{s.duracion_minutos} min",
            })

        j = (
            sa.select(
                RecursoModel.id.label("id"),
                RecursoModel.tipo.label("tipo"),
                RecursoModel.sala_numero.label("number"),
                RecursoModel.nombre.label("alias"),
                RecursoModel.capacidad.label("capacity"),
                EdificioModel.id.label("buildingId"),
                EdificioModel.nombre.label("building"),
                CampusModel.id.label("campusId"),
                CampusModel.nombre.label("campus"),
            )
            .join(EdificioModel, EdificioModel.id == RecursoModel.edificio_id, isouter=True)
            .join(CampusModel, CampusModel.id == EdificioModel.campus_id, isouter=True)
            .where(
                RecursoModel.activo == True,
                sa.or_(EdificioModel.id == None, EdificioModel.activo == True),
                sa.or_(CampusModel.id == None, CampusModel.activo == True),
            )
        )

        recs = (await self.s.execute(j)).all()
        resources = [
            {
                "id": str(r.id),
                "tipo": r.tipo,
                "number": r.number,
                "alias": r.alias,
                "capacity": r.capacity,
                "buildingId": str(r.buildingId) if r.buildingId else None,
                "building": r.building,
                "campusId": str(r.campusId) if r.campusId else None,
                "campus": r.campus,
            }
            for r in recs
        ]
        times = [f"{h:02d}:00" for h in range(8, 19)]
        return {"categories": cats_out, "servicesByCategory": by_cat, "times": times, "resources": resources}

    async def bulk_insert_cupos(
        self,
        rows: Iterable[tuple[str, str, str, datetime, datetime, str | None]]
    ) -> tuple[int, int]:
        """
        Inserta fila a fila; si pega en un constraint (recurso o asesor),
        captura IntegrityError y lo cuenta como 'skipped'. La validación
        previa en el caso de uso debería evitar llegar aquí en conflictos normales.
        """
        created, skipped = 0, 0

        for asesor_id, servicio_id, recurso_id, ini, fin, notas in rows:
            if not recurso_id:
                raise ValueError("recurso_id es obligatorio")
            async with self.s.begin_nested():
                try:
                    self.s.add(CupoModel(
                        asesor_id=uuid.UUID(asesor_id),
                        servicio_id=uuid.UUID(servicio_id),
                        recurso_id=uuid.UUID(recurso_id),
                        inicio=ini,
                        fin=fin,
                        notas=notas
                    ))
                    await self.s.flush()
                    created += 1
                except IntegrityError:
                    skipped += 1 

        return created, skipped
