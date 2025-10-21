from typing import Dict, Optional
from uuid import UUID
from abc import ABC, abstractmethod


class DashboardStatsRepository(ABC):
    @abstractmethod
    async def admin_stats(self) -> Dict[str, int]:
        ...

    @abstractmethod
    async def personal_stats(self, role: str, profile_id: Optional[UUID]) -> Dict[str, int]:
        ...
