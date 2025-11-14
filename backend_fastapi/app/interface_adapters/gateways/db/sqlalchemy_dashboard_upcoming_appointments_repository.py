from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class SqlAlchemyDashboardUpcomingAppointmentsRepository:
    """
    Obtiene próximas asesorías (máx 4) según rol:

      - Admin  : sin filtro de perfil; trae docente y asesor.
      - Asesor : filtra por cupo.asesor_id = profile_id; devuelve nombre del docente.
      - Profesor: filtra por asesoria.docente_id = profile_id; devuelve nombre del asesor.

    Reglas:
      - Sólo asesorías FUTURAS: c.inicio >= now()
      - Estado de asesoria en ('PENDIENTE','CONFIRMADA')
      - cupo.estado = 'RESERVADO'  (ya asociado a asesoria)
      - Orden ascendente por c.inicio
      - Límite 4
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session



    async def fetch_next(self, role: str, profile_id: Optional[UUID], limit: int = 4) -> List[Dict[str, Any]]:
        base_sql = """
        SELECT
            a.id                               AS asesoria_id,
            s.nombre                           AS servicio,
            a.estado                           AS estado_asesoria,
            c.inicio                           AS inicio,
            c.fin                              AS fin,

            -- Docente
            du.nombre                          AS docente_nombre,

            -- Asesor
            au.nombre                          AS asesor_nombre,

            -- Ubicación
            cp.nombre                          AS campus_nombre,
            e.nombre                           AS edificio_nombre,
            r.nombre                           AS sala_alias,
            r.sala_numero                      AS sala_numero
        FROM public.asesoria a
        JOIN public.cupo c           ON c.id = a.cupo_id
        JOIN public.servicio s       ON s.id = c.servicio_id

        JOIN public.docente_perfil dp ON dp.id = a.docente_id
        JOIN public.usuario du         ON du.id = dp.usuario_id

        JOIN public.asesor_perfil ap   ON ap.id = c.asesor_id
        JOIN public.usuario au         ON au.id = ap.usuario_id

        LEFT JOIN public.recurso r     ON r.id = c.recurso_id
        LEFT JOIN public.edificio e    ON e.id = r.edificio_id
        LEFT JOIN public.campus cp     ON cp.id = e.campus_id

        WHERE
            a.estado IN ('PENDIENTE','CONFIRMADA')
            AND c.estado = 'RESERVADO'
            AND c.inicio >= now()
        """

        params: Dict[str, Any] = {"limit": limit}

        # Filtro por rol
        role = (role or "").strip()
        if role == "Asesor":
            if not profile_id:
                return []
            base_sql += " AND c.asesor_id = CAST(:profile_id AS uuid)"
            params["profile_id"] = str(profile_id)
        elif role == "Profesor":
            if not profile_id:
                return []
            base_sql += " AND a.docente_id = CAST(:profile_id AS uuid)"
            params["profile_id"] = str(profile_id)
        elif role == "Admin":
            # sin filtro
            pass
        else:
            # rol no reconocido
            return []

        base_sql += " ORDER BY c.inicio ASC LIMIT :limit"

        rows = (await self.session.execute(text(base_sql), params)).mappings().all()

        # Normalización al contrato esperado por el frontend (DashboardBackendRepo)
        # Campos: id, servicio, inicio (ISO), fin (ISO), docente, asesor, estado, location
        res: List[Dict[str, Any]] = []
        for r in rows:
            location_parts = []
            if r["campus_nombre"]:
                location_parts.append(r["campus_nombre"])
            if r["edificio_nombre"]:
                location_parts.append(r["edificio_nombre"])
            if r["sala_alias"] or r["sala_numero"]:
                sala = (r["sala_alias"] or "").strip()
                numero = (r["sala_numero"] or "").strip()
                if sala and numero:
                    location_parts.append(f"{sala} {numero}")
                elif sala:
                    location_parts.append(sala)
                elif numero:
                    location_parts.append(f"Sala {numero}")

            res.append(
                {
                    "id": str(r["asesoria_id"]),
                    "servicio": r["servicio"] or "Asesoría",
                    "inicio": r["inicio"].isoformat() if r["inicio"] else None,
                    "fin": r["fin"].isoformat() if r["fin"] else None,
                    "estado": r["estado_asesoria"],
                    # nombres
                    "docente": r["docente_nombre"],
                    "asesor": r["asesor_nombre"],
                    # etiqueta de ubicación opcional
                    "location": " · ".join([p for p in location_parts if p]),
                }
            )
        return res
    async def count_upcoming(self, role: str, profile_id: Optional[UUID]) -> int:

        
        base_sql = """
        SELECT COUNT(*)
        FROM public.asesoria a
        JOIN public.cupo c           ON c.id = a.cupo_id
        JOIN public.servicio s       ON s.id = c.servicio_id
        JOIN public.docente_perfil dp ON dp.id = a.docente_id
        JOIN public.asesor_perfil ap  ON ap.id = c.asesor_id
        WHERE
            a.estado IN ('PENDIENTE','CONFIRMADA')
            AND c.estado = 'RESERVADO'
            AND c.inicio >= now()
        """
        params: Dict[str, Any] = {}

        role = (role or "").strip()
        if role == "Asesor":
            if not profile_id:
                return 0
            base_sql += " AND c.asesor_id = CAST(:profile_id AS uuid)"
            params["profile_id"] = str(profile_id)
        elif role == "Profesor":
            if not profile_id:
                return 0
            base_sql += " AND a.docente_id = CAST(:profile_id AS uuid)"
            params["profile_id"] = str(profile_id)
        elif role == "Admin":
            pass
        else:
            return 0

        total = (await self.session.execute(text(base_sql), params)).scalar() or 0
        return int(total)
