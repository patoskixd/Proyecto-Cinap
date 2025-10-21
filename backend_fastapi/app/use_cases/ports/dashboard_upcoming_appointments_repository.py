from typing import Any, Dict, List, Optional
from uuid import UUID
from abc import ABC, abstractmethod

class DashboardUpcomingAppointmentRepo(ABC):
    @abstractmethod
    async def fetch_next(self, role: str, profile_id: Optional[UUID], limit: int = 4) -> List[Dict[str, Any]]:
        ...

    @abstractmethod
    async def count_upcoming(self, role: str, profile_id: Optional[UUID]) -> int:
        ...
