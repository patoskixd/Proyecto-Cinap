from __future__ import annotations

import math
import uuid
from datetime import datetime, date
from typing import Any, Optional

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.reservations_repo import (
    ReservationRecord,
    ReservationsPage,
    ReservationsQuery,
    ReservationsRepo,
)

ALLOWED_STATES = ("PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA")


class SqlAlchemyReservationsRepo(ReservationsRepo):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _role_filter_sql(self, role: str) -> Optional[str]:
        role_norm = (role or "").strip().lower()
        if role_norm == "admin":
            return None
        if role_norm == "asesor":
            return "c.asesor_id = :profile_id"
        if role_norm == "profesor":
            return "a.docente_id = :profile_id"
        return "1=0"

    def _compose_location(
        self,
        campus: Optional[str],
        edificio: Optional[str],
        sala: Optional[str],
    ) -> Optional[str]:
        parts: list[str] = []
        if campus:
            parts.append(campus)
        if edificio:
            parts.append(edificio)
        if sala:
            parts.append(f"Sala {sala}" if sala and sala.upper().startswith("SALA") is False else sala)
        return " / ".join(parts) if parts else None

    async def _normalize_expired(self) -> None:
        # Confirmadas que ya terminaron -> COMPLETADA
        await self.session.execute(
            sa.text(
                """
                WITH updated AS (
                    UPDATE asesoria a
                    SET estado = 'COMPLETADA'
                    FROM cupo c
                    WHERE a.cupo_id = c.id
                      AND a.estado = 'CONFIRMADA'
                      AND c.fin <= now() - INTERVAL '1 minute'
                    RETURNING a.id
                )
                SELECT 1
                """
            )
        )

        # Pendientes que ya terminaron -> CANCELADA y cupo cancelado
        await self.session.execute(
            sa.text(
                """
                WITH cancelled AS (
                    UPDATE asesoria a
                    SET estado = 'CANCELADA'
                    FROM cupo c
                    WHERE a.cupo_id = c.id
                      AND a.estado = 'PENDIENTE'
                      AND c.fin <= now() - INTERVAL '1 minute'
                    RETURNING c.id AS cupo_id
                )
                UPDATE cupo
                SET estado = 'CANCELADO'
                WHERE id IN (SELECT cupo_id FROM cancelled)
                """
            )
        )

        await self.session.commit()

    async def list(self, query: ReservationsQuery) -> ReservationsPage:
        await self._normalize_expired()

        if query.limit <= 0:
            raise ValueError("limit debe ser > 0")
        kind = (query.kind or "upcoming").lower()
        if kind not in ("upcoming", "past"):
            raise ValueError("kind debe ser 'upcoming' o 'past'")

        base_filters: list[str] = ["a.estado::text = ANY(:allowed_states)"]

        params: dict[str, Any] = {
            "allowed_states": list(ALLOWED_STATES),
        }

        role_filter = self._role_filter_sql(query.role)
        if role_filter:
            base_filters.append(role_filter)
            if "profile_id" not in params:
                params["profile_id"] = query.profile_id

        if kind == "upcoming":
            base_filters.append("c.inicio >= now()")
            order_clause = "ORDER BY inicio ASC"
        else:
            base_filters.append("c.inicio < now()")
            order_clause = "ORDER BY inicio DESC"

        if query.status:
            base_filters.append("a.estado::text = :status")
            params["status"] = query.status.upper()

        if query.category:
            base_filters.append("cat.nombre ILIKE :category")
            params["category"] = f"%{query.category}%"

        if query.service:
            base_filters.append("s.nombre ILIKE :service")
            params["service"] = f"%{query.service}%"

        if query.advisor:
            base_filters.append("(au.nombre ILIKE :advisor OR au.email ILIKE :advisor)")
            params["advisor"] = f"%{query.advisor}%"

        if query.date_from:
            if isinstance(query.date_from, datetime):
                start_dt = query.date_from
            else:
                start_dt = datetime.combine(query.date_from, datetime.min.time())
            base_filters.append("c.inicio >= :date_from_filter")
            params["date_from_filter"] = start_dt

        where_clause = " AND ".join(base_filters)

        sql = sa.text(
            f"""
            WITH filtered AS (
                SELECT
                    a.id                        AS asesoria_id,
                    a.estado::text              AS estado,
                    a.cupo_id                   AS cupo_id,
                    c.inicio                    AS inicio,
                    c.fin                       AS fin,
                    s.id                        AS servicio_id,
                    s.nombre                    AS servicio_nombre,
                    s.duracion_minutos          AS duracion_minutos,
                    cat.id                      AS categoria_id,
                    cat.nombre                  AS categoria_nombre,
                    ap.id                       AS asesor_id,
                ap.usuario_id               AS asesor_usuario_id,
                au.nombre                   AS asesor_nombre,
                au.email                    AS asesor_email,
                du.nombre                   AS docente_nombre,
                du.email                    AS docente_email,
                dp.usuario_id               AS docente_usuario_id,
                ca.nombre                   AS campus_nombre,
                e.nombre                    AS edificio_nombre,
                r.sala_numero               AS sala_numero,
                COUNT(*) OVER()             AS total_count
            FROM asesoria a
                JOIN cupo c               ON c.id = a.cupo_id
                JOIN servicio s           ON s.id = c.servicio_id
                JOIN categoria cat        ON cat.id = s.categoria_id
                JOIN docente_perfil dp    ON dp.id = a.docente_id
                JOIN usuario du           ON du.id = dp.usuario_id
                LEFT JOIN asesor_perfil ap ON ap.id = c.asesor_id
                LEFT JOIN usuario au       ON au.id = ap.usuario_id
                LEFT JOIN recurso r        ON r.id = c.recurso_id
                LEFT JOIN edificio e       ON e.id = r.edificio_id
                LEFT JOIN campus ca        ON ca.id = e.campus_id
                WHERE {where_clause}
            )
            SELECT *
            FROM filtered
            {order_clause}
            LIMIT :limit OFFSET :offset
            """
        )

        offset = (query.page - 1) * query.limit
        params.update({"limit": query.limit, "offset": offset})

        rows = (await self.session.execute(sql, params)).mappings().all()

        if not rows:
            return ReservationsPage(items=[], total=0, page=query.page, pages=1)

        total = rows[0]["total_count"] if rows else 0
        pages = max(1, math.ceil(total / query.limit))

        items: list[ReservationRecord] = []
        for row in rows:
            location_text = self._compose_location(
                row.get("campus_nombre"),
                row.get("edificio_nombre"),
                row.get("sala_numero"),
            )
            items.append(
                ReservationRecord(
                    id=row["asesoria_id"],
                    inicio=row["inicio"],
                    fin=row["fin"],
                    estado=row["estado"],
                    servicio_id=row["servicio_id"],
                    servicio_nombre=row["servicio_nombre"],
                    categoria_id=row["categoria_id"],
                    categoria_nombre=row["categoria_nombre"],
                    duracion_minutos=row.get("duracion_minutos"),
                    asesor_id=row.get("asesor_id"),
                    asesor_usuario_id=row.get("asesor_usuario_id"),
                    asesor_nombre=row.get("asesor_nombre"),
                    asesor_email=row.get("asesor_email"),
                    docente_nombre=row.get("docente_nombre") or "",
                    docente_email=row.get("docente_email") or "",
                    location_text=location_text,
                )
            )

        return ReservationsPage(items=items, total=total, page=query.page, pages=pages)

    async def get_reservation_context(self, asesoria_id: uuid.UUID) -> dict:
        sql = sa.text(
            """
            SELECT
                a.id                  AS asesoria_id,
                a.estado::text        AS estado,
                a.origen              AS origen,
                a.notas               AS notas,
                a.cupo_id             AS cupo_id,
                c.inicio              AS inicio,
                c.fin                 AS fin,
                s.nombre              AS servicio_nombre,
                s.duracion_minutos    AS duracion_minutos,
                cat.nombre            AS categoria_nombre,
                ap.usuario_id         AS asesor_usuario_id,
                au.nombre             AS asesor_nombre,
                au.email              AS asesor_email,
                du.nombre             AS docente_nombre,
                du.email              AS docente_email,
                dp.usuario_id         AS docente_usuario_id,
                ca.nombre             AS campus_nombre,
                e.nombre              AS edificio_nombre,
                r.sala_numero         AS sala_numero,
                r.nombre              AS recurso_alias
            FROM asesoria a
            JOIN cupo c               ON c.id = a.cupo_id
            JOIN servicio s           ON s.id = c.servicio_id
            JOIN categoria cat        ON cat.id = s.categoria_id
            JOIN docente_perfil dp    ON dp.id = a.docente_id
            JOIN usuario du           ON du.id = dp.usuario_id
            LEFT JOIN asesor_perfil ap ON ap.id = c.asesor_id
            LEFT JOIN usuario au       ON au.id = ap.usuario_id
            LEFT JOIN recurso r        ON r.id = c.recurso_id
            LEFT JOIN edificio e       ON e.id = r.edificio_id
            LEFT JOIN campus ca        ON ca.id = e.campus_id
            WHERE a.id = :asesoria_id
            LIMIT 1
            """
        )
        row = (
            await self.session.execute(sql, {"asesoria_id": uuid.UUID(str(asesoria_id))})
        ).mappings().first()
        if not row:
            raise ValueError("Asesoría no encontrada")

        location_text = self._compose_location(
            row.get("campus_nombre"),
            row.get("edificio_nombre"),
            row.get("sala_numero"),
        )

        return {
            "asesoria_id": row["asesoria_id"],
            "estado": row["estado"],
            "origen": row.get("origen"),
            "notas": row.get("notas"),
            "cupo_id": row["cupo_id"],
            "inicio": row["inicio"],
            "fin": row["fin"],
            "servicio_nombre": row["servicio_nombre"],
            "categoria_nombre": row["categoria_nombre"],
            "asesor_usuario_id": row.get("asesor_usuario_id"),
            "asesor_nombre": row.get("asesor_nombre"),
            "asesor_email": row.get("asesor_email"),
            "docente_nombre": row.get("docente_nombre"),
            "docente_email": row.get("docente_email"),
            "docente_usuario_id": row.get("docente_usuario_id"),
            "location_text": location_text,
            "duracion_minutos": row.get("duracion_minutos"),
        }

