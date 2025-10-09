from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from uuid import UUID


class DashboardStatsRepository(ABC):
    """Puerto para obtener estadísticas del dashboard por rol."""
    
    @abstractmethod
    async def get_admin_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas para rol administrador.
        """
        pass
    
    @abstractmethod
    async def get_advisor_stats(self, advisor_id: UUID) -> Dict[str, Any]:
        """
        Obtiene estadísticas para rol asesor.
        """
        pass
    
    @abstractmethod
    async def get_teacher_stats(self, teacher_id: UUID) -> Dict[str, Any]:
        """
        Obtiene estadísticas para rol docente.
        """
        pass