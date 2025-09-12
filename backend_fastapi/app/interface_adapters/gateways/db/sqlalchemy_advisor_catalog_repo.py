from __future__ import annotations
import uuid
from typing import Optional, List, Dict, Any
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.interface_adapters.orm.models_scheduling import (
    CategoriaModel,
    ServicioModel,
    AsesorPerfilModel,
    AsesorServicioModel,
)

class SqlAlchemyAdvisorCatalogRepo:
    def __init__(self, s: AsyncSession):
        self.s = s

    async def resolve_asesor_id(self, usuario_id: str) -> Optional[str]:
        q = sa.select(AsesorPerfilModel.id).where(
            AsesorPerfilModel.usuario_id == uuid.UUID(usuario_id)
        )
        x = (await self.s.execute(q)).scalar_one_or_none()
        return str(x) if x else None

    async def _fetch_categories(self) -> list:
        return (
            await self.s.execute(
                sa.select(
                    CategoriaModel.id,
                    CategoriaModel.nombre,
                    CategoriaModel.descripcion,
                )
                .where(CategoriaModel.activo == True)
                .order_by(CategoriaModel.nombre.asc())
            )
        ).all()

    async def _fetch_services(self) -> list:
        return (
            await self.s.execute(
                sa.select(
                    ServicioModel.id,
                    ServicioModel.categoria_id,
                    ServicioModel.nombre,
                    ServicioModel.duracion_minutos,
                )
                .where(ServicioModel.activo == True)
                .order_by(ServicioModel.nombre.asc())
            )
        ).all()

    async def _fetch_my_services_set(self, asesor_id: str) -> set[str]:
        mine = (
            await self.s.execute(
                sa.select(AsesorServicioModel.servicio_id).where(
                    AsesorServicioModel.asesor_id == uuid.UUID(asesor_id)
                )
            )
        ).scalars().all()
        return {str(x) for x in mine}

    def _vm_service(self, s, selected: bool) -> dict:
        return {
            "id": str(s.id),
            "name": s.nombre,
            "description": None,
            "duration": int(s.duracion_minutos),
            "selected": bool(selected),
        }

    async def get_advisor_catalog(self, asesor_id: str) -> dict[str, Any]:
        cats = await self._fetch_categories()
        svcs = await self._fetch_services()
        mine_set = await self._fetch_my_services_set(asesor_id)

        by_cat: dict[str, list] = {}
        for s in svcs:
            by_cat.setdefault(str(s.categoria_id), []).append(s)

        active: list[dict] = []
        available: list[dict] = []
        active_categories_count = 0
        active_services_count = 0

        for c in cats:
            c_id = str(c.id)
            services_in_cat = by_cat.get(c_id, [])
            vm_services = []
            selected_any = False

            for s in services_in_cat:
                selected = str(s.id) in mine_set
                vm = self._vm_service(s, selected)
                vm_services.append(vm)
                if selected:
                    selected_any = True
                    active_services_count += 1

            cat_vm = {
                "id": c_id,
                "name": c.nombre,
                "description": c.descripcion or "",
                "icon": "🎓",
                "services": vm_services,
            }

            item = {
                "category": cat_vm,
                "services": vm_services,
                "status": "active" if selected_any else "available",
            }

            if selected_any:
                active.append(item)
                active_categories_count += 1
            else:
                available.append(item)

        return {
            "active": active,
            "available": available,
            "stats": {
                "activeCategories": active_categories_count,
                "activeServices": active_services_count,
            },
        }

    async def join_category(self, asesor_id: str, category_id: str) -> None:

        svcs = (
            await self.s.execute(
                sa.select(ServicioModel.id).where(
                    ServicioModel.categoria_id == uuid.UUID(category_id),
                    ServicioModel.activo == True,
                )
            )
        ).scalars().all()
        if not svcs:
            return

        for svc_id in svcs:
            try:
                self.s.add(
                    AsesorServicioModel(
                        asesor_id=uuid.UUID(asesor_id),
                        servicio_id=uuid.UUID(str(svc_id)),
                    )
                )
                await self.s.flush()
            except IntegrityError:
                await self.s.rollback()

    async def leave_category(self, asesor_id: str, category_id: str) -> None:
        svc_rows = (
            await self.s.execute(
                sa.select(AsesorServicioModel)
                .join(ServicioModel, ServicioModel.id == AsesorServicioModel.servicio_id)
                .where(
                    AsesorServicioModel.asesor_id == uuid.UUID(asesor_id),
                    ServicioModel.categoria_id == uuid.UUID(category_id),
                )
            )
        ).scalars().all()

        for row in svc_rows:
            await self.s.delete(row)
        await self.s.flush()
