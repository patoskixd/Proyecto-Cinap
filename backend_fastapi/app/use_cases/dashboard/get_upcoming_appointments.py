from __future__ import annotations
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.use_cases.ports.dashboard_upcoming_appointments_repository import DashboardUpcomingAppointmentRepo

class GetUpcomingAppointmentsUseCase:
    def __init__(self, upcoming_repo: DashboardUpcomingAppointmentRepo) -> None:
        self.upcoming_repo = upcoming_repo

    async def execute(self, role: str, profile_id: Optional[UUID], limit: int = 4) -> List[Dict[str, Any]]:
        role = (role or "").strip()
        return await self.upcoming_repo.fetch_next(role=role, profile_id=profile_id, limit=limit)
