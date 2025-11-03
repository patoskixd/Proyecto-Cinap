from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from app.use_cases.ports.dashboard_stats_repository import DashboardStatsRepository
from app.use_cases.ports.dashboard_upcoming_appointments_repository import DashboardUpcomingAppointmentRepo


class GetDashboardDataUseCase:

    def __init__(
        self,
        stats_repo: DashboardStatsRepository,
        upcoming_repo: DashboardUpcomingAppointmentRepo,
    ) -> None:
        self.stats_repo = stats_repo
        self.upcoming_repo = upcoming_repo

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
                "upcomingTotal":        upcoming_total,
                "adminMetrics":         admin_metrics,
                "isCalendarConnected":  False,
            }

        elif role in ("Asesor", "Profesor"):
            personal = await self.stats_repo.personal_stats(role=role, profile_id=profile_id)
            next_appointments = await self.upcoming_repo.fetch_next(role=role, profile_id=profile_id, limit=4)
            upcoming_total = await self.upcoming_repo.count_upcoming(role=role, profile_id=profile_id)
            return {
                "monthCount": personal.get("monthCount", 0),
                "pendingCount": personal.get("pendingCount", 0),
                "nextAppointments": next_appointments,
                "upcomingTotal": upcoming_total,
                "isCalendarConnected": personal.get("calendarConnected", False),
            }

        return {
            "monthCount": 0,
            "pendingCount": 0,
            "nextAppointments": [],
            "upcomingTotal": 0,
            "isCalendarConnected": False,
        }
