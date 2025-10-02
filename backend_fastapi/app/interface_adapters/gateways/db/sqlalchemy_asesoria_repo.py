from __future__ import annotations
import uuid
from sqlalchemy import select, update, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.use_cases.ports.asesoria_port import AsesoriaRepo, CreateAsesoriaIn, CreateAsesoriaOut
from app.interface_adapters.orm.models_scheduling import CupoModel
from app.interface_adapters.orm.models_auth import UsuarioModel, RolModel
from app.interface_adapters.orm.models_scheduling import EstadoCupo
from sqlalchemy.orm import aliased

class SqlAlchemyAsesoriaRepo(AsesoriaRepo):
    def __init__(self, session: AsyncSession):
        self._db = session

    async def _get_docente_id_by_usuario(self, usuario_id: str) -> uuid.UUID | None:
        result = await self._db.execute(
            text("SELECT id FROM docente_perfil WHERE usuario_id = :u AND activo = true LIMIT 1"),
            {"u": uuid.UUID(usuario_id)},
        )
        row = result.mappings().first()
        return row["id"] if row else None

    async def _is_valid_docente(self, usuario_id: str) -> bool:
        try:
            uid = uuid.UUID(usuario_id)
        except Exception:
            return False
        q = (
            select(RolModel.nombre)
            .join(UsuarioModel, UsuarioModel.rol_id == RolModel.id)
            .where(UsuarioModel.id == uid)
        )
        role = (await self._db.execute(q)).scalar_one_or_none()
        return role is not None  
    async def create_and_reserve(self, input: CreateAsesoriaIn) -> CreateAsesoriaOut:
        if not await self._is_valid_docente(input.docente_usuario_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario no autorizado")

        docente_id = await self._get_docente_id_by_usuario(input.docente_usuario_id)
        if not docente_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil docente no encontrado")

        q_cupo = (
            select(CupoModel).where(CupoModel.id == uuid.UUID(input.cupo_id)).with_for_update()
        )
        cupo = (await self._db.execute(q_cupo)).scalars().first()
        if not cupo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cupo no existe")
        if cupo.estado != EstadoCupo.ABIERTO:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cupo no disponible")

        ins = text(
            """
            INSERT INTO asesoria (docente_id, cupo_id, estado, origen, notas)
            VALUES (:docente_id, :cupo_id, 'PENDIENTE', :origen, :notas)
            RETURNING id, creado_en
            """
        )
        ins_row = (
            await self._db.execute(
                ins,
                {
                    "docente_id": docente_id,
                    "cupo_id": uuid.UUID(input.cupo_id),
                    "origen": input.origen,
                    "notas": input.notas,
                },
            )
        ).mappings().first()

        await self._db.execute(
            update(CupoModel).where(CupoModel.id == uuid.UUID(input.cupo_id)).values(estado="RESERVADO")
        )
        await self._db.commit()
        row = None
        try:
            view_sql = text("SELECT * FROM pending_confirmations_v WHERE cupo_id = :cupo_id LIMIT 1")
            row = (await self._db.execute(view_sql, {"cupo_id": uuid.UUID(input.cupo_id)})).mappings().first()
        except Exception:
            row = None

        if not row:
            return CreateAsesoriaOut(
                asesoria_id=str(ins_row["id"]) if ins_row and "id" in ins_row else "",
                cupo_id=str(cupo.id),
                estado="PENDIENTE",
                creado_en=(ins_row["creado_en"].isoformat() if ins_row and ins_row.get("creado_en") else ""),
                servicio_nombre="",
                categoria_nombre="",
                docente_nombre="",
                docente_email="",
                inicio=cupo.inicio.isoformat(),
                fin=cupo.fin.isoformat(),
                edificio_nombre=None,
                campus_nombre=None,
                sala_numero=None,
                recurso_alias=None,
            )

        return CreateAsesoriaOut(
            asesoria_id=str(row["asesoria_id"]),
            cupo_id=str(row["cupo_id"]),
            estado="PENDIENTE",
            creado_en=row["creado_en"].isoformat(),
            servicio_nombre=row.get("servicio_nombre", ""),
            categoria_nombre=row.get("categoria_nombre", ""),
            docente_nombre=row.get("docente_nombre", ""),
            docente_email=row.get("docente_email", ""),
            inicio=row["inicio"].isoformat(),
            fin=row["fin"].isoformat(),
            edificio_nombre=row.get("edificio_nombre"),
            campus_nombre=row.get("campus_nombre"),
            sala_numero=row.get("sala_numero"),
            recurso_alias=row.get("recurso_alias"),
        )
