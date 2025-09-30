from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Callable, Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.interface_adapters.gateways.db.sqlalchemy_admin_location_repo import SqlAlchemyAdminLocationRepo

def make_admin_location_router(
    get_session_dep: Callable[..., AsyncSession],
    jwt_port: Any = None,  
):
    router = APIRouter(prefix="/admin/locations", tags=["admin-locations"])

    class CampusIn(BaseModel): name: str; address: str
    class CampusPatch(BaseModel): name: Optional[str] = None; address: Optional[str] = None; active: Optional[bool] = None

    class BuildingIn(BaseModel): name: str; campusId: str
    class BuildingPatch(BaseModel): name: Optional[str] = None; campusId: Optional[str] = None; active: Optional[bool] = None

    class RoomIn(BaseModel):
        name: str; buildingId: str; number: str; type: str; capacity: int
    class RoomPatch(BaseModel):
        name: Optional[str] = None; buildingId: Optional[str] = None
        number: Optional[str] = None; type: Optional[str] = None; capacity: Optional[int] = None; active: Optional[bool] = None

    #  Campus
    @router.get("/campus")
    async def list_campus(session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        return await repo.list_campus()

    @router.post("/campus")
    async def create_campus(payload: CampusIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.create_campus(payload.name, payload.address)
        except IntegrityError:
            raise HTTPException(409, "Campus duplicado")

    @router.put("/campus/{campus_id}")
    async def update_campus(campus_id: str, patch: CampusPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.update_campus(campus_id, patch.name, patch.address)
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")

    @router.patch("/campus/{campus_id}")
    async def patch_campus(campus_id: str, patch: CampusPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        # Si el patch incluye active=False, hacer soft delete y devolver el objeto actualizado
        if patch.active is False:
            await repo.soft_delete_campus(campus_id)
            # Después de desactivar, obtener y devolver el objeto actualizado
            try:
                return await repo.get_campus(campus_id)
            except ValueError:
                raise HTTPException(404, "Campus no encontrado")
        # Si no, actualizar normalmente
        try:
            return await repo.update_campus(campus_id, patch.name, patch.address)
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")

    @router.delete("/campus/{campus_id}")
    async def delete_campus(campus_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        await repo.soft_delete_campus(campus_id)
        return {"ok": True}

    @router.post("/campus/{campus_id}/reactivate")
    async def reactivate_campus(campus_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.reactivate_campus(campus_id)
        except ValueError:
            raise HTTPException(404, "Campus no encontrado")

    #  Buildings
    @router.get("/buildings")
    async def list_buildings(
        campusId: Optional[str] = Query(default=None, alias="campusId"),
        session: AsyncSession = Depends(get_session_dep)
    ):
        repo = SqlAlchemyAdminLocationRepo(session)
        return await repo.list_buildings(campusId)

    @router.post("/buildings")
    async def create_building(payload: BuildingIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        return await repo.create_building(payload.name, payload.campusId)

    @router.put("/buildings/{building_id}")
    async def update_building(building_id: str, patch: BuildingPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.update_building(building_id, patch.name, patch.campusId)
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    @router.patch("/buildings/{building_id}")
    async def patch_building(building_id: str, patch: BuildingPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        # Si el patch incluye active=False, hacer soft delete y devolver el objeto actualizado
        if patch.active is False:
            await repo.soft_delete_building(building_id)
            # Después de desactivar, obtener y devolver el objeto actualizado
            try:
                return await repo.get_building(building_id)
            except ValueError:
                raise HTTPException(404, "Edificio no encontrado")
        # Si no, actualizar normalmente
        try:
            return await repo.update_building(building_id, patch.name, patch.campusId)
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    @router.delete("/buildings/{building_id}")
    async def delete_building(building_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        await repo.soft_delete_building(building_id)
        return {"ok": True}

    @router.post("/buildings/{building_id}/reactivate")
    async def reactivate_building(building_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.reactivate_building(building_id)
        except ValueError:
            raise HTTPException(404, "Edificio no encontrado")

    #  Rooms
    @router.get("/rooms")
    async def list_rooms(
        buildingId: Optional[str] = Query(default=None, alias="buildingId"),
        session: AsyncSession = Depends(get_session_dep)
    ):
        repo = SqlAlchemyAdminLocationRepo(session)
        return await repo.list_rooms(buildingId)

    @router.post("/rooms")
    async def create_room(payload: RoomIn, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        return await repo.create_room(payload.name, payload.buildingId, payload.number, payload.type, payload.capacity)

    @router.put("/rooms/{room_id}")
    async def update_room(room_id: str, patch: RoomPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.update_room(room_id, patch.name, patch.buildingId, patch.number, patch.type, patch.capacity)
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    @router.patch("/rooms/{room_id}")
    async def patch_room(room_id: str, patch: RoomPatch, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        # Si el patch incluye active=False, hacer soft delete y devolver el objeto actualizado
        if patch.active is False:
            await repo.soft_delete_room(room_id)
            # Después de desactivar, obtener y devolver el objeto actualizado
            try:
                return await repo.get_room(room_id)
            except ValueError:
                raise HTTPException(404, "Sala no encontrada")
        # Si no, actualizar normalmente
        try:
            return await repo.update_room(room_id, patch.name, patch.buildingId, patch.number, patch.type, patch.capacity)
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    @router.delete("/rooms/{room_id}")
    async def delete_room(room_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        await repo.soft_delete_room(room_id)
        return {"ok": True}

    @router.post("/rooms/{room_id}/reactivate")
    async def reactivate_room(room_id: str, session: AsyncSession = Depends(get_session_dep)):
        repo = SqlAlchemyAdminLocationRepo(session)
        try:
            return await repo.reactivate_room(room_id)
        except ValueError:
            raise HTTPException(404, "Sala no encontrada")

    return router
