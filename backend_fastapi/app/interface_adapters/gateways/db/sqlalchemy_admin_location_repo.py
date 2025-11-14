from typing import Optional, List, Dict, Any
import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

ALLOWED_ROOM_TYPES = (
    "SALA",
    "LAB",
    "AUDITORIO",
    "SALA_REUNIONES",
    "SALA_VIRTUAL",
    "OFICINA",
)
ALLOWED_ROOM_TYPES_SQL = ", ".join(f"'{it}'" for it in ALLOWED_ROOM_TYPES)
ALLOWED_ROOM_TYPES_ARRAY = f"ARRAY[{ALLOWED_ROOM_TYPES_SQL}]"

logger = logging.getLogger(__name__)
_room_types_checked = False
_room_types_lock = asyncio.Lock()


async def ensure_room_type_constraints(session: AsyncSession) -> None:
    """
    Make sure the DB CHECK constraint and trigger allow every supported room type.
    Runs once per process (subsequent calls are cheap).
    """
    global _room_types_checked
    if _room_types_checked:
        return

    async with _room_types_lock:
        if _room_types_checked:
            return
        try:
            await session.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM pg_constraint
                            WHERE conname = 'recurso_tipo_valido_chk'
                              AND conrelid = 'public.recurso'::regclass
                        ) THEN
                            ALTER TABLE public.recurso DROP CONSTRAINT recurso_tipo_valido_chk;
                        END IF;
                    END$$;
                    """
                )
            )

            await session.execute(
                text(
                    f"""
                    ALTER TABLE public.recurso
                        ADD CONSTRAINT recurso_tipo_valido_chk
                        CHECK (tipo = ANY ({ALLOWED_ROOM_TYPES_ARRAY}));
                    """
                )
            )

            await session.execute(
                text(
                    f"""
                    CREATE OR REPLACE FUNCTION public.ensure_cupo_recurso_es_espacio() RETURNS trigger
                        LANGUAGE plpgsql
                    AS $$
                    BEGIN
                      IF NEW.recurso_id IS NULL THEN
                        RETURN NEW;
                      END IF;

                      IF NOT EXISTS (
                        SELECT 1
                        FROM public.recurso r
                        WHERE r.id = NEW.recurso_id
                          AND r.activo = true
                          AND r.tipo = ANY ({ALLOWED_ROOM_TYPES_ARRAY})
                      ) THEN
                        RAISE EXCEPTION 'El recurso % no es un espacio valido o no esta activo.', NEW.recurso_id
                          USING ERRCODE = 'check_violation';
                      END IF;
                      RETURN NEW;
                    END;
                    $$;
                    """
                )
            )

            await session.commit()
            _room_types_checked = True
        except Exception as exc:  # pragma: no cover - defensive
            await session.rollback()
            logger.exception("No se pudieron actualizar las restricciones de tipos de sala: %s", exc)
            raise


def row_to_campus(r) -> Dict[str, Any]:
    return dict(id=r["id"], name=r["nombre"], address=r["direccion"], code=r["codigo"], active=r["activo"])


def row_to_building(r) -> Dict[str, Any]:
    return dict(
        id=r["id"],
        name=r["nombre"],
        campusId=r["campus_id"],
        code=r["codigo"],
        campusName=r["campus_nombre"],
        active=r["activo"],
    )


def frontend_to_db_type(frontend_type: Optional[str]) -> Optional[str]:
    if frontend_type is None:
        return None
    mapping = {
        "aula": "SALA",
        "laboratorio": "LAB",
        "auditorio": "AUDITORIO",
        "sala_reuniones": "SALA_REUNIONES",
        "sala_virtual": "SALA_VIRTUAL",
        "oficina": "OFICINA",
    }
    key = (frontend_type or "").lower()
    return mapping.get(key, (frontend_type or "").upper())


def row_to_room(r) -> Dict[str, Any]:
    return dict(
        id=r["id"],
        name=r["nombre"],
        buildingId=r["edificio_id"],
        buildingName=r["edificio_nombre"],
        number=r["sala_numero"],
        type=(r["tipo"] or "").lower(),
        capacity=r["capacidad"],
        active=r["activo"],
    )


def _page_dict(items, page, per_page, total, stats=None):
    pages = max(1, (total + per_page - 1) // per_page)
    out = dict(items=items, page=page, per_page=per_page, total=total, pages=pages)
    if stats is not None:
        out["stats"] = stats
    return out


class SqlAlchemyAdminLocationRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    #  Campus 
    async def list_campus(self) -> List[Dict[str, Any]]:
        rs = await self.session.execute(
            text("""
                SELECT id, nombre, direccion, codigo, activo
                FROM public.campus
                ORDER BY nombre
            """)
        )
        return [row_to_campus(r) for r in rs.mappings()]

    async def get_campus(self, campus_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                SELECT id, nombre, direccion, codigo, activo
                FROM public.campus
                WHERE id = :id
            """),
            dict(id=campus_id),
        )
        row = rs.mappings().first()
        if not row:
            raise ValueError("Campus not found")
        return row_to_campus(row)

    async def create_campus(self, name: str, address: str, code: Optional[str]) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                INSERT INTO public.campus (id, nombre, direccion, codigo, activo)
                VALUES (gen_random_uuid(), :name, :address, :code, true)
                RETURNING id, nombre, direccion, codigo, activo
            """),
            dict(name=name, address=address, code=code),
        )
        await self.session.commit()
        r = rs.mappings().one()
        return row_to_campus(r)

    async def update_campus(
            self, campus_id: str, name: Optional[str], address: Optional[str],
            code: Optional[str], active: Optional[bool] = None
        ) -> Dict[str, Any]:
            if active is not None:
                await self.session.execute(text("""
                    UPDATE public.campus SET activo = :active WHERE id=:id
                """), {"id": campus_id, "active": active})
                await self.session.execute(text("""
                    UPDATE public.edificio SET activo = :active WHERE campus_id=:id
                """), {"id": campus_id, "active": active})
                await self.session.execute(text("""
                    UPDATE public.recurso SET activo = :active
                    WHERE edificio_id IN (SELECT id FROM public.edificio WHERE campus_id = :id)
                """), {"id": campus_id, "active": active})

            rs = await self.session.execute(text("""
                UPDATE public.campus
                SET nombre   = COALESCE(:name, nombre),
                    direccion= COALESCE(:address, direccion),
                    codigo   = COALESCE(:code, codigo)
                WHERE id = :id
                RETURNING id, nombre, direccion, codigo, activo
            """), dict(id=campus_id, name=name, address=address, code=code))
            row = rs.mappings().first()
            await self.session.commit()
            if not row:
                raise ValueError("Campus not found")
            return row_to_campus(row)

    #  activar/desactivar campus 
    async def set_campus_active(self, campus_id: str, active: bool) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                UPDATE public.campus
                SET activo = :active
                WHERE id = :id
                RETURNING id, nombre, direccion, codigo, activo
            """),
            {"id": campus_id, "active": active},
        )
        base = rs.mappings().first()
        if not base:
            await self.session.commit()
            raise ValueError("Campus not found")
        await self.session.execute(
            text("""
                UPDATE public.edificio
                SET activo = :active
                WHERE campus_id = :id
            """),
            {"id": campus_id, "active": active},
        )
        await self.session.execute(
            text("""
                UPDATE public.recurso
                SET activo = :active
                WHERE edificio_id IN (SELECT id FROM public.edificio WHERE campus_id = :id)
            """),
            {"id": campus_id, "active": active},
        )

        await self.session.commit()
        return row_to_campus(base)
    
    async def delete_campus(self, campus_id: str) -> None:
        has_cupos = (await self.session.execute(text("""
            SELECT EXISTS(
              SELECT 1
              FROM public.cupo cu
              JOIN public.recurso r ON r.id = cu.recurso_id
              JOIN public.edificio e ON e.id = r.edificio_id
              WHERE e.campus_id = :id
            )
        """), {"id": campus_id})).scalar()
        if has_cupos:
            await self.session.rollback()
            raise IntegrityError("cupos-existentes", params=None, orig=None)

        # Borrado en cadena recurso -> edificio -> campus
        await self.session.execute(text("""
            DELETE FROM public.recurso
            WHERE edificio_id IN (SELECT id FROM public.edificio WHERE campus_id=:id)
        """), {"id": campus_id})
        await self.session.execute(text("DELETE FROM public.edificio WHERE campus_id=:id"), {"id": campus_id})
        rs = await self.session.execute(text("DELETE FROM public.campus WHERE id=:id"), {"id": campus_id})
        if rs.rowcount == 0:
            await self.session.rollback()
            raise ValueError("not-found")
        await self.session.commit()

    async def reactivate_campus(self, campus_id: str) -> Dict[str, Any]:
        return await self.set_campus_active(campus_id, True)

    #  Buildings 
    async def list_buildings(self, campus_id: Optional[str] = None) -> List[Dict[str, Any]]:
        rs = await self.session.execute(
            text(f"""
                SELECT e.id, e.nombre, e.campus_id, e.codigo, e.activo, c.nombre AS campus_nombre
                FROM public.edificio e
                JOIN public.campus c ON c.id = e.campus_id
                {"WHERE e.campus_id = :campus_id" if campus_id else ""}
                ORDER BY e.nombre
            """),
            dict(campus_id=campus_id),
        )
        return [row_to_building(r) for r in rs.mappings()]

    async def get_building(self, building_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                SELECT e.id, e.nombre, e.campus_id, e.codigo, e.activo, c.nombre AS campus_nombre
                FROM public.edificio e
                JOIN public.campus c ON c.id = e.campus_id
                WHERE e.id = :id
            """),
            dict(id=building_id),
        )
        row = rs.mappings().first()
        if not row:
            raise ValueError("Building not found")
        return row_to_building(row)

    async def create_building(self, name: str, campus_id: str, code: Optional[str] = None) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                WITH ins AS (
                  INSERT INTO public.edificio (id, campus_id, nombre, activo, codigo)
                  VALUES (gen_random_uuid(), :campus_id, :name, true, :code)
                  RETURNING id, campus_id, nombre, activo, codigo
                )
                SELECT i.id, i.nombre, i.campus_id, i.codigo, i.activo, c.nombre AS campus_nombre
                FROM ins i JOIN campus c ON c.id = i.campus_id
            """),
            dict(name=name, campus_id=campus_id, code=code),
        )
        row = rs.mappings().one()
        await self.session.commit()
        return row_to_building(row)

    async def update_building(
        self, building_id: str, name: Optional[str], campus_id: Optional[str],
        code: Optional[str], active: Optional[bool] = None
    ) -> Dict[str, Any]:
        if active is not None:
            # activar/desactivar edificio y sus salas
            await self.session.execute(text("""
                UPDATE public.edificio SET activo = :active WHERE id=:id
            """), {"id": building_id, "active": active})
            await self.session.execute(text("""
                UPDATE public.recurso SET activo = :active WHERE edificio_id=:id
            """), {"id": building_id, "active": active})

        rs = await self.session.execute(text("""
            WITH upd AS (
            UPDATE public.edificio
            SET nombre = COALESCE(:name, nombre),
                campus_id = COALESCE(:campus_id, campus_id),
                codigo = COALESCE(:code, codigo)
            WHERE id = :id
            RETURNING id, campus_id, nombre, codigo, activo
            )
            SELECT u.id, u.nombre, u.campus_id, u.codigo, u.activo, c.nombre AS campus_nombre
            FROM upd u JOIN campus c ON c.id = u.campus_id
        """), dict(id=building_id, name=name, campus_id=campus_id, code=code))
        row = rs.mappings().first()
        await self.session.commit()
        if not row:
            raise ValueError("Building not found")
        return row_to_building(row)
    
    async def delete_building(self, building_id: str) -> None:
        has_cupos = (await self.session.execute(text("""
            SELECT EXISTS(
              SELECT 1
              FROM public.cupo cu
              JOIN public.recurso r ON r.id = cu.recurso_id
              WHERE r.edificio_id = :id
            )
        """), {"id": building_id})).scalar()
        if has_cupos:
            await self.session.rollback()
            raise IntegrityError("cupos-existentes", params=None, orig=None)

        await self.session.execute(text("DELETE FROM public.recurso WHERE edificio_id=:id"), {"id": building_id})
        rs = await self.session.execute(text("DELETE FROM public.edificio WHERE id=:id"), {"id": building_id})
        if rs.rowcount == 0:
            await self.session.rollback()
            raise ValueError("not-found")
        await self.session.commit()

    #  activar/desactivar edificio 
    async def set_building_active(self, building_id: str, active: bool) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                UPDATE public.edificio
                SET activo = :active
                WHERE id = :id
                RETURNING id, campus_id, nombre, codigo, activo
            """),
            {"id": building_id, "active": active},
        )
        base = rs.mappings().first()
        if not base:
            await self.session.commit()
            raise ValueError("Building not found")

        await self.session.execute(
            text("""
                UPDATE public.recurso
                SET activo = :active
                WHERE edificio_id = :id
            """),
            {"id": building_id, "active": active},
        )
        rs2 = await self.session.execute(
            text("""
                SELECT e.id, e.nombre, e.campus_id, e.codigo, e.activo, c.nombre AS campus_nombre
                FROM public.edificio e JOIN campus c ON c.id = e.campus_id
                WHERE e.id=:id
            """),
            dict(id=building_id),
        )
        row = rs2.mappings().one()
        await self.session.commit()
        return row_to_building(row)

    async def reactivate_building(self, building_id: str) -> Dict[str, Any]:
        return await self.set_building_active(building_id, True)

    #  Rooms 
    async def list_rooms(self, building_id: Optional[str] = None) -> List[Dict[str, Any]]:
        rs = await self.session.execute(
            text(f"""
                SELECT r.id, r.nombre, r.tipo, r.sala_numero, r.capacidad, r.activo,
                       r.edificio_id, e.nombre AS edificio_nombre
                FROM public.recurso r
                JOIN public.edificio e ON e.id = r.edificio_id
                {"WHERE r.edificio_id = :building_id" if building_id else ""}
                ORDER BY r.nombre
            """),
            dict(building_id=building_id),
        )
        return [row_to_room(r) for r in rs.mappings()]

    async def get_room(self, room_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                SELECT r.id, r.nombre, r.tipo, r.sala_numero, r.capacidad, r.activo,
                       r.edificio_id, e.nombre AS edificio_nombre
                FROM public.recurso r
                JOIN public.edificio e ON e.id = r.edificio_id
                WHERE r.id = :id
            """),
            dict(id=room_id),
        )
        row = rs.mappings().first()
        if not row:
            raise ValueError("Room not found")
        return row_to_room(row)

    async def create_room(self, name: str, building_id: str, number: str, rtype: str, capacity: int) -> Dict[str, Any]:
        await ensure_room_type_constraints(self.session)
        rs = await self.session.execute(
            text("""
                WITH ins AS (
                  INSERT INTO public.recurso (id, tipo, nombre, activo, edificio_id, sala_numero, capacidad)
                  VALUES (gen_random_uuid(), :rtype, :name, true, :building_id, :number, :capacity)
                  RETURNING id, tipo, nombre, activo, edificio_id, sala_numero, capacidad
                )
                SELECT i.id, i.tipo, i.nombre, i.activo, i.edificio_id, i.sala_numero, i.capacidad,
                       e.nombre AS edificio_nombre
                FROM ins i JOIN edificio e ON e.id = i.edificio_id
            """),
            dict(name=name, building_id=building_id, number=number, rtype=frontend_to_db_type(rtype), capacity=capacity),
        )
        row = rs.mappings().one()
        await self.session.commit()
        return row_to_room(row)

    async def update_room(
        self, room_id: str, name: Optional[str], building_id: Optional[str],
        number: Optional[str], rtype: Optional[str], capacity: Optional[int],
        active: Optional[bool] = None
    ) -> Dict[str, Any]:
        await ensure_room_type_constraints(self.session)
        if active is not None:
            await self.session.execute(text("""
              UPDATE public.recurso SET activo=:active WHERE id=:id
            """), {"id": room_id, "active": active})

        rs = await self.session.execute(text("""
            WITH upd AS (
              UPDATE public.recurso
              SET nombre = COALESCE(:name, nombre),
                  edificio_id = COALESCE(:building_id, edificio_id),
                  sala_numero = COALESCE(:number, sala_numero),
                  tipo = COALESCE(:rtype, tipo),
                  capacidad = COALESCE(:capacity, capacidad)
              WHERE id = :id
              RETURNING id, tipo, nombre, activo, edificio_id, sala_numero, capacidad
            )
            SELECT u.id, u.tipo, u.nombre, u.activo, u.edificio_id, u.sala_numero, u.capacidad,
                   e.nombre AS edificio_nombre
            FROM upd u JOIN edificio e ON e.id = u.edificio_id
        """), dict(
            id=room_id, name=name, building_id=building_id, number=number,
            rtype=(frontend_to_db_type(rtype) if rtype else None), capacity=capacity
        ))
        row = rs.mappings().first()
        await self.session.commit()
        if not row:
            raise ValueError("Room not found")
        return row_to_room(row)


    async def delete_room(self, room_id: str) -> None:
        has_cupos = (await self.session.execute(text("""
            SELECT EXISTS(
              SELECT 1 FROM public.cupo WHERE recurso_id = :id
            )
        """), {"id": room_id})).scalar()
        if has_cupos:
            await self.session.rollback()
            raise IntegrityError("cupos-existentes", params=None, orig=None)

        rs = await self.session.execute(text("DELETE FROM public.recurso WHERE id=:id"), {"id": room_id})
        if rs.rowcount == 0:
            await self.session.rollback()
            raise ValueError("not-found")
        await self.session.commit()

    #  activar/desactivar sala 
    async def set_room_active(self, room_id: str, active: bool) -> Dict[str, Any]:
        rs = await self.session.execute(
            text("""
                WITH upd AS (
                  UPDATE public.recurso
                  SET activo = :active
                  WHERE id = :id
                  RETURNING id, tipo, nombre, activo, edificio_id, sala_numero, capacidad
                )
                SELECT u.id, u.tipo, u.nombre, u.activo, u.edificio_id, u.sala_numero, u.capacidad,
                       e.nombre AS edificio_nombre
                FROM upd u
                JOIN public.edificio e ON e.id = u.edificio_id
            """),
            {"id": room_id, "active": active},
        )
        row = rs.mappings().first()
        await self.session.commit()
        if not row:
            raise ValueError("Room not found")
        return row_to_room(row)

    async def reactivate_room(self, room_id: str) -> Dict[str, Any]:
        return await self.set_room_active(room_id, True)

    #  Paginado + Stats 
    async def list_campus_page(self, *, page: int = 1, limit: int = 20, q: Optional[str] = None, active: Optional[bool] = None) -> Dict[str, Any]:
        where = []
        params = {}
        if q:
            where.append("(lower(nombre) LIKE :q OR lower(codigo) LIKE :q)")
            params["q"] = f"%{q.lower()}%"
        if active is not None:
            where.append("activo = :active")
            params["active"] = active
        where_sql = " WHERE " + " AND ".join(where) if where else ""
        # total
        rs = await self.session.execute(text(f"SELECT count(*) AS n FROM campus{where_sql}"), params)
        total = int(rs.scalar() or 0)
        # page
        rs = await self.session.execute(
            text(f"""
                SELECT id, nombre, direccion, codigo, activo
                FROM campus
                {where_sql}
                ORDER BY nombre
                OFFSET :off LIMIT :lim
            """),
            dict(**params, off=(page - 1) * limit, lim=limit),
        )
        items = [row_to_campus(r) for r in rs.mappings()]
        # stats 
        rs2 = await self.session.execute(
            text(f"""
                SELECT
                  count(*)::int AS total,
                  sum(CASE WHEN activo THEN 1 ELSE 0 END)::int AS activos,
                  sum(CASE WHEN NOT activo THEN 1 ELSE 0 END)::int AS inactivos
                FROM campus
                {where_sql}
            """),
            params,
        )
        stats = rs2.mappings().one()
        return _page_dict(items, page, limit, total, stats)

    async def list_buildings_page(self, *, campus_id: Optional[str] = None, page: int = 1, limit: int = 20, q: Optional[str] = None, active: Optional[bool] = None) -> Dict[str, Any]:
        where = ["e.campus_id = :campus_id"] if campus_id else []
        params = {"campus_id": campus_id} if campus_id else {}
        if q:
            where.append("(lower(e.nombre) LIKE :q OR lower(e.codigo) LIKE :q OR lower(c.nombre) LIKE :q)")
            params["q"] = f"%{q.lower()}%"
        if active is not None:
            where.append("e.activo = :active")
            params["active"] = active
        where_sql = " WHERE " + " AND ".join(where) if where else ""
        # total
        rs = await self.session.execute(
            text(f"""
                SELECT count(*) AS n
                FROM edificio e JOIN campus c ON c.id = e.campus_id
                {where_sql}
            """),
            params,
        )
        total = int(rs.scalar() or 0)
        # page
        rs = await self.session.execute(
            text(f"""
                SELECT e.id, e.nombre, e.campus_id, e.codigo, e.activo, c.nombre AS campus_nombre
                FROM edificio e JOIN campus c ON c.id = e.campus_id
                {where_sql}
                ORDER BY e.nombre
                OFFSET :off LIMIT :lim
            """),
            dict(**params, off=(page - 1) * limit, lim=limit),
        )
        items = [row_to_building(r) for r in rs.mappings()]
        # stats
        rs2 = await self.session.execute(
            text(f"""
                SELECT
                  count(*)::int AS total,
                  sum(CASE WHEN e.activo THEN 1 ELSE 0 END)::int AS activos,
                  sum(CASE WHEN NOT e.activo THEN 1 ELSE 0 END)::int AS inactivos
                FROM edificio e JOIN campus c ON c.id = e.campus_id
                {where_sql}
            """),
            params,
        )
        stats = rs2.mappings().one()
        return _page_dict(items, page, limit, total, stats)

    async def list_rooms_page(self, *, building_id: Optional[str] = None, page: int = 1, limit: int = 20, q: Optional[str] = None, active: Optional[bool] = None) -> Dict[str, Any]:
        where = []
        params = {}
        if building_id:
            where.append("r.edificio_id = :building_id")
            params["building_id"] = building_id
        if q:
            where.append("(lower(r.nombre) LIKE :q OR lower(r.sala_numero) LIKE :q OR lower(r.tipo) LIKE :q OR lower(e.nombre) LIKE :q)")
            params["q"] = f"%{q.lower()}%"
        if active is not None:
            where.append("r.activo = :active")
            params["active"] = active
        where_sql = " WHERE " + " AND ".join(where) if where else ""
        # total
        rs = await self.session.execute(
            text(f"""
                SELECT count(*) AS n
                FROM recurso r JOIN edificio e ON e.id = r.edificio_id
                {where_sql}
            """),
            params,
        )
        total = int(rs.scalar() or 0)
        # page
        rs = await self.session.execute(
            text(f"""
                SELECT r.id, r.nombre, r.tipo, r.sala_numero, r.capacidad, r.activo,
                       r.edificio_id, e.nombre AS edificio_nombre
                FROM recurso r JOIN edificio e ON e.id = r.edificio_id
                {where_sql}
                ORDER BY r.nombre
                OFFSET :off LIMIT :lim
            """),
            dict(**params, off=(page - 1) * limit, lim=limit),
        )
        items = [row_to_room(r) for r in rs.mappings()]
        # stats
        rs2 = await self.session.execute(
            text(f"""
                SELECT
                  count(*)::int AS total,
                  sum(CASE WHEN r.activo THEN 1 ELSE 0 END)::int AS activos,
                  sum(CASE WHEN NOT r.activo THEN 1 ELSE 0 END)::int AS inactivos,
                  coalesce(sum(CASE WHEN r.activo THEN r.capacidad ELSE 0 END),0)::int AS capacity_sum_active
                FROM recurso r JOIN edificio e ON e.id = r.edificio_id
                {where_sql}
            """),
            params,
        )
        stats = rs2.mappings().one()
        return _page_dict(items, page, limit, total, stats)
