# app/interface_adapters/gateways/db/sqlalchemy_teacher_confirmations_repo.py

from __future__ import annotations
import uuid
from typing import Sequence
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.teacher_confirmations_repo import PendingConfirmation, TeacherConfirmationsRepo
from app.interface_adapters.orm.models_scheduling import EstadoCupo

# Puedes dejar esta lista tal cual (aunque el enum no tenga SOLICITADA), ya no romperá.
PENDING_ASESORIA_STATES = ("PENDIENTE", "SOLICITADA", "PENDIENTE_DOCENTE")

class SqlAlchemyTeacherConfirmationsRepo(TeacherConfirmationsRepo):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_pending_for_usuario(self, usuario_id: uuid.UUID) -> Sequence[PendingConfirmation]:
        sql = sa.text("""
            SELECT
                a.id                         AS asesoria_id,
                s.nombre                     AS servicio,
                cat.nombre                   AS categoria,
                c.inicio                     AS inicio,
                c.fin                        AS fin,
                a.creado_en                  AS solicitado_en,
                COALESCE(ca.nombre, '')      AS campus,
                COALESCE(e.nombre, '')       AS edificio,
                COALESCE(r.sala_numero, '')  AS sala
            FROM asesoria a
            JOIN cupo c            ON c.id = a.cupo_id
            JOIN servicio s        ON s.id = c.servicio_id
            JOIN categoria cat     ON cat.id = s.categoria_id
            JOIN docente_perfil dp ON dp.id = a.docente_id
            JOIN recurso r         ON r.id = c.recurso_id
            LEFT JOIN edificio e   ON e.id = r.edificio_id
            LEFT JOIN campus ca    ON ca.id = e.campus_id
            WHERE dp.usuario_id = :usuario_id
              AND a.estado::text = ANY(:pending_states)          -- <<<<<< clave
              AND c.estado = CAST(:estado_reservado AS estado_cupo)
            ORDER BY a.creado_en DESC
        """)

        params = {
            "usuario_id": usuario_id,
            "pending_states": list(PENDING_ASESORIA_STATES),     # asyncpg lo manda como text[]
            "estado_reservado": EstadoCupo.RESERVADO.value,
        }

        rows = (await self.session.execute(sql, params)).mappings().all()

        def _ubi(r):
            parts = [p for p in [
                (r["campus"] or None),
                (r["edificio"] or None),
                (f"Sala {r['sala']}" if r["sala"] else None)
            ] if p]
            return " · ".join(parts) if parts else None

        return [
            PendingConfirmation(
                id=r["asesoria_id"],
                categoria=r["categoria"] or "",
                servicio=r["servicio"] or "",
                inicio=r["inicio"],
                fin=r["fin"],
                solicitado_en=r["solicitado_en"],
                ubicacion=_ubi(r),
                solicitante=None,
            )
            for r in rows
        ]
