from __future__ import annotations
import uuid
from typing import Sequence
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.teacher_confirmations_repo import PendingConfirmation, TeacherConfirmationsRepo
from app.interface_adapters.orm.models_scheduling import EstadoCupo

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
              AND a.estado IN :pending_states
              AND c.estado = CAST(:estado_reservado AS estado_cupo)
            ORDER BY a.creado_en DESC
        """).bindparams(sa.bindparam("pending_states", expanding=True))

        params = {
            "usuario_id": usuario_id,
            "pending_states": list(PENDING_ASESORIA_STATES),
            "estado_reservado": EstadoCupo.RESERVADO.value,
        }

        rows = (await self.session.execute(sql, params)).mappings().all()

        def _ubi(row):
            parts = [p for p in [
                row["campus"] or None,
                row["edificio"] or None,
                f"Sala {row['sala']}" if row["sala"] else None
            ] if p]
            return " · ".join(parts) if parts else None

        return [
            PendingConfirmation(
                id=row["asesoria_id"],
                categoria=row["categoria"] or "",
                servicio=row["servicio"] or "",
                inicio=row["inicio"],
                fin=row["fin"],
                solicitado_en=row["solicitado_en"],
                ubicacion=_ubi(row),
                solicitante=None,
            )
            for row in rows
        ]
