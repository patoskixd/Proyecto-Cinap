from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.frameworks_drivers.config.db import get_session
from app.interface_adapters.controllers.auth_helpers import get_user_profile_info
from app.interface_adapters.gateways.db.sqlalchemy_dashboard_stats_repository import SqlAlchemyDashboardStatsRepository
from app.interface_adapters.gateways.db.sqlalchemy_dashboard_upcoming_appointments_repository import (
    SqlAlchemyDashboardUpcomingAppointmentsRepository,
)
from app.use_cases.dashboard.get_dashboard_stats import GetDashboardDataUseCase
from app.use_cases.dashboard.get_upcoming_appointments import GetUpcomingAppointmentsUseCase

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")  # combinado (compatibilidad)
async def get_dashboard(request: Request, session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    try:
        user_data = getattr(request.state, "user", None)
        if not user_data:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        role, profile_uuid = await get_user_profile_info(user_data, session)

        stats_repo = SqlAlchemyDashboardStatsRepository(session)
        upcoming_repo = SqlAlchemyDashboardUpcomingAppointmentsRepository(session)
        use_case = GetDashboardDataUseCase(stats_repo, upcoming_repo)

        data = await use_case.execute(role=role, profile_id=profile_uuid)
        return {"success": True, "data": data, "role": role, "user_id": user_data.get("sub")}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/stats")
async def get_dashboard_stats_only(request: Request, session: AsyncSession = Depends(get_session)) -> Dict[str, Any]:
    """
    Sólo métricas:
      - Admin: advisorsTotal, teachersTotal, appointmentsThisMonth, pendingCount, activeCategories, activeServices
      - Asesor/Profesor: monthCount, pendingCount (personales)
    """
    try:
        user_data = getattr(request.state, "user", None)
        if not user_data:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        role, profile_uuid = await get_user_profile_info(user_data, session)
        stats_repo = SqlAlchemyDashboardStatsRepository(session)

        if role == "Admin":
            admin_metrics = await stats_repo.admin_stats()
            return {
                "success": True,
                "data": {
                    # raíz (frontend actual)
                    "advisorsTotal": admin_metrics.get("advisorsTotal", 0),
                    "teachersTotal": admin_metrics.get("teachersTotal", 0),
                    "appointmentsThisMonth": admin_metrics.get("appointmentsThisMonth", 0),
                    "pendingCount": admin_metrics.get("pendingCount", 0),
                    "activeCategories": admin_metrics.get("activeCategories", 0),
                    "activeServices": admin_metrics.get("activeServices", 0),
                    # bloque para frontend nuevo
                    "adminMetrics": admin_metrics,
                    # opcional: duplicado para cards antiguas
                    "monthCount": admin_metrics.get("appointmentsThisMonth", 0),
                },
                "role": role,
            }

        # Asesor / Profesor
        personal = await stats_repo.personal_stats(role=role, profile_id=profile_uuid)
        return {
            "success": True,
            "data": {
                "monthCount": personal.get("monthCount", 0),
                "pendingCount": personal.get("pendingCount", 0),
            },
            "role": role,
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/upcoming")
async def get_dashboard_upcoming_only(
    request: Request,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(4, ge=1, le=20),  # <<-- default 4 + validaciones
) -> Dict[str, Any]:
    try:
        user_data = getattr(request.state, "user", None)
        if not user_data:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        role, profile_uuid = await get_user_profile_info(user_data, session)

        upcoming_repo = SqlAlchemyDashboardUpcomingAppointmentsRepository(session)
        use_case = GetUpcomingAppointmentsUseCase(upcoming_repo)
        next_appointments = await use_case.execute(role=role, profile_id=profile_uuid, limit=limit)

        # NUEVO: total real para chips/contador
        upcoming_total = await upcoming_repo.count_upcoming(role=role, profile_id=profile_uuid)

        return {"success": True, "data": {"nextAppointments": next_appointments, "upcomingTotal": upcoming_total}, "role": role}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
