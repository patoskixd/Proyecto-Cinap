from __future__ import annotations
from functools import cache
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.use_cases.ports.token_port import JwtPort
from app.interface_adapters.gateways.db.sqlalchemy_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from app.interface_adapters.gateways.calendar.google_calendar_client import GoogleCalendarClient
from app.frameworks_drivers.config.settings import FRONTEND_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo


class CheckConflictsRequest(BaseModel):
    start: str  # ISO datetime
    end: str    # ISO datetime


def make_calendar_router(*, get_session_dep, jwt_port: JwtPort, cache, webhook_public_url: str) -> APIRouter:
    r = APIRouter(prefix="/api/calendar", tags=["calendar"])

    def ensure_user(req: Request) -> dict:
        token = req.cookies.get("app_session")
        if not token: raise HTTPException(status_code=401, detail="No autenticado")
        try: return jwt_port.decode(token)
        except Exception: raise HTTPException(status_code=401, detail="Token inválido")

    @r.post("/check-conflicts")
    async def check_conflicts(
        body: CheckConflictsRequest,
        request: Request,
        session: AsyncSession = Depends(get_session_dep)
    ):
        """Verifica si el DOCENTE autenticado tiene eventos en su calendario que se solapen con el rango especificado"""
        data = ensure_user(request)
        docente_usuario_id = str(data.get("sub"))

        # Obtener refresh_token del DOCENTE
        user_repo = SqlAlchemyUserRepo(session, default_role_id=None)
        refresh_token = await user_repo.get_refresh_token_by_usuario_id(docente_usuario_id)
        
        if not refresh_token:
            return {"conflicts": []}

        cal = GoogleCalendarClient(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            get_refresh_token_by_usuario_id=user_repo.get_refresh_token_by_usuario_id,
            invalidate_refresh_token_by_usuario_id=user_repo.invalidate_refresh_token,
        )

        try:
            start_dt = datetime.fromisoformat(body.start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(body.end.replace('Z', '+00:00'))
            
            conflicts = await cal.find_overlapping_events(
                usuario_id=docente_usuario_id,
                start=start_dt,
                end=end_dt
            )
            
            return {"conflicts": conflicts}
            
        except Exception as e:
            return {"conflicts": [], "error": str(e)}

    @r.post("/watch/primary")
    async def watch_primary(request: Request, session: AsyncSession = Depends(get_session_dep)):
        data = ensure_user(request)
        usuario_id = str(data.get("sub"))
        repo = SqlAlchemyCalendarEventsRepo(session, cache=cache)

        cal = GoogleCalendarClient(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            get_refresh_token_by_usuario_id=lambda uid: 
                SqlAlchemyUserRepo(session, default_role_id=None).get_refresh_token_by_usuario_id(uid),
            invalidate_refresh_token_by_usuario_id=lambda uid: 
                SqlAlchemyUserRepo(session, default_role_id=None).invalidate_refresh_token(uid),
        )

        channel_id = str(uuid.uuid4())
        callback = webhook_public_url.rstrip("/") + "/webhooks/google/calendar"   # Debe ser HTTPS público del backend
        out = await cal.watch_primary_calendar(
            organizer_usuario_id=usuario_id,
            callback_url=callback,
            channel_id=channel_id,
            token="cinap"
        )
        await repo.save_channel_owner(channel_id, usuario_id, out.get("resourceId"))
        return {"ok": True, "channel": out}

    @r.post("/configure-all-webhooks")
    async def configure_all_webhooks(request: Request, session: AsyncSession = Depends(get_session_dep)):
        """Configura webhooks para todos los asesores que no los tengan (para uso en producción)"""
        data = ensure_user(request)
        role = data.get("role")
        
        # Solo admins pueden ejecutar configuración masiva
        if role != "Admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden ejecutar configuración masiva")

        # Crear instancia de AutoConfigureWebhook
        from app.use_cases.calendar.auto_configure_webhook import AutoConfigureWebhook
        
        repo = SqlAlchemyCalendarEventsRepo(session, cache=cache)
        cal = GoogleCalendarClient(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            get_refresh_token_by_usuario_id=lambda uid: 
                SqlAlchemyUserRepo(session, default_role_id=None).get_refresh_token_by_usuario_id(uid),
            invalidate_refresh_token_by_usuario_id=lambda uid: 
                SqlAlchemyUserRepo(session, default_role_id=None).invalidate_refresh_token(uid),
        )
        
        auto_config = AutoConfigureWebhook(
            cal=cal,
            repo=repo,
            webhook_public_url=webhook_public_url
        )
        
        # Ejecutar configuración masiva
        result = await auto_config.configure_for_all_advisors()
        return result

    return r
