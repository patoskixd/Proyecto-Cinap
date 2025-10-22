from __future__ import annotations
from typing import Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.use_cases.ports.docente_repos import DocentePerfilRepo
from app.domain.auth.docente_perfil import DocentePerfil
from app.domain.auth.user import User, Role
from app.interface_adapters.orm.models_docente import DocentePerfilModel
from app.interface_adapters.orm.models_auth import UsuarioModel

class SqlAlchemyDocentePerfilRepo(DocentePerfilRepo):
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _to_domain(model: DocentePerfilModel) -> DocentePerfil:
        usuario = None
        if model.usuario:
            role = Role(
                id=str(model.usuario.rol.id) if model.usuario.rol else "",
                name=model.usuario.rol.nombre if model.usuario.rol else "Profesor"
            )
            usuario = User(
                id=str(model.usuario.id),
                email=model.usuario.email,
                name=model.usuario.nombre,
                role=role
            )
        
        return DocentePerfil(
            id=str(model.id),
            usuario_id=str(model.usuario_id),
            activo=model.activo,
            usuario=usuario
        )

    async def find_by_usuario_id(self, usuario_id: str) -> Optional[DocentePerfil]:
        try:
            uid = uuid.UUID(usuario_id)
        except ValueError:
            return None

        query = (
            select(DocentePerfilModel)
            .where(DocentePerfilModel.usuario_id == uid)
            .options(selectinload(DocentePerfilModel.usuario).selectinload(UsuarioModel.rol))
        )
        result = await self.session.execute(query)
        model = result.scalar_one_or_none()
        
        return self._to_domain(model) if model else None

    async def create_perfil(self, usuario_id: str) -> DocentePerfil:
        uid = uuid.UUID(usuario_id)
        
        # Crear el nuevo perfil docente
        docente_perfil = DocentePerfilModel(
            id=uuid.uuid4(),
            usuario_id=uid,
            activo=True
        )
        
        self.session.add(docente_perfil)
        await self.session.flush()
        
        # Recargar con las relaciones
        query = (
            select(DocentePerfilModel)
            .where(DocentePerfilModel.id == docente_perfil.id)
            .options(selectinload(DocentePerfilModel.usuario).selectinload(UsuarioModel.rol))
        )
        result = await self.session.execute(query)
        model = result.scalar_one()
        
        return self._to_domain(model)

    async def ensure_perfil_exists(self, usuario_id: str) -> DocentePerfil:
        """
        Asegura que existe un perfil de docente para el usuario.
        Si no existe, lo crea. Si existe, lo devuelve.
        """
        existing = await self.find_by_usuario_id(usuario_id)
        if existing:
            return existing
        
        return await self.create_perfil(usuario_id)