from __future__ import annotations
import uuid
from typing import Optional, List
import sqlalchemy as sa
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.use_cases.ports.docente_repos import DocentePerfilRepo
from app.use_cases.ports.auth_repos import UserRepo
from app.domain.auth.docente_perfil import DocentePerfil, TeacherInfo, TeacherPage
from app.interface_adapters.orm.models_docente import DocentePerfilModel
from app.interface_adapters.orm.models_auth import UsuarioModel

class SqlAlchemyDocenteRepo(DocentePerfilRepo):
    def __init__(self, session: AsyncSession, user_repo: UserRepo, docente_role_id: uuid.UUID):
        self.session = session
        self.user_repo = user_repo
        self.docente_role_id = docente_role_id

    @staticmethod
    def _to_domain(model: DocentePerfilModel) -> DocentePerfil:
        return DocentePerfil(
            id=str(model.id),
            usuario_id=str(model.usuario_id),
            activo=model.activo,
        )

    async def find_by_usuario_id(self, usuario_id: str) -> Optional[DocentePerfil]:
        try:
            uid = uuid.UUID(usuario_id)
        except ValueError:
            return None
        q = select(DocentePerfilModel).where(DocentePerfilModel.usuario_id == uid)
        res = await self.session.execute(q)
        m = res.scalar_one_or_none()
        return self._to_domain(m) if m else None

    async def create_perfil(self, usuario_id: str) -> DocentePerfil:
        uid = uuid.UUID(usuario_id)
        m = DocentePerfilModel(id=uuid.uuid4(), usuario_id=uid, activo=True)
        self.session.add(m)
        await self.session.flush()
        return await self.get_teacher_by_id(str(m.id))

    async def ensure_perfil_exists(self, usuario_id: str) -> DocentePerfil:
        ex = await self.find_by_usuario_id(usuario_id)
        return ex or await self.create_perfil(usuario_id)

    async def ensure_user_is_docente(self, user_id: str) -> None:
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return
        q = select(UsuarioModel).where(UsuarioModel.id == uid)
        res = await self.session.execute(q)
        user_m = res.scalar_one_or_none()
        if user_m and user_m.rol_id != self.docente_role_id:
            user_m.rol_id = self.docente_role_id
            await self.session.flush()

    async def list_teachers(self) -> List[TeacherInfo]:
        page = await self.list_teachers_page(page=1, limit=1_000_000, query=None)
        return page.items

    async def list_teachers_page(self, *, page: int, limit: int, query: str | None = None) -> TeacherPage:
        page = max(page, 1)
        limit = max(min(limit, 200), 1)
        offset = (page - 1) * limit

        filters = []
        if query:
            pattern = f"%{query.strip().lower()}%"
            filters.append(
                sa.or_(
                    sa.func.lower(UsuarioModel.nombre).like(pattern),
                    sa.func.lower(UsuarioModel.email).like(pattern),
                )
            )

        count_stmt = (
            select(sa.func.count())
            .select_from(DocentePerfilModel)
            .join(UsuarioModel, UsuarioModel.id == DocentePerfilModel.usuario_id, isouter=True)
        )
        if filters:
            count_stmt = count_stmt.where(sa.and_(*filters))

        total = (await self.session.execute(count_stmt)).scalar_one()

        items_stmt = (
            select(DocentePerfilModel)
            .join(UsuarioModel, UsuarioModel.id == DocentePerfilModel.usuario_id, isouter=True)
            .options(selectinload(DocentePerfilModel.usuario))
            .order_by(sa.func.lower(UsuarioModel.nombre))
            .offset(offset)
            .limit(limit)
        )
        if filters:
            items_stmt = items_stmt.where(sa.and_(*filters))

        res = await self.session.execute(items_stmt)
        items = res.scalars().unique().all()

        data: List[TeacherInfo] = [
            TeacherInfo(
                id=str(m.id),
                usuario_id=str(m.usuario_id),
                name=m.usuario.nombre if m.usuario else "",
                email=m.usuario.email if m.usuario else "",
                activo=m.activo,
            )
            for m in items
        ]

        pages = max((total + limit - 1) // limit, 1) if total else 1
        return TeacherPage(
            items=data,
            page=page,
            per_page=limit,
            total=total,
            pages=pages,
        )

    async def register_teacher(self, *, name: str, email: str) -> TeacherInfo:
        user = await self.user_repo.upsert_user_with_identity(
            email=email,
            name=name,
            sub=f"admin_created_{uuid.uuid4().hex[:8]}",
            refresh_token=None
        )
        await self.ensure_user_is_docente(user.id)
        perfil = await self.create_perfil(user.id)
        return await self.get_teacher_by_id(perfil.id)

    async def get_teacher_by_id(self, teacher_id: str) -> Optional[TeacherInfo]:
        try:
            tid = uuid.UUID(teacher_id)
        except ValueError:
            return None
        q = select(DocentePerfilModel).where(DocentePerfilModel.id == tid).options(selectinload(DocentePerfilModel.usuario))
        res = await self.session.execute(q)
        m = res.scalar_one_or_none()
        if not m:
            return None
        return TeacherInfo(
            id=str(m.id),
            usuario_id=str(m.usuario_id),
            name=m.usuario.nombre if m.usuario else "",
            email=m.usuario.email if m.usuario else "",
            activo=m.activo
        )

    async def update_teacher(self, teacher_id: str, *, name: str | None, email: str | None, active: bool | None) -> TeacherInfo:
        try:
            tid = uuid.UUID(teacher_id)
        except ValueError:
            raise ValueError("Invalid teacher ID format")

        q = select(DocentePerfilModel).where(DocentePerfilModel.id == tid).options(selectinload(DocentePerfilModel.usuario))
        res = await self.session.execute(q)
        m = res.scalar_one_or_none()
        if not m:
            raise ValueError("Teacher not found")

        changed = False
        if name is not None and m.usuario:
            m.usuario.nombre = name
            changed = True
        if email is not None and m.usuario:
            m.usuario.email = email
            changed = True
        if active is not None:
            m.activo = active
            changed = True

        if changed:
            await self.session.flush()

        t = await self.get_teacher_by_id(teacher_id)
        if not t:
            raise ValueError("Teacher not found after update")
        return t

    async def delete_teacher(self, teacher_id: str) -> None:
        try:
            tid = uuid.UUID(teacher_id)
        except ValueError:
            raise ValueError("Invalid teacher ID format")

        uid_q = select(DocentePerfilModel.usuario_id).where(DocentePerfilModel.id == tid)
        res = await self.session.execute(uid_q)
        usuario_id = res.scalar_one_or_none()
        if not usuario_id:
            raise ValueError("Docente no encontrado")

        await self.session.execute(delete(DocentePerfilModel).where(DocentePerfilModel.id == tid))
        await self.session.execute(delete(UsuarioModel).where(UsuarioModel.id == usuario_id))
        await self.session.flush()
