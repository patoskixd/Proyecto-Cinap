from __future__ import annotations
import uuid
from typing import Optional, Iterable, Tuple
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from fastapi import Query
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid as uuidlib
from app.use_cases.ports.slots_port import SlotsRepo
from app.interface_adapters.orm.models_scheduling import (
    AsesorPerfilModel, ServicioModel, CategoriaModel, AsesorServicioModel,
    CupoModel, RecursoModel, EdificioModel, CampusModel, EstadoCupo
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

        conds = []
        for ini, fin in periods:
            conds.append(sa.and_(CupoModel.inicio < fin, CupoModel.fin > ini))

        if not conds:
            return []

        q = (
            select(CupoModel.id, CupoModel.inicio, CupoModel.fin)
            .where(
                CupoModel.recurso_id == uuid.UUID(recurso_id),
                # Consideramos cupos activos o cancelados; ignoramos EXPIRADO
                CupoModel.estado.in_([EstadoCupo.ABIERTO, EstadoCupo.RESERVADO, EstadoCupo.CANCELADO]),
                sa.or_(*conds),
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

        conds = []
        for ini, fin in periods:
            conds.append(sa.and_(CupoModel.inicio < fin, CupoModel.fin > ini))

        if not conds:
            return []

        q = (
            select(CupoModel.id, CupoModel.inicio, CupoModel.fin)
            .where(
                CupoModel.asesor_id == uuid.UUID(asesor_id),
                CupoModel.estado.in_([EstadoCupo.ABIERTO, EstadoCupo.RESERVADO, EstadoCupo.CANCELADO]),
                sa.or_(*conds),
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
    
    async def complete_reserved_slots(self) -> int:
        """
        Marca como REALIZADO todos los cupos RESERVADO cuyo fin < now().
        """
        upd = (
            sa.update(CupoModel)
            .where(
                CupoModel.estado == EstadoCupo.RESERVADO,
                CupoModel.fin < sa.func.now(),
            )
            .values(estado=EstadoCupo.REALIZADO)
        )
        res = await self.s.execute(upd)
        return int(res.rowcount or 0)
    
    #  expirar cupos cuya hora ya paso
    async def expire_open_slots(self) -> int:
        """
        Marca como EXPIRADO todos los cupos ABIERTO con fin < now().
        Retorna cuántas filas se actualizaron.
        """
        upd = (
            sa.update(CupoModel)
            .where(
                CupoModel.estado == EstadoCupo.ABIERTO,
                CupoModel.fin < sa.func.now(),
            )
            .values(estado=EstadoCupo.EXPIRADO)
        )
        res = await self.s.execute(upd)
        return int(res.rowcount or 0)
    
    async def get_common_times_and_resources(self) -> dict:
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
        return {"times": times, "resources": resources}

    async def get_create_slots_data_for_advisor(self, asesor_id: str) -> dict:
        j_svcs = (
            sa.select(
                ServicioModel.id,
                ServicioModel.categoria_id,
                ServicioModel.nombre,
                ServicioModel.duracion_minutos,
                CategoriaModel.id.label("cat_id"),
                CategoriaModel.nombre.label("cat_nombre"),
                CategoriaModel.descripcion.label("cat_desc"),
            )
            .join(AsesorServicioModel, AsesorServicioModel.servicio_id == ServicioModel.id)
            .join(CategoriaModel, CategoriaModel.id == ServicioModel.categoria_id)
            .where(
                AsesorServicioModel.asesor_id == uuid.UUID(asesor_id),
                ServicioModel.activo == True,
                CategoriaModel.activo == True,
            )
            .order_by(CategoriaModel.nombre.asc(), ServicioModel.nombre.asc())
        )
        rows = (await self.s.execute(j_svcs)).all()

        categories_map: dict[str, dict] = {}
        services_by_cat: dict[str, list] = {}

        for r in rows:
            cat_id = str(r.cat_id)
            if cat_id not in categories_map:
                categories_map[cat_id] = {
                    "id": cat_id,
                    "icon": "🎓",
                    "name": r.cat_nombre,
                    "description": r.cat_desc or "",
                }
            services_by_cat.setdefault(cat_id, []).append({
                "id": str(r.id),
                "categoryId": str(r.categoria_id),
                "name": r.nombre,
                "description": "",
                "duration": f"{int(r.duracion_minutos)} min",
            })

        categories = list(categories_map.values())

        base = await self.get_common_times_and_resources()

        return {
            "categories": categories,
            "servicesByCategory": services_by_cat,
            "times": base["times"],
            "resources": base["resources"],
        }
    
    async def sweep_cupos_vencidos(self, batch: int = 1000) -> dict:
        """
        Ejecuta el barrido en BD:
        - ABIERTO -> EXPIRADO si ya pasó la hora de inicio
        - RESERVADO -> REALIZADO si ya pasó la hora de fin
        - Asesorías vinculadas a esos cupos -> COMPLETADA
        """
        q = text("SELECT * FROM sweep_cupos_vencidos(:batch)")
        row = (await self.s.execute(q, {"batch": batch})).first()
        # La función retorna: (expirados, realizados, asesorias_completadas)
        expirados = row[0] if row else 0
        realizados = row[1] if row else 0
        asesorias = row[2] if row else 0
        return {
            "expirados": expirados,
            "realizados": realizados,
            "asesorias_completadas": asesorias,
        }
    
