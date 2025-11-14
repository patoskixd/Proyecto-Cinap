from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class SqlAlchemySlotReader:


    def __init__(self, session: AsyncSession):
        self._db = session

    async def get_slot_context(self, cupo_id: str) -> Dict[str, Any]:
        # 1) Consultar la vista optimizada para este caso de uso
        row = await self._fetch_from_view(cupo_id)
        if not row:
            raise RuntimeError("No se encontró contexto para el cupo en pending_confirmations_v")

        # 2) Construir el texto de ubicación legible
        location_text = self._compose_location(
            campus=row.get("campus_nombre"),
            edificio=row.get("edificio_nombre"),
            recurso_alias=row.get("recurso_alias"),
            sala=row.get("sala_numero"),
        )

        # 3) Armar el payload esperado
        return {
            "asesor_usuario_id": str(row["asesor_usuario_id"]),
            "asesor_nombre": row.get("asesor_nombre") or "",
            "servicio_nombre": row.get("servicio_nombre") or "",
            "docente_nombre": row.get("docente_nombre") or "",
            "docente_email": row.get("docente_email") or "",
            "inicio": row["inicio"],  
            "fin": row["fin"],       
            "location_text": location_text,
        }

    async def _fetch_from_view(self, cupo_id: str) -> Optional[dict]:

        sql = text(
            """
            SELECT
              ap.usuario_id as asesor_usuario_id,
              au.nombre as asesor_nombre,
              pcv.servicio_nombre,
              pcv.docente_nombre,
              pcv.docente_email,
              pcv.inicio,
              pcv.fin,
              pcv.campus_nombre,
              pcv.edificio_nombre,
              pcv.recurso_alias,
              pcv.sala_numero
            FROM pending_confirmations_v pcv
            JOIN asesor_perfil ap ON ap.id = pcv.asesor_id
            JOIN usuario au ON au.id = ap.usuario_id
            WHERE pcv.cupo_id = :cupo_id
            LIMIT 1
            """
        )
        res = await self._db.execute(sql, {"cupo_id": uuid.UUID(cupo_id)})
        row = res.mappings().first()
        return dict(row) if row else None

    @staticmethod
    def _compose_location(
        *,
        campus: Optional[str],
        edificio: Optional[str],
        recurso_alias: Optional[str],
        sala: Optional[str],
    ) -> Optional[str]:
        """
        Convierte los componentes de ubicación en una cadena legible:
        "Campus / Edificio / RecursoAlias NºSala"
        """
        parts = []
        if campus:
            parts.append(campus)
        if edificio:
            parts.append(edificio)

        room = " ".join([x for x in [recurso_alias, sala] if x])
        if room:
            parts.append(room)

        return " / ".join(parts) if parts else None

