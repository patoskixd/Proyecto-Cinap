from __future__ import annotations

from typing import Callable, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.interface_adapters.controllers.auth_helpers import get_user_profile_info
from app.use_cases.ports.token_port import JwtPort


def make_profile_router(*, get_session_dep: Callable[[], AsyncSession], jwt_port: JwtPort) -> APIRouter:
    router = APIRouter(prefix="/profile", tags=["profile"])

    def ensure_user(request: Request) -> Dict[str, Any]:
        cached = getattr(request.state, "user", None)
        if cached:
            return cached
        token = request.cookies.get("app_session")
        if not token:
            raise HTTPException(status_code=401, detail="No autenticado")
        try:
            data = jwt_port.decode(token)
            request.state.user = data
            return data
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

    @router.get("/summary")
    async def get_profile_summary(
        request: Request,
        session: AsyncSession = Depends(get_session_dep),
    ):
        user_data = ensure_user(request)
        usuario_id = user_data.get("sub")
        if not usuario_id:
            raise HTTPException(status_code=401, detail="Token sin usuario asociado")

        role_name, profile_uuid = await get_user_profile_info(user_data, session)
        role_norm = (role_name or "").strip()

        user_row = (
            await session.execute(
                text(
                    """
                    SELECT
                        u.nombre AS name,
                        u.email  AS email,
                        COALESCE(r.nombre, 'Usuario') AS role
                    FROM public.usuario u
                    LEFT JOIN public.rol r ON r.id = u.rol_id
                    WHERE u.id = CAST(:uid AS uuid)
                    """
                ),
                {"uid": str(usuario_id)},
            )
        ).mappings().first()

        if not user_row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        filter_clause = "1=1"
        params: Dict[str, Any] = {}

        if role_norm == "Asesor":
            if not profile_uuid:
                raise HTTPException(status_code=400, detail="Perfil de asesor no disponible")
            filter_clause = "c.asesor_id = :pid"
            params["pid"] = str(profile_uuid)
        elif role_norm == "Profesor":
            if not profile_uuid:
                raise HTTPException(status_code=400, detail="Perfil de profesor no disponible")
            filter_clause = "a.docente_id = :pid"
            params["pid"] = str(profile_uuid)
        elif role_norm == "Admin":
            filter_clause = "1=1"
        else:
            filter_clause = "1=0"

        stats_row = (
            await session.execute(
                text(
                    f"""
                    SELECT
                        COALESCE(SUM(CASE WHEN a.estado = 'COMPLETADA' THEN 1 ELSE 0 END), 0) AS completed,
                        COALESCE(SUM(CASE WHEN a.estado = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS canceled,
                        COALESCE(COUNT(*), 0) AS total
                    FROM public.asesoria a
                    JOIN public.cupo c ON c.id = a.cupo_id
                    WHERE {filter_clause}
                    """
                ),
                params,
            )
        ).mappings().first()

        stats = {
            "completed": int(stats_row["completed"]) if stats_row else 0,
            "canceled": int(stats_row["canceled"]) if stats_row else 0,
            "total": int(stats_row["total"]) if stats_row else 0,
        }

        return {
            "success": True,
            "data": {
                "user": {
                    "id": str(usuario_id),
                    "name": user_row["name"],
                    "email": user_row["email"],
                    "role": role_norm,
                },
                "stats": stats,
            },
        }

    return router
