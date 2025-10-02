from __future__ import annotations
import uuid
from typing import Optional
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.interface_adapters.orm.models_scheduling import CategoriaModel, ServicioModel

class SqlAlchemyAdminCatalogRepo:
    def __init__(self, session: AsyncSession):
        self.s = session

    async def _cat_row_to_out(self, c: CategoriaModel) -> dict:
        # carga servicios de la categoría
        q = select(ServicioModel).where(ServicioModel.categoria_id == c.id).order_by(ServicioModel.nombre.asc())
        svcs = (await self.s.execute(q)).scalars().all()
        return {
            "id": str(c.id),
            "name": c.nombre,
            "description": c.descripcion or "",
            "status": "active" if c.activo else "inactive",
            "services": [
                {
                    "id": str(s.id),
                    "name": s.nombre,
                    "duration": int(s.duracion_minutos),
                    "status": "active" if s.activo else "inactive",
                } for s in svcs
            ],
        }

    async def list_categories(self) -> list[dict]:
        rows = (await self.s.execute(select(CategoriaModel).order_by(CategoriaModel.nombre.asc()))).scalars().all()
        out: list[dict] = []
        for c in rows:
            out.append(await self._cat_row_to_out(c))
        return out

    async def create_category(self, name: str, description: str) -> dict:
        c = CategoriaModel(nombre=name.strip(), descripcion=(description or "").strip() or None)
        self.s.add(c)
        await self.s.flush()
        return await self._cat_row_to_out(c)

    async def update_category(self, cat_id: str, patch: dict) -> dict:
        q = select(CategoriaModel).where(CategoriaModel.id == uuid.UUID(cat_id))
        c = (await self.s.execute(q)).scalar_one_or_none()
        if not c:
            raise ValueError("Categoría no encontrada")
        if "name" in patch and patch["name"] is not None:
            c.nombre = patch["name"].strip()
        if "description" in patch:
            v = (patch["description"] or "").strip()
            c.descripcion = v or None
        await self.s.flush()
        return await self._cat_row_to_out(c)

    async def delete_category(self, cat_id: str) -> None:
        q = select(CategoriaModel).where(CategoriaModel.id == uuid.UUID(cat_id))
        c = (await self.s.execute(q)).scalar_one_or_none()
        if not c:
            raise ValueError("Categoría no encontrada")
        # opcional: validar que no tenga servicios activos/reservas
        await self.s.delete(c)
        await self.s.flush()

    async def set_category_status(self, cat_id: str, active: bool) -> dict:
        q = select(CategoriaModel).where(CategoriaModel.id == uuid.UUID(cat_id))
        c = (await self.s.execute(q)).scalar_one_or_none()
        if not c:
            raise ValueError("Categoría no encontrada")
        c.activo = bool(active)
        await self.s.flush()
        return await self._cat_row_to_out(c)
