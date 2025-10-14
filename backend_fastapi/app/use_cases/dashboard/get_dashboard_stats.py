from typing import Dict, Any, Optional
from uuid import UUID

from app.use_cases.ports.dashboard_stats_repository import DashboardStatsRepository


class GetDashboardStatsUseCase:
    """Caso de uso para obtener estadísticas del dashboard por rol."""
    
    def __init__(self, dashboard_stats_repo: DashboardStatsRepository):
        self.dashboard_stats_repo = dashboard_stats_repo
    
    async def execute(
        self, 
        role: str, 
        user_id: Optional[UUID] = None,
        profile_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Obtiene estadísticas según el rol del usuario.
        """
        if role == "Admin":
            return await self.dashboard_stats_repo.get_admin_stats()
        
        elif role == "Asesor":
            if not profile_id:
                raise ValueError("Se requiere profile_id para rol Asesor")
            return await self.dashboard_stats_repo.get_advisor_stats(profile_id)
        
        elif role == "Profesor":
            if not profile_id:
                raise ValueError("Se requiere profile_id para rol Profesor")
            return await self.dashboard_stats_repo.get_teacher_stats(profile_id)
        
        else:
            raise ValueError(f"Rol no válido: {role}. Roles válidos: Admin, Asesor, Profesor")