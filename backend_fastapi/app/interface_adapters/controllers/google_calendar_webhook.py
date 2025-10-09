from fastapi import APIRouter, Request, Response, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.use_cases.calendar.handle_google_webhook import HandleGoogleWebhook
from app.interface_adapters.gateways.db.sqlalchemy_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from app.interface_adapters.gateways.calendar.google_calendar_client import GoogleCalendarClient
from app.frameworks_drivers.config.settings import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

def make_google_calendar_webhook_router(*, get_session_dep, cache, cal_client_factory) -> APIRouter:
    r = APIRouter()

    @r.post("/webhooks/google/calendar")
    async def google_calendar_webhook(request: Request, session: AsyncSession = Depends(get_session_dep)):
        # Google solo mira el 200 OK (no requiere body). Procesamos async/rápido.
        import logging
        logger = logging.getLogger(__name__)
        
        hdr = request.headers
        channel_id       = hdr.get("X-Goog-Channel-Id", "")
        resource_state   = hdr.get("X-Goog-Resource-State", "")
        # opcional: token = hdr.get("X-Goog-Channel-Token")
        
        logger.info(f"WEBHOOK RECIBIDO: channel_id={channel_id}, state={resource_state}")

        repo = SqlAlchemyCalendarEventsRepo(session, cache=cache)
        cal  = cal_client_factory(session)  # usa el del container con get_refresh_token_by_usuario_id

        uc = HandleGoogleWebhook(cal=cal, repo=repo)
        # No bloquees; igual es rápido, pero podría ir a TaskGroup si usas background
        try:
            result = await uc.exec(channel_id=channel_id, resource_state=resource_state, token=None)
            logger.info(f"WEBHOOK PROCESADO: {result}")
        except Exception as e:
            logger.error(f"ERROR EN WEBHOOK: {e}")
            
        return Response(status_code=200)

    return r
