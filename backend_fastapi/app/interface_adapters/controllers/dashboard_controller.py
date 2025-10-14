from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.frameworks_drivers.config.db import get_session
from app.interface_adapters.gateways.db.sqlalchemy_dashboard_stats_repository import SqlAlchemyDashboardStatsRepository
from app.use_cases.dashboard.get_dashboard_stats import GetDashboardStatsUseCase
from app.interface_adapters.controllers.auth_helpers import get_user_profile_info


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard_stats(
    request: Request,
    session: AsyncSession = Depends(get_session),
    role: str = Query(None, description="Rol del usuario (opcional, se obtiene del token)")
) -> Dict[str, Any]:
    """
    Obtiene las estadísticas del dashboard según el rol del usuario autenticado.
    """
    try:
        # Obtener información del usuario autenticado
        user_data = getattr(request.state, 'user', None)
        if not user_data:
            raise HTTPException(
                status_code=401,
                detail="Usuario no autenticado"
            )
        
        # Obtener rol y profile_id del usuario autenticado
        user_role, profile_uuid = await get_user_profile_info(user_data, session)
        
        # Usar el rol del parámetro si se proporciona, sino usar el del token
        final_role = role if role else user_role
        
        # Validar que el rol solicitado coincida con el del usuario
        if role and role != user_role:
            raise HTTPException(
                status_code=403,
                detail=f"No tienes permisos para acceder a las estadísticas del rol {role}"
            )
        
        # Crear repositorio y caso de uso
        dashboard_repo = SqlAlchemyDashboardStatsRepository(session)
        get_stats_use_case = GetDashboardStatsUseCase(dashboard_repo)
        
        # Ejecutar caso de uso
        stats = await get_stats_use_case.execute(
            role=final_role,
            profile_id=profile_uuid
        )
        
        return {
            "success": True,
            "data": stats,
            "role": final_role,
            "user_id": user_data.get("sub")
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )