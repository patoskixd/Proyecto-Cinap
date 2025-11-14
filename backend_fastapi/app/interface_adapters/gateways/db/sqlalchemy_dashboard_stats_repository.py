from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone

from app.use_cases.ports.dashboard_stats_repository import DashboardStatsRepository


class SqlAlchemyDashboardStatsRepository(DashboardStatsRepository):
    """
    Estadísticas del dashboard:

    - Admin:
        advisorsTotal, teachersTotal, appointmentsThisMonth, pendingCount,
        activeCategories, activeServices
    - Asesor/Profesor:
        monthCount (del mes para ese usuario),
        pendingCount (pendientes para ese usuario)
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def admin_stats(self) -> Dict[str, int]:
        # 1) Asesores activos
        advisors_q = text("SELECT COUNT(*) FROM public.asesor_perfil WHERE activo = true")
        advisors_total = (await self.session.execute(advisors_q)).scalar() or 0

        # 2) Docentes activos
        teachers_q = text("SELECT COUNT(*) FROM public.docente_perfil WHERE activo = true")
        teachers_total = (await self.session.execute(teachers_q)).scalar() or 0

        # 3) Asesorías del mes (por fecha del CUP0)
        now = datetime.now(timezone.utc)
        next_month = (
            datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
            if now.month == 12
            else datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
        )
        appts_q = text("""
            SELECT COUNT(*)
            FROM public.asesoria a
            JOIN public.cupo c ON c.id = a.cupo_id
            WHERE c.inicio < :next_month
              AND a.estado IN ('PENDIENTE','CONFIRMADA')
              AND c.estado = 'RESERVADO'
        """)
        appointments_month = (await self.session.execute(
            appts_q, {"next_month": next_month}
        )).scalar() or 0

        # 4) Por confirmar (pendientes)
        pending_q = text("SELECT COUNT(*) FROM public.asesoria WHERE estado = 'PENDIENTE'")
        pending_count = (await self.session.execute(pending_q)).scalar() or 0

        # 5) Categorías / Servicios activos
        cat_q = text("SELECT COUNT(*) FROM public.categoria WHERE activo = true")
        srv_q = text("SELECT COUNT(*) FROM public.servicio  WHERE activo = true")
        active_categories = (await self.session.execute(cat_q)).scalar() or 0
        active_services   = (await self.session.execute(srv_q)).scalar() or 0

        return {
            "advisorsTotal": advisors_total,
            "teachersTotal": teachers_total,
            "appointmentsThisMonth": appointments_month,
            "pendingCount": pending_count,
            "activeCategories": active_categories,
            "activeServices": active_services,
        }

    async def personal_stats(self, role: str, profile_id: Optional[UUID]) -> Dict[str, int]:
        if not profile_id:
            return {"monthCount": 0, "pendingCount": 0}

        # Filtro por rol
        if role == "Asesor":
            owner_filter = "c.asesor_id = CAST(:pid AS uuid)"
        elif role == "Profesor":
            owner_filter = "a.docente_id = CAST(:pid AS uuid)"
        else:
            return {"monthCount": 0, "pendingCount": 0}

        q = text(
            f"""
            WITH appts_month AS (
                SELECT count(*) AS total
                FROM public.asesoria a
                JOIN public.cupo c ON c.id = a.cupo_id
                WHERE a.estado IN ('PENDIENTE','CONFIRMADA')
                  AND date_trunc('month', c.inicio) = date_trunc('month', now())
                  AND c.estado = 'RESERVADO'
                  AND {owner_filter}
            ),
            appts_pending AS (
                SELECT count(*) AS total
                FROM public.asesoria a
                JOIN public.cupo c ON c.id = a.cupo_id
                WHERE a.estado = 'PENDIENTE'
                  AND {owner_filter}
            )
            SELECT
                COALESCE((SELECT total FROM appts_month), 0)    AS month_count,
                COALESCE((SELECT total FROM appts_pending), 0)  AS pending_count
            """
        )
        row = (await self.session.execute(q, {"pid": str(profile_id)})).mappings().first()
        if not row:
            row = {"month_count": 0, "pending_count": 0}

        calendar_connected = False
        try:
            profile_to_user_sql = (
                "SELECT usuario_id FROM public.asesor_perfil WHERE id = CAST(:pid AS uuid)"
                if role == "Asesor"
                else "SELECT usuario_id FROM public.docente_perfil WHERE id = CAST(:pid AS uuid)"
            )
            usuario_id = (
                await self.session.execute(
                    text(profile_to_user_sql),
                    {"pid": str(profile_id)},
                )
            ).scalar()

            if usuario_id:
                conn_sql = text(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM public.user_identity
                        WHERE usuario_id = CAST(:uid AS uuid)
                          AND provider = 'google'
                          AND conectado = true
                          AND refresh_token_hash IS NOT NULL
                    )
                    """
                )
                calendar_connected = bool(
                    (
                        await self.session.execute(
                            conn_sql, {"uid": str(usuario_id)}
                        )
                    ).scalar()
                )
        except Exception:
            calendar_connected = False

        return {
            "monthCount": row.get("month_count", 0),
            "pendingCount": row.get("pending_count", 0),
            "calendarConnected": calendar_connected,
        }

    async def execute(self, role: str, profile_id: Optional[UUID]) -> Dict[str, Any]:
        role = (role or "").strip()

        if role == "Admin":
            admin_metrics = await self.stats_repo.admin_stats()
            next_appointments = await self.upcoming_repo.fetch_next(role="Admin", profile_id=None, limit=4)
            upcoming_total = await self.upcoming_repo.count_upcoming(role="Admin", profile_id=None)

            return {
                "advisorsTotal":        admin_metrics.get("advisorsTotal", 0),
                "teachersTotal":        admin_metrics.get("teachersTotal", 0),
                "appointmentsThisMonth":admin_metrics.get("appointmentsThisMonth", 0),
                "pendingCount":         admin_metrics.get("pendingCount", 0),
                "activeCategories":     admin_metrics.get("activeCategories", 0),
                "activeServices":       admin_metrics.get("activeServices", 0),

                "monthCount":           admin_metrics.get("appointmentsThisMonth", 0),
                "nextAppointments":     next_appointments,
                "upcomingTotal":        upcoming_total,  # <<--- NUEVO
                "adminMetrics":         admin_metrics,
            }

        elif role in ("Asesor", "Profesor"):
            personal = await self.stats_repo.personal_stats(role=role, profile_id=profile_id)
            next_appointments = await self.upcoming_repo.fetch_next(role=role, profile_id=profile_id, limit=4)
            upcoming_total = await self.upcoming_repo.count_upcoming(role=role, profile_id=profile_id)

            return {
                "monthCount":    personal.get("monthCount", 0),
                "pendingCount":  personal.get("pendingCount", 0),
                "nextAppointments": next_appointments,
                "upcomingTotal": upcoming_total,  # <<--- NUEVO
            }

        return {"monthCount": 0, "pendingCount": 0, "nextAppointments": [], "upcomingTotal": 0}
