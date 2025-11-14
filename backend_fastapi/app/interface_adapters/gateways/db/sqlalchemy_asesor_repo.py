from __future__ import annotations
from typing import Optional, List
import uuid
import sqlalchemy as sa
from sqlalchemy import select, delete, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.use_cases.ports.asesor_repos import AsesorPerfilRepo
from app.use_cases.ports.auth_repos import UserRepo
from app.domain.auth.asesor_perfil import AsesorPerfil, RegisterAdvisorRequest, AdvisorInfo, AdvisorPage, ServiceInfo
from app.domain.auth.user import User, Role
from app.interface_adapters.orm.models_asesor import (
    AsesorPerfilModel,
    AsesorServicioModel,
    ServicioModel,
)
from app.interface_adapters.orm.models_auth import UsuarioModel, RolModel
from app.interface_adapters.orm.models_docente import DocentePerfilModel
from app.interface_adapters.orm.models_scheduling import (
    CupoModel,
    EstadoCupo,
    AsesoriaModel,
    EstadoAsesoria,
)

class SqlAlchemyAsesorRepo(AsesorPerfilRepo):
    def __init__(self, session: AsyncSession, user_repo: UserRepo, asesor_role_id: uuid.UUID):
        self.session = session
        self.user_repo = user_repo
        self.asesor_role_id = asesor_role_id

    @staticmethod
    def _to_domain(model: AsesorPerfilModel) -> AsesorPerfil:
        usuario = None
        if model.usuario:
            role = Role(
                id=str(model.usuario.rol.id) if model.usuario.rol else "",
                name=model.usuario.rol.nombre if model.usuario.rol else "Asesor"
            )
            usuario = User(
                id=str(model.usuario.id),
                email=model.usuario.email,
                name=model.usuario.nombre,
                role=role
            )
        
        return AsesorPerfil(
            id=str(model.id),
            usuario_id=str(model.usuario_id),
            activo=model.activo,
            usuario=usuario
        )

    async def find_by_usuario_id(self, usuario_id: str) -> Optional[AsesorPerfil]:
        try:
            uid = uuid.UUID(usuario_id)
        except ValueError:
            return None

        query = (
            select(AsesorPerfilModel)
            .where(AsesorPerfilModel.usuario_id == uid)
            .options(selectinload(AsesorPerfilModel.usuario).selectinload(UsuarioModel.rol))
        )
        result = await self.session.execute(query)
        model = result.scalar_one_or_none()
        
        return self._to_domain(model) if model else None

    async def create_perfil(self, usuario_id: str) -> AsesorPerfil:
        uid = uuid.UUID(usuario_id)
        
        # Crear el nuevo perfil asesor
        asesor_perfil = AsesorPerfilModel(
            id=uuid.uuid4(),
            usuario_id=uid,
            activo=True
        )
        
        self.session.add(asesor_perfil)
        await self.session.flush()
        
        # Recargar con las relaciones
        query = (
            select(AsesorPerfilModel)
            .where(AsesorPerfilModel.id == asesor_perfil.id)
            .options(selectinload(AsesorPerfilModel.usuario).selectinload(UsuarioModel.rol))
        )
        result = await self.session.execute(query)
        model = result.scalar_one()
        
        return self._to_domain(model)

    async def ensure_perfil_exists(self, usuario_id: str) -> AsesorPerfil:
        """
        Asegura que existe un perfil de asesor para el usuario.
        Si no existe, lo crea. Si existe, lo devuelve.
        """
        existing = await self.find_by_usuario_id(usuario_id)
        if existing:
            return existing
        
        return await self.create_perfil(usuario_id)

    async def list_advisors(self) -> List[AdvisorInfo]:
        page = await self.list_advisors_page(page=1, limit=1_000_000)
        return page.items

    async def list_advisors_page(
        self,
        *,
        page: int,
        limit: int,
        query: str | None = None,
        category_id: str | None = None,
        service_id: str | None = None,
    ) -> AdvisorPage:
        page = max(page, 1)
        limit = max(min(limit, 200), 1)
        offset = (page - 1) * limit

        filters = []
        joined_user = False
        joined_services = False

        def ensure_user(stmt):
            nonlocal joined_user
            if not joined_user:
                stmt = stmt.join(UsuarioModel, UsuarioModel.id == AsesorPerfilModel.usuario_id, isouter=True)
                joined_user = True
            return stmt

        def ensure_services(stmt):
            nonlocal joined_services
            if not joined_services:
                stmt = stmt.join(AsesorServicioModel, AsesorServicioModel.asesor_id == AsesorPerfilModel.id, isouter=True)
                stmt = stmt.join(ServicioModel, ServicioModel.id == AsesorServicioModel.servicio_id, isouter=True)
                joined_services = True
            return stmt

        if query:
            pattern = f"%{query.strip().lower()}%"
            filters.append(
                sa.or_(
                    sa.func.lower(UsuarioModel.nombre).like(pattern),
                    sa.func.lower(UsuarioModel.email).like(pattern),
                )
            )

        if category_id:
            try:
                filters.append(ServicioModel.categoria_id == uuid.UUID(category_id))
            except ValueError:
                filters.append(sa.text("1=0"))

        if service_id:
            try:
                filters.append(ServicioModel.id == uuid.UUID(service_id))
            except ValueError:
                filters.append(sa.text("1=0"))

        count_stmt = select(sa.func.count(sa.distinct(AsesorPerfilModel.id))).select_from(AsesorPerfilModel)
        if query:
            count_stmt = ensure_user(count_stmt)
        if category_id or service_id:
            count_stmt = ensure_services(count_stmt)
        if filters:
            count_stmt = count_stmt.where(sa.and_(*filters))

        total = (await self.session.execute(count_stmt)).scalar_one()

        items_stmt = ensure_user(select(AsesorPerfilModel))
        if category_id or service_id:
            items_stmt = ensure_services(items_stmt)

        items_stmt = (
            items_stmt.options(
                selectinload(AsesorPerfilModel.usuario).selectinload(UsuarioModel.rol),
                selectinload(AsesorPerfilModel.servicios)
                .selectinload(AsesorServicioModel.servicio)
                .selectinload(ServicioModel.categoria),
            )
            .order_by(AsesorPerfilModel.id, sa.func.lower(UsuarioModel.nombre))
            .offset(offset)
            .limit(limit)
        )
        if filters:
            items_stmt = items_stmt.where(sa.and_(*filters))

        items_stmt = items_stmt.distinct(AsesorPerfilModel.id)

        result = await self.session.execute(items_stmt)
        models = result.scalars().all()

        advisors: List[AdvisorInfo] = []
        for model in models:
            services_with_categories: List[ServiceInfo] = []
            categories = set()

            if hasattr(model, "servicios") and model.servicios:
                for asesor_servicio in model.servicios:
                    servicio = asesor_servicio.servicio
                    if servicio:
                        services_with_categories.append(
                            ServiceInfo(
                                id=str(servicio.id),
                                name=servicio.nombre,
                                category_id=str(servicio.categoria_id),
                                category_name=servicio.categoria.nombre if servicio.categoria else "",
                            )
                        )
                        categories.add(str(servicio.categoria_id))

            advisors.append(
                AdvisorInfo(
                    id=str(model.id),
                    usuario_id=str(model.usuario_id),
                    name=model.usuario.nombre if model.usuario else "",
                    email=model.usuario.email if model.usuario else "",
                    activo=model.activo,
                    services=services_with_categories,
                    categories=list(categories) if categories else None,
                )
            )

        pages = max((total + limit - 1) // limit, 1) if total else 1
        return AdvisorPage(
            items=advisors,
            page=page,
            per_page=limit,
            total=total,
            pages=pages,
        )

    async def register_advisor(self, request: RegisterAdvisorRequest) -> AdvisorInfo:
        """
        Registra un nuevo asesor en el sistema.
        1. Crea el usuario con rol "Asesor"
        2. Crea el perfil de asesor
        3. Asigna los servicios
        """
        # 1. Crear usuario usando el UserRepo
        user = await self.user_repo.upsert_user_with_identity(
            email=request.email,
            name=request.name,
            sub=f"admin_created_{uuid.uuid4().hex[:8]}",  
            refresh_token=None
        )
        
        # 2. Actualizar el rol del usuario a "Asesor" si no es ya
        await self.ensure_user_is_asesor(user.id)
        
        # 3. Eliminar el perfil de docente si existía para evitar duplicados
        try:
            usuario_uuid = uuid.UUID(user.id)
        except ValueError:
            usuario_uuid = None

        if usuario_uuid:
            docente_stmt = select(DocentePerfilModel.id).where(DocentePerfilModel.usuario_id == usuario_uuid)
            docente_result = await self.session.execute(docente_stmt)
            docente_id = docente_result.scalar_one_or_none()
            if docente_id:
                asesorias_count_stmt = select(func.count(AsesoriaModel.id)).where(AsesoriaModel.docente_id == docente_id)
                asesorias_count = (await self.session.execute(asesorias_count_stmt)).scalar_one()
                if asesorias_count:
                    raise ValueError(
                        "El usuario tiene asesorías registradas como docente y no puede convertirse en asesor."
                    )
                await self.session.execute(delete(DocentePerfilModel).where(DocentePerfilModel.id == docente_id))
                await self.session.flush()

        # 4. Crear perfil de asesor
        asesor_perfil = await self.create_perfil(user.id)
        
        # 5. Asignar servicios
        await self._assign_services_to_advisor(str(asesor_perfil.id), request.service_ids)
        
        # 6. Recargar con información completa y retornar
        return await self.get_advisor_by_id(str(asesor_perfil.id))

    async def get_advisor_by_id(self, advisor_id: str) -> Optional[AdvisorInfo]:
        """Obtiene un asesor específico por su ID"""
        try:
            aid = uuid.UUID(advisor_id)
        except ValueError:
            return None

        query = (
            select(AsesorPerfilModel)
            .where(AsesorPerfilModel.id == aid)
            .options(
                selectinload(AsesorPerfilModel.usuario).selectinload(UsuarioModel.rol),
                selectinload(AsesorPerfilModel.servicios).selectinload(AsesorServicioModel.servicio).selectinload(ServicioModel.categoria)
            )
        )
        result = await self.session.execute(query)
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        # Obtener servicios con sus categorías
        services_with_categories = []
        categories = set()
        
        if hasattr(model, 'servicios') and model.servicios:
            from app.domain.auth.asesor_perfil import ServiceInfo
            for asesor_servicio in model.servicios:
                servicio = asesor_servicio.servicio
                if servicio:
                    service_info = ServiceInfo(
                        id=str(servicio.id),
                        name=servicio.nombre,
                        category_id=str(servicio.categoria_id),
                        category_name=servicio.categoria.nombre if hasattr(servicio, 'categoria') and servicio.categoria else ""
                    )
                    services_with_categories.append(service_info)
                    categories.add(str(servicio.categoria_id))
        
        return AdvisorInfo(
            id=str(model.id),
            usuario_id=str(model.usuario_id),
            name=model.usuario.nombre if model.usuario else "",
            email=model.usuario.email if model.usuario else "",
            activo=model.activo,
            services=services_with_categories,
            categories=list(categories)
        )

    async def update_advisor_services(self, advisor_id: str, service_ids: List[str]) -> AdvisorInfo:
        """Actualiza los servicios asignados a un asesor"""
        try:
            aid = uuid.UUID(advisor_id)
        except ValueError:
            raise ValueError("Invalid advisor ID format")
        
        # Eliminar servicios existentes
        await self.session.execute(
            delete(AsesorServicioModel).where(AsesorServicioModel.asesor_id == aid)
        )
        
        # Asignar nuevos servicios
        await self._assign_services_to_advisor(advisor_id, service_ids)
        
        # Retornar información actualizada
        updated_advisor = await self.get_advisor_by_id(advisor_id)
        if not updated_advisor:
            raise ValueError("Advisor not found after update")
        
        return updated_advisor

    async def update_advisor(self, advisor_id: str, name: str = None, email: str = None, service_ids: List[str] = None, active: bool = None) -> AdvisorInfo:
        """Actualiza la información de un asesor"""
        try:
            aid = uuid.UUID(advisor_id)
        except ValueError:
            raise ValueError("Invalid advisor ID format")

        # Obtener el asesor
        query = select(AsesorPerfilModel).options(
            selectinload(AsesorPerfilModel.usuario),
            selectinload(AsesorPerfilModel.servicios).selectinload(AsesorServicioModel.servicio).selectinload(ServicioModel.categoria)
        ).where(AsesorPerfilModel.id == aid)
        
        result = await self.session.execute(query)
        asesor_model = result.scalar_one_or_none()
        
        if not asesor_model:
            raise ValueError("Advisor not found")

        # Actualizar información básica si se proporciona
        updated = False
        if name is not None:
            asesor_model.usuario.nombre = name
            updated = True
        if email is not None:
            asesor_model.usuario.email = email
            updated = True
        if active is not None:
            asesor_model.activo = active
            updated = True

        # Actualizar servicios si se proporcionan
        if service_ids is not None:
            # Obtener servicios actuales del asesor
            current_services_query = select(AsesorServicioModel.servicio_id).where(
                AsesorServicioModel.asesor_id == aid
            )
            current_services_result = await self.session.execute(current_services_query)
            current_service_ids = {str(sid) for sid in current_services_result.scalars().all()}
            
            new_service_ids = set(service_ids)
            
            # Servicios a eliminar 
            services_to_remove = current_service_ids - new_service_ids
            if services_to_remove:
                for service_id in services_to_remove:
                    # Verificar si hay cupos que usen esta combinación asesor-servicio
                    cupos_count = await self.session.execute(
                        select(func.count(CupoModel.id)).where(
                            CupoModel.asesor_id == aid,
                            CupoModel.servicio_id == uuid.UUID(service_id)
                        )
                    )
                    count = cupos_count.scalar()
                    
                    # Solo eliminar si no hay cupos asociados
                    if count == 0:
                        await self.session.execute(
                            delete(AsesorServicioModel).where(
                                AsesorServicioModel.asesor_id == aid,
                                AsesorServicioModel.servicio_id == uuid.UUID(service_id)
                            )
                        )
            
            # Servicios a agregar
            services_to_add = new_service_ids - current_service_ids
            if services_to_add:
                for service_id in services_to_add:
                    # Verificar que el servicio existe
                    service_exists = await self.session.execute(
                        select(ServicioModel).where(ServicioModel.id == uuid.UUID(service_id))
                    )
                    if service_exists.scalar_one_or_none():
                        # Agregar nueva relación asesor-servicio
                        new_relation = AsesorServicioModel(
                            asesor_id=aid,
                            servicio_id=uuid.UUID(service_id)
                        )
                        self.session.add(new_relation)
            
            updated = True

        if updated:
            await self.session.flush()

        # Retornar información actualizada
        return await self.get_advisor_by_id(advisor_id)

    async def delete_advisor(self, advisor_id: str) -> None:
        """Elimina un asesor del sistema"""
        try:
            aid = uuid.UUID(advisor_id)
        except ValueError:
            raise ValueError("Identificador de asesor invalido")

        asesor_query = (
            select(AsesorPerfilModel)
            .where(AsesorPerfilModel.id == aid)
            .options(selectinload(AsesorPerfilModel.usuario))
        )
        asesor_result = await self.session.execute(asesor_query)
        asesor_model = asesor_result.scalar_one_or_none()

        if not asesor_model:
            raise LookupError("Asesor no encontrado")

        usuario_id = asesor_model.usuario_id

        # Verificar si existen cupos ocupados (reservados o realizados)
        occupied_cupos_stmt = (
            select(func.count(CupoModel.id))
            .where(
                CupoModel.asesor_id == aid,
                CupoModel.estado.in_([EstadoCupo.RESERVADO, EstadoCupo.REALIZADO]),
            )
        )
        occupied_cupos = (await self.session.execute(occupied_cupos_stmt)).scalar_one()
        if occupied_cupos:
            raise ValueError("No se puede eliminar el asesor porque tiene cupos ocupados")

        # Eliminar cupos abiertos o expirados que no tengan asesorías asociadas
        await self.session.execute(
            delete(CupoModel).where(
                CupoModel.asesor_id == aid,
                CupoModel.estado.in_([EstadoCupo.ABIERTO, EstadoCupo.EXPIRADO]),
                sa.not_(sa.exists().where(AsesoriaModel.cupo_id == CupoModel.id)),
            )
        )

        docente_stmt = select(DocentePerfilModel.id).where(DocentePerfilModel.usuario_id == usuario_id)
        docente_result = await self.session.execute(docente_stmt)
        docente_id = docente_result.scalar_one_or_none()

        has_any_asesorias = False
        if docente_id:
            pending_asesorias_stmt = (
                select(func.count(AsesoriaModel.id))
                .where(
                    AsesoriaModel.docente_id == docente_id,
                    AsesoriaModel.estado.in_([EstadoAsesoria.PENDIENTE, EstadoAsesoria.CONFIRMADA]),
                )
            )
            pending_asesorias = (await self.session.execute(pending_asesorias_stmt)).scalar_one()
            if pending_asesorias:
                raise ValueError(
                    "No se puede eliminar el asesor porque tiene asesorias pendientes o confirmadas"
                )

            total_asesorias_stmt = select(func.count(AsesoriaModel.id)).where(
                AsesoriaModel.docente_id == docente_id
            )
            has_any_asesorias = (await self.session.execute(total_asesorias_stmt)).scalar_one() > 0

        if has_any_asesorias:
            raise ValueError("No se puede eliminar el asesor porque tiene historial de asesorias")

        try:
            await self.session.execute(delete(AsesorPerfilModel).where(AsesorPerfilModel.id == aid))

            if docente_id and not has_any_asesorias:
                await self.session.execute(delete(DocentePerfilModel).where(DocentePerfilModel.id == docente_id))

            if not has_any_asesorias:
                await self.session.execute(delete(UsuarioModel).where(UsuarioModel.id == usuario_id))

            await self.session.flush()
        except IntegrityError as err:
            raise ValueError("No se puede eliminar el asesor porque tiene historial de asesorias") from err

    async def ensure_user_is_asesor(self, user_id: str) -> None:
        """Asegura que el usuario tenga rol de Asesor"""
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return
        
        # Actualizar el rol del usuario a Asesor
        query = select(UsuarioModel).where(UsuarioModel.id == uid)
        result = await self.session.execute(query)
        user_model = result.scalar_one_or_none()
        
        if user_model and user_model.rol_id != self.asesor_role_id:
            user_model.rol_id = self.asesor_role_id
            await self.session.flush()

    async def _assign_services_to_advisor(self, advisor_id: str, service_ids: List[str]) -> None:
        """Asigna servicios a un asesor"""
        aid = uuid.UUID(advisor_id)
        
        for service_id_str in service_ids:
            try:
                service_id = uuid.UUID(service_id_str)
                
                # Verificar que el servicio existe
                service_query = select(ServicioModel).where(ServicioModel.id == service_id)
                service_result = await self.session.execute(service_query)
                if not service_result.scalar_one_or_none():
                    continue  
                
                # Crear la asignación
                assignment = AsesorServicioModel(
                    id=uuid.uuid4(),
                    asesor_id=aid,
                    servicio_id=service_id
                )
                self.session.add(assignment)
                
            except ValueError:
                continue  
        
        await self.session.flush()
