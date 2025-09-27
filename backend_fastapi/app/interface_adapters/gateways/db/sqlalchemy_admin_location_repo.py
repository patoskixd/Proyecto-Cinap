from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

def row_to_campus(r) -> Dict[str, Any]:
    return dict(id=r.id, name=r.nombre, address=r.direccion, active=r.activo)

def row_to_building(r) -> Dict[str, Any]:
    return dict(id=r.id, name=r.nombre, campusId=r.campus_id, campusName=r.campus_nombre, active=r.activo)

def row_to_room(r) -> Dict[str, Any]:
    return dict(
        id=r.id, name=r.nombre, buildingId=r.edificio_id, buildingName=r.edificio_nombre,
        number=r.sala_numero, type=(r.tipo or "").lower(), capacity=r.capacidad, active=r.activo
    )

class SqlAlchemyAdminLocationRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ===== Campus
    async def list_campus(self) -> List[Dict[str, Any]]:
        rs = await self.session.execute(text("""
            SELECT id, nombre, direccion, activo
            FROM public.campus
            ORDER BY nombre
        """))
        return [row_to_campus(r) for r in rs.mappings()]

    async def create_campus(self, name: str, address: str) -> Dict[str, Any]:
        try:
            rs = await self.session.execute(text("""
                INSERT INTO public.campus (id, nombre, direccion, activo)
                VALUES (gen_random_uuid(), :name, :address, true)
                RETURNING id, nombre, direccion, activo
            """), dict(name=name, address=address))
            await self.session.commit()
            r = rs.mappings().one()
            return row_to_campus(r)
        except IntegrityError as e:
            await self.session.rollback()
            raise e

    async def update_campus(self, campus_id: str, name: Optional[str], address: Optional[str]) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            UPDATE public.campus
            SET nombre = COALESCE(:name, nombre),
                direccion = COALESCE(:address, direccion)
            WHERE id = :id
            RETURNING id, nombre, direccion, activo
        """), dict(id=campus_id, name=name, address=address))
        row = rs.mappings().first()
        await self.session.commit()
        if not row: raise ValueError("Campus not found")
        return row_to_campus(row)

    async def soft_delete_campus(self, campus_id: str) -> None:
        await self.session.execute(text("UPDATE public.campus SET activo=false WHERE id=:id"), dict(id=campus_id))
        await self.session.commit()

    async def reactivate_campus(self, campus_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            UPDATE public.campus SET activo=true WHERE id=:id
            RETURNING id, nombre, direccion, activo
        """), dict(id=campus_id))
        row = rs.mappings().first()
        await self.session.commit()
        if not row: raise ValueError("Campus not found")
        return row_to_campus(row)

    # ===== Buildings
    async def list_buildings(self, campus_id: Optional[str] = None) -> List[Dict[str, Any]]:
        rs = await self.session.execute(text(f"""
            SELECT e.id, e.nombre, e.campus_id, e.activo, c.nombre AS campus_nombre
            FROM public.edificio e
            JOIN public.campus c ON c.id = e.campus_id
            {"WHERE e.campus_id = :campus_id" if campus_id else ""}
            ORDER BY e.nombre
        """), dict(campus_id=campus_id))
        return [row_to_building(r) for r in rs.mappings()]

    async def create_building(self, name: str, campus_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            WITH ins AS (
              INSERT INTO public.edificio (id, campus_id, nombre, activo)
              VALUES (gen_random_uuid(), :campus_id, :name, true)
              RETURNING id, campus_id, nombre, activo
            )
            SELECT i.id, i.nombre, i.campus_id, i.activo, c.nombre AS campus_nombre
            FROM ins i JOIN campus c ON c.id = i.campus_id
        """), dict(name=name, campus_id=campus_id))
        row = rs.mappings().one()
        await self.session.commit()
        return row_to_building(row)

    async def update_building(self, building_id: str, name: Optional[str], campus_id: Optional[str]) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            WITH upd AS (
              UPDATE public.edificio
              SET nombre = COALESCE(:name, nombre),
                  campus_id = COALESCE(:campus_id, campus_id)
              WHERE id = :id
              RETURNING id, campus_id, nombre, activo
            )
            SELECT u.id, u.nombre, u.campus_id, u.activo, c.nombre AS campus_nombre
            FROM upd u JOIN campus c ON c.id = u.campus_id
        """), dict(id=building_id, name=name, campus_id=campus_id))
        row = rs.mappings().first()
        await self.session.commit()
        if not row: raise ValueError("Building not found")
        return row_to_building(row)

    async def soft_delete_building(self, building_id: str) -> None:
        await self.session.execute(text("UPDATE public.edificio SET activo=false WHERE id=:id"), dict(id=building_id))
        await self.session.commit()

    async def reactivate_building(self, building_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            UPDATE public.edificio SET activo=true WHERE id=:id
            RETURNING id, campus_id, nombre, activo
        """), dict(id=building_id))
        base = rs.mappings().first()
        if not base:
            await self.session.commit()
            raise ValueError("Building not found")
        rs2 = await self.session.execute(text("""
            SELECT e.id, e.nombre, e.campus_id, e.activo, c.nombre AS campus_nombre
            FROM public.edificio e JOIN campus c ON c.id = e.campus_id
            WHERE e.id=:id
        """), dict(id=building_id))
        row = rs2.mappings().one()
        await self.session.commit()
        return row_to_building(row)

    # ===== Rooms
    async def list_rooms(self, building_id: Optional[str] = None) -> List[Dict[str, Any]]:
        rs = await self.session.execute(text(f"""
            SELECT r.id, r.nombre, r.tipo, r.sala_numero, r.capacidad, r.activo,
                   r.edificio_id, e.nombre AS edificio_nombre
            FROM public.recurso r
            JOIN public.edificio e ON e.id = r.edificio_id
            {"WHERE r.edificio_id = :building_id" if building_id else ""}
            ORDER BY r.nombre
        """), dict(building_id=building_id))
        return [row_to_room(r) for r in rs.mappings()]

    async def create_room(self, name: str, building_id: str, number: str, rtype: str, capacity: int) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            WITH ins AS (
              INSERT INTO public.recurso (id, tipo, nombre, activo, edificio_id, sala_numero, capacidad)
              VALUES (gen_random_uuid(), :rtype, :name, true, :building_id, :number, :capacity)
              RETURNING id, tipo, nombre, activo, edificio_id, sala_numero, capacidad
            )
            SELECT i.id, i.tipo, i.nombre, i.activo, i.edificio_id, i.sala_numero, i.capacidad,
                   e.nombre AS edificio_nombre
            FROM ins i JOIN edificio e ON e.id = i.edificio_id
        """), dict(name=name, building_id=building_id, number=number, rtype=rtype.upper(), capacity=capacity))
        row = rs.mappings().one()
        await self.session.commit()
        return row_to_room(row)

    async def update_room(self, room_id: str, name: Optional[str], building_id: Optional[str],
                          number: Optional[str], rtype: Optional[str], capacity: Optional[int]) -> Dict[str, Any]:
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
        """), dict(id=room_id, name=name, building_id=building_id, number=number,
                   rtype=(rtype.upper() if rtype else None), capacity=capacity))
        row = rs.mappings().first()
        await self.session.commit()
        if not row: raise ValueError("Room not found")
        return row_to_room(row)

    async def soft_delete_room(self, room_id: str) -> None:
        await self.session.execute(text("UPDATE public.recurso SET activo=false WHERE id=:id"), dict(id=room_id))
        await self.session.commit()

    async def reactivate_room(self, room_id: str) -> Dict[str, Any]:
        rs = await self.session.execute(text("""
            UPDATE public.recurso SET activo=true WHERE id=:id
            RETURNING id, tipo, nombre, activo, edificio_id, sala_numero, capacidad
        """), dict(id=room_id))
        base = rs.mappings().first()
        if not base:
            await self.session.commit()
            raise ValueError("Room not found")
        rs2 = await self.session.execute(text("""
            SELECT r.id, r.tipo, r.nombre, r.activo, r.edificio_id, r.sala_numero, r.capacidad,
                   e.nombre AS edificio_nombre
            FROM public.recurso r JOIN edificio e ON e.id = r.edificio_id
            WHERE r.id=:id
        """), dict(id=room_id))
        row = rs2.mappings().one()
        await self.session.commit()
        return row_to_room(row)
