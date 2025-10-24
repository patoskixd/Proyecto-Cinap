from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Callable, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from app.interface_adapters.gateways.db.sqlalchemy_admin_location_repo import SqlAlchemyAdminLocationRepo


def make_admin_location_router(
    get_session_dep: Callable[..., AsyncSession],
    jwt_port: Any = None,
):
    router = APIRouter(prefix="/api/admin/locations", tags=["admin-locations"])

    #  modelos de entrada 
    class CampusIn(BaseModel):
        name: str
        address: str
        code: Optional[str] = None

    class CampusPatch(BaseModel):
        name: Optional[str] = None
        address: Optional[str] = None
        code: Optional[str] = None
        active: Optional[bool] = None

    class BuildingIn(BaseModel):
        name: str
        campusId: str
        code: Optional[str] = None

    class BuildingPatch(BaseModel):
        name: Optional[str] = None
        campusId: Optional[str] = None
        code: Optional[str] = None
        active: Optional[bool] = None

    class RoomIn(BaseModel):
        name: str
        buildingId: str
        number: str
        type: str
        capacity: int

    class RoomPatch(BaseModel):
        name: Optional[str] = None
        buildingId: Optional[str] = None
        number: Optional[str] = None
        type: Optional[str] = None
        capacity: Optional[int] = None
        active: Optional[bool] = None

    #  helpers 
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

    def page_envelope(total: int, page: int, limit: int, items: list[dict]) -> dict:
        pages = max(1, (total + limit - 1) // limit)
        return {"items": items, "page": page, "per_page": limit, "total": total, "pages": pages}
    



    #  Campus  
    @router.get("/campus")
    async def list_campus(
        page: int = 1,
        limit: int = 20,
        q: Optional[str] = None,
        active: Optional[bool] = None,
        session: AsyncSession = Depends(get_session_dep),
    ):
        where, params = [], {}
        where_stats, params_stats = [], {}

        if q:
            params["q"] = f"%{q.lower()}%"
            where.append("(LOWER(nombre) ILIKE :q OR LOWER(direccion) ILIKE :q OR LOWER(COALESCE(codigo, '')) ILIKE :q)")
            params_stats["q"] = params["q"]
            where_stats.append("(LOWER(nombre) ILIKE :q OR LOWER(direccion) ILIKE :q OR LOWER(COALESCE(codigo, '')) ILIKE :q)")

        if active is not None:
            params["active"] = active
            where.append("activo = :active")
            # stats NO filtra por activo

        where_sql       = ("WHERE " + " AND ".join(where)) if where else ""
        where_sql_stats = ("WHERE " + " AND ".join(where_stats)) if where_stats else ""

        total = (await session.execute(text(f"SELECT COUNT(*) FROM public.campus {where_sql}"), params)).scalar_one()

        rows = (
            await session.execute(
                text(f"""
                    SELECT id, nombre, direccion, codigo, activo
                    FROM public.campus
                    {where_sql}
                    ORDER BY nombre
                    LIMIT :limit OFFSET :offset
                """),
                {**params, "limit": limit, "offset": (page - 1) * limit},
            )
        ).mappings().all()

        stats = (
            await session.execute(
                text(f"""
                    SELECT
                    COUNT(*)::int                                              AS total,
                    SUM(CASE WHEN activo THEN 1 ELSE 0 END)::int               AS activos,
                    SUM(CASE WHEN NOT activo THEN 1 ELSE 0 END)::int           AS inactivos
                    FROM public.campus
                    {where_sql_stats}
                """),
                params_stats,
            )
        ).mappings().one()

        env = page_envelope(int(total), page, limit, [row_to_campus(r) for r in rows])
        env["stats"] = stats
        return env


    #  Buildings
    @router.get("/buildings")
    async def list_buildings(
        campusId: Optional[str] = Query(default=None, alias="campusId"),
        page: int = 1,
        limit: int = 20,
        q: Optional[str] = None,
        active: Optional[bool] = None,
        session: AsyncSession = Depends(get_session_dep),
    ):
        where, params = [], {}
        where_stats, params_stats = [], {}

        if campusId:
            params["campus_id"] = campusId
            where.append("e.campus_id = :campus_id")
            params_stats["campus_id"] = campusId
            where_stats.append("e.campus_id = :campus_id")

        if q:
            params["q"] = f"%{q.lower()}%"
            where.append("(LOWER(e.nombre) ILIKE :q OR LOWER(COALESCE(e.codigo,'')) ILIKE :q OR LOWER(c.nombre) ILIKE :q)")
            params_stats["q"] = params["q"]
            where_stats.append("(LOWER(e.nombre) ILIKE :q OR LOWER(COALESCE(e.codigo,'')) ILIKE :q OR LOWER(c.nombre) ILIKE :q)")

        if active is not None:
            params["active"] = active
            where.append("e.activo = :active")

        where_sql       = ("WHERE " + " AND ".join(where)) if where else ""
        where_sql_stats = ("WHERE " + " AND ".join(where_stats)) if where_stats else ""

        total = (
            await session.execute(
                text(f"""
                    SELECT COUNT(*)
                    FROM public.edificio e
                    JOIN public.campus c ON c.id = e.campus_id
                    {where_sql}
                """),
                params,
            )
        ).scalar_one()

        rows = (
            await session.execute(
                text(f"""
                    SELECT e.id, e.nombre, e.campus_id, e.codigo, e.activo, c.nombre AS campus_nombre
                    FROM public.edificio e
                    JOIN public.campus c ON c.id = e.campus_id
                    {where_sql}
                    ORDER BY e.nombre
                    LIMIT :limit OFFSET :offset
                """),
                {**params, "limit": limit, "offset": (page - 1) * limit},
            )
        ).mappings().all()

        stats = (
            await session.execute(
                text(f"""
                    SELECT
                    COUNT(*)::int                                        AS total,
                    SUM(CASE WHEN e.activo THEN 1 ELSE 0 END)::int       AS activos,
                    SUM(CASE WHEN NOT e.activo THEN 1 ELSE 0 END)::int   AS inactivos
                    FROM public.edificio e
                    JOIN public.campus c ON c.id = e.campus_id
                    {where_sql_stats}
                """),
                params_stats,
            )
        ).mappings().one()

        env = page_envelope(int(total), page, limit, [row_to_building(r) for r in rows])
        env["stats"] = stats
        return env


    #  Rooms
    @router.get("/rooms")
    async def list_rooms(
        buildingId: Optional[str] = Query(default=None, alias="buildingId"),
        page: int = 1,
        limit: int = 20,
        q: Optional[str] = None,
        active: Optional[bool] = None,
        session: AsyncSession = Depends(get_session_dep),
    ):
        where, params = [], {}
        where_stats, params_stats = [], {}

        if buildingId:
            params["building_id"] = buildingId
            where.append("r.edificio_id = :building_id")
            params_stats["building_id"] = buildingId
            where_stats.append("r.edificio_id = :building_id")

        if q:
            params["q"] = f"%{q.lower()}%"
            where.append(
                "(LOWER(r.nombre) ILIKE :q OR LOWER(COALESCE(r.sala_numero,'')) ILIKE :q OR "
                "LOWER(COALESCE(r.tipo,'')) ILIKE :q OR LOWER(e.nombre) ILIKE :q)"
            )
            params_stats["q"] = params["q"]
            where_stats.append(
                "(LOWER(r.nombre) ILIKE :q OR LOWER(COALESCE(r.sala_numero,'')) ILIKE :q OR "
                "LOWER(COALESCE(r.tipo,'')) ILIKE :q OR LOWER(e.nombre) ILIKE :q)"
            )

        if active is not None:
            params["active"] = active
            where.append("r.activo = :active")

        where_sql       = ("WHERE " + " AND ".join(where)) if where else ""
        where_sql_stats = ("WHERE " + " AND ".join(where_stats)) if where_stats else ""

        total = (
            await session.execute(
                text(f"""
                    SELECT COUNT(*)
                    FROM public.recurso r
                    JOIN public.edificio e ON e.id = r.edificio_id
                    {where_sql}
                """),
                params,
            )
        ).scalar_one()

        rows = (
            await session.execute(
                text(f"""
                    SELECT r.id, r.nombre, r.tipo, r.sala_numero, r.capacidad, r.activo,
                        r.edificio_id, e.nombre AS edificio_nombre
                    FROM public.recurso r
                    JOIN public.edificio e ON e.id = r.edificio_id
                    {where_sql}
                    ORDER BY r.nombre
                    LIMIT :limit OFFSET :offset
                """),
                {**params, "limit": limit, "offset": (page - 1) * limit},
            )
        ).mappings().all()

        stats = (
            await session.execute(
                text(f"""
                    SELECT
                    COUNT(*)::int                                                                AS total,
                    SUM(CASE WHEN r.activo THEN 1 ELSE 0 END)::int                               AS activos,
                    SUM(CASE WHEN NOT r.activo THEN 1 ELSE 0 END)::int                           AS inactivos,
                    COALESCE(SUM(CASE WHEN r.activo THEN r.capacidad ELSE 0 END), 0)::int       AS capacity_sum_active
                    FROM public.recurso r
                    JOIN public.edificio e ON e.id = r.edificio_id
                    {where_sql_stats}
                """),
                params_stats,
            )
        ).mappings().one()

        env = page_envelope(int(total), page, limit, [row_to_room(r) for r in rows])
        env["stats"] = stats
        return env

    #  CRUD Campus

    @router.post("/campus")
    async def create_campus(payload: CampusIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = payload.code.upper() if payload.code else None
            return await repo.create_campus(payload.name, payload.address, code)
        except IntegrityError:
            raise HTTPException(409, "Campus duplicado")

    @router.put("/campus/{campus_id}")
    async def update_campus(campus_id: str, patch: CampusPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = patch.code.upper() if patch.code else None
            return await repo.update_campus(campus_id, patch.name, patch.address, code, patch.active)
        except IntegrityError:
            # nombre/código duplicado
            raise HTTPException(status_code=409, detail="Campus duplicado")
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")

    @router.patch("/campus/{campus_id}")
    async def patch_campus(campus_id: str, patch: CampusPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = patch.code.upper() if patch.code else None
            return await repo.update_campus(campus_id, patch.name, patch.address, code, patch.active)
        except IntegrityError:
            raise HTTPException(status_code=409, detail="Campus duplicado")
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")

    @router.delete("/campus/{campus_id}")
    async def delete_campus(campus_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            await repo.delete_campus(campus_id)
            return {"ok": True}
        except IntegrityError:
            raise HTTPException(409, detail="No se puede eliminar el campus porque tiene dependencias (edificios/salas)")
        except ValueError:
            raise HTTPException(404, detail="Campus no encontrado")

    @router.post("/campus/{campus_id}/reactivate")
    async def reactivate_campus(campus_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.set_campus_active(campus_id, True)
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")


    #  CRUD Buildings

    @router.post("/buildings")
    async def create_building(payload: BuildingIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = payload.code.upper() if payload.code else None
            return await repo.create_building(payload.name, payload.campusId, code)
        except IntegrityError as e:
            raise HTTPException(409, "Edificio duplicado")
        except ValueError:
            raise HTTPException(409, "Edificio duplicado")

    @router.put("/buildings/{building_id}")
    async def update_building(building_id: str, patch: BuildingPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = patch.code.upper() if patch.code else None
            return await repo.update_building(building_id, patch.name, patch.campusId, code, patch.active)
        except IntegrityError as e:
            raise HTTPException(409, "Edificio duplicado")
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    @router.patch("/buildings/{building_id}")
    async def patch_building(building_id: str, patch: BuildingPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            code = patch.code.upper() if patch.code else None
            return await repo.update_building(building_id, patch.name, patch.campusId, code, patch.active)
        except IntegrityError as e:
            raise HTTPException(409, "Edificio duplicado")
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    @router.delete("/buildings/{building_id}")
    async def delete_building(building_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            await repo.delete_building(building_id)
            return {"ok": True}
        except IntegrityError:
            raise HTTPException(409, "No se puede eliminar el edificio porque tiene dependencias (cupos/salas)")
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    @router.post("/buildings/{building_id}/reactivate")
    async def reactivate_building(building_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.set_building_active(building_id, True)
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    #  CRUD Rooms
    @router.post("/rooms")
    async def create_room(payload: RoomIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.create_room(payload.name, payload.buildingId, payload.number, payload.type, payload.capacity)
        except IntegrityError:
            raise HTTPException(409, "Sala duplicada")

    @router.put("/rooms/{room_id}")
    async def update_room(room_id: str, patch: RoomPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.update_room(
                room_id, patch.name, patch.buildingId, patch.number, patch.type, patch.capacity, patch.active
            )
        except IntegrityError:
            raise HTTPException(409, "Sala duplicada")
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    @router.patch("/rooms/{room_id}")
    async def patch_room(room_id: str, patch: RoomPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.update_room(
                room_id, patch.name, patch.buildingId, patch.number, patch.type, patch.capacity, patch.active
            )
        except IntegrityError:
            raise HTTPException(409, "Sala duplicada")
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    @router.delete("/rooms/{room_id}")
    async def delete_room(room_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            await repo.delete_room(room_id)
            return {"ok": True}
        except IntegrityError:
            raise HTTPException(409, "No se puede eliminar la sala porque tiene dependencias (cupos)")
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    @router.post("/rooms/{room_id}/reactivate")
    async def reactivate_room(room_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.set_room_active(room_id, True)
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    return router
