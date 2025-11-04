from __future__ import annotations
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from redis.asyncio import Redis
import jwt
import asyncio
import logging

from app.frameworks_drivers.config.settings import (
    API_DEBUG,
    CORS_ORIGINS,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_DEVICE_ID,
    GOOGLE_DEVICE_NAME,
    JWT_SECRET,
    JWT_ISSUER,
    JWT_MINUTES,
    FRONTEND_ORIGIN,
    TEACHER_ROLE_ID,
    MCP_COMMAND,
    MCP_ARGS,
    MCP_CWD,
    WEBHOOK_PUBLIC_URL,
)
from sqlalchemy import delete
from app.interface_adapters.orm.models_scheduling import CupoModel, EstadoCupo
from app.frameworks_drivers.config.db import get_session
from app.frameworks_drivers.di.container import Container
from app.frameworks_drivers.web.rate_limit import make_simple_limiter
from app.interface_adapters.controllers.auth_router_factory import make_auth_router
from app.interface_adapters.controllers.slots_router import make_slots_router
from app.interface_adapters.controllers.advisor_catalog_router import (make_advisor_catalog_router)
from app.interface_adapters.controllers.advisor_confirmations_router import make_confirmations_router
from app.interface_adapters.controllers.asesorias_router import make_asesorias_router
from app.interface_adapters.controllers.telegram_webhook import make_telegram_router, setup_telegram_webhook
from app.interface_adapters.controllers.telegram_link_router import make_telegram_link_router
from app.interface_adapters.controllers.admin_catalog_router import make_admin_catalog_router  
from app.interface_adapters.controllers.admin_location_router import make_admin_location_router
from app.interface_adapters.controllers.admin_advisors_router import make_admin_advisors_router
from app.interface_adapters.controllers.admin_teachers_router import make_admin_teachers_router
from app.frameworks_drivers.web.semantic import router as semantic_router
from app.interface_adapters.controllers.dashboard_controller import router as dashboard_router
from app.interface_adapters.controllers.google_calendar_webhook import make_google_calendar_webhook_router
from app.interface_adapters.controllers.calendar_router import make_calendar_router
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.gateways.db.sqlalchemy_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from app.interface_adapters.gateways.calendar.google_calendar_client import GoogleCalendarClient
from app.use_cases.calendar.auto_configure_webhook import AutoConfigureWebhook
from app.interface_adapters.controllers.teacher_confirmations_router import make_teacher_confirmations_router
from app.interface_adapters.controllers.profile_router import make_profile_router
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from app.interface_adapters.gateways.db.sqlalchemy_slots_repo import SqlAlchemySlotsRepo
from app.frameworks_drivers.config.db import AsyncSessionLocal 
from zoneinfo import ZoneInfo
import sqlalchemy as sa

from app.observability.middleware import JSONTimingMiddleware
from app.observability.metrics import measure_stage, set_meta, stage, astage
from app.observability.confirm_store import ConfirmStore


def require_auth(request: Request):
    token = request.cookies.get("app_session")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        request.state.user = data
        return data
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

logger = logging.getLogger(__name__)

async def _reset_google_webhook_cache(redis: Redis | None, *, webhook_url: str) -> None:
    """
    Si la URL pública del webhook cambió, elimina los registros cacheados de
    canales anteriores para forzar una nueva configuración.
    """
    if not redis or not webhook_url:
        return

    key = "gc:webhook:last_url"

    try:
        last = await redis.get(key)
        if isinstance(last, bytes):
            last = last.decode()

        if last == webhook_url:
            return

        if last:
            logger.info("Webhook URL actualizada (%s -> %s); limpiando cache de canales Google.", last, webhook_url)
        else:
            logger.info("No se encontró URL previa; limpiando cache de canales Google.")

        async def _purge(pattern: str) -> None:
            batch: list[bytes] = []
            async for cache_key in redis.scan_iter(match=pattern):
                batch.append(cache_key)
                if len(batch) >= 256:
                    await redis.delete(*batch)
                    batch.clear()
            if batch:
                await redis.delete(*batch)

        await _purge("gc:channel:*")
        await _purge("gc:user_channels:*")
        await redis.set(key, webhook_url.encode())

    except Exception as exc:
        logger.warning("No se pudo reiniciar el cache de webhooks de Google: %s", exc)


def _build_calendar_client(session: AsyncSession) -> GoogleCalendarClient:
    repo = SqlAlchemyUserRepo(session, default_role_id=None)
    return GoogleCalendarClient(
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        get_refresh_token_by_usuario_id=repo.get_refresh_token_by_usuario_id,
        invalidate_refresh_token_by_usuario_id=repo.invalidate_refresh_token,
    )

def make_lifespan(*, start_scheduler: bool, auto_configure_google: bool, configure_telegram: bool):
    @asynccontextmanager
    async def lifespan(app):
        await container.startup()
        if getattr(container, "graph_agent", None) and hasattr(container.graph_agent, "set_confirm_store"):
            container.graph_agent.set_confirm_store(confirm_store)

        await _reset_google_webhook_cache(container.redis, webhook_url=WEBHOOK_PUBLIC_URL)

        if configure_telegram:
            try:
                await setup_telegram_webhook(WEBHOOK_PUBLIC_URL)
            except Exception as e:
                logger.exception("No se pudo configurar webhook de Telegram: %r", e)

        if auto_configure_google:
            try:
                if not WEBHOOK_PUBLIC_URL:
                    logger.warning("WEBHOOK_PUBLIC_URL no definido; se omite auto-configuración de Google Calendar")
                else:
                    async with AsyncSessionLocal() as session:
                        calendar_repo = SqlAlchemyCalendarEventsRepo(session, cache=container.cache)
                        cal_client = _build_calendar_client(session)
                        auto_cfg = AutoConfigureWebhook(
                            cal=cal_client,
                            repo=calendar_repo,
                            webhook_public_url=WEBHOOK_PUBLIC_URL,
                        )

                        advisors_result = await auto_cfg.configure_for_all_advisors()
                        teachers_result = await auto_cfg.configure_for_all_teachers()

                        logger.warning(
                            "Auto-config webhooks Google (asesores): nuevos=%s, existentes=%s, omitidos=%s, errores=%s",
                            advisors_result.get("configured"),
                            advisors_result.get("already_configured"),
                            advisors_result.get("skipped"),
                            advisors_result.get("errors"),
                        )
                        logger.warning(
                            "Auto-config webhooks Google (docentes): nuevos=%s, existentes=%s, omitidos=%s, errores=%s",
                            teachers_result.get("configured"),
                            teachers_result.get("already_configured"),
                            teachers_result.get("skipped"),
                            teachers_result.get("errors"),
                        )
            except Exception as e:
                logger.exception("No se pudo configurar los webhooks de Google Calendar: %r", e)

        if start_scheduler:
            scheduler.start()
        try:
            yield
        except asyncio.CancelledError:
            pass
        finally:
            if start_scheduler:
                try:
                    scheduler.shutdown(wait=False)
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.exception("Error durante shutdown del scheduler: %r", e)
            try:
                await asyncio.shield(container.shutdown())
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.exception("Error durante shutdown del container: %r", e)

    return lifespan

app = FastAPI(
    title="MCP Assistant",
    debug=API_DEBUG,
    lifespan=make_lifespan(
        start_scheduler=True,
        auto_configure_google=True,
        configure_telegram=True,
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(JSONTimingMiddleware)

container = Container(
    google_client_id=GOOGLE_CLIENT_ID,
    google_client_secret=GOOGLE_CLIENT_SECRET,
    google_redirect_uri=GOOGLE_REDIRECT_URI,
    google_device_id=GOOGLE_DEVICE_ID,
    google_device_name=GOOGLE_DEVICE_NAME,
    jwt_secret=JWT_SECRET,
    jwt_issuer=JWT_ISSUER,
    jwt_minutes=JWT_MINUTES,
    teacher_role_id=TEACHER_ROLE_ID,
    webhook_public_url=WEBHOOK_PUBLIC_URL,
    mcp_command=MCP_COMMAND,
    mcp_args=MCP_ARGS,
    mcp_cwd=MCP_CWD,
)

redis_client: Redis = container.redis 
confirm_store = ConfirmStore(redis_client, prefix="preview:", ttl_sec=600)


scheduler = AsyncIOScheduler(timezone="America/Santiago")

@scheduler.scheduled_job("cron", hour=18, minute=00, misfire_grace_time=600, max_instances=1)
async def roll_slots_status():
    got = await container.cache.acquire_lock("jobs:roll_slots_status", ttl_seconds=300)
    if not got:
        return
    try:
        async with AsyncSessionLocal() as session:
            repo = SqlAlchemySlotsRepo(session)
            exp = await repo.expire_open_slots()         # ABIERTO -> EXPIRADO
            done = await repo.complete_reserved_slots()  # RESERVADO -> REALIZADO
            if exp or done:
                await session.commit()
    except Exception:
        logger.exception("Error en roll_slots_status")
    finally:
        await container.cache.release_lock("jobs:roll_slots_status")


@scheduler.scheduled_job("cron", hour=1, minute=5, misfire_grace_time=600, max_instances=1)
async def purge_only_unreferenced_expired_slots():
    got = await container.cache.acquire_lock("jobs:purge_only_expired_slots", ttl_seconds=300)
    if not got:
        return
    try:
        async with AsyncSessionLocal() as session:
            # Borra SOLO los EXPIRADO que no estén referenciados por 'asesoria'
            sql = sa.text("""
                DELETE FROM cupo c
                WHERE c.estado = CAST(:estado AS estado_cupo)
                  AND c.fin < now()
                  AND NOT EXISTS (
                    SELECT 1 FROM asesoria a WHERE a.cupo_id = c.id
                  )
            """)
            res = await session.execute(sql, {"estado": EstadoCupo.EXPIRADO.value})
            await session.commit()
            deleted = int(getattr(res, "rowcount", 0) or 0)
            logger.info("purge_only_unreferenced_expired_slots -> eliminados=%s", deleted)
    except Exception:
        logger.exception("Error en purge_only_unreferenced_expired_slots")
    finally:
        await container.cache.release_lock("jobs:purge_only_expired_slots")

slots_router = make_slots_router(get_session_dep=get_session, jwt_port=container.jwt)
app.include_router(slots_router)

auth_router = make_auth_router(
    oauth=container.oauth,
    redirect_uri=GOOGLE_REDIRECT_URI,
    frontend_origin=FRONTEND_ORIGIN,
    uc_factory_google_callback=container.uc_google_callback,
    get_session_dep=get_session,
    jwt_port=container.jwt,
    uc_factory_logout=container.uc_logout,
    cache=container.cache
)
confirmations_router = make_confirmations_router(
    get_session_dep=get_session,
    jwt_port=container.jwt,
)

app.include_router(confirmations_router)

@measure_stage("request_validation")
async def _validate_graph_chat(req: "GraphChatRequest"):
    return True

@measure_stage("agent_invoke")
async def _invoke_agent(agent, message: str, thread_id: str):
    return await agent.invoke(message, thread_id=thread_id)

@measure_stage("response_presentation")
async def _present_reply(reply: str, thread_id: str):
    return {"reply": reply, "thread_id": thread_id}

@app.get("/api/health")
async def health():
    return {"ok": True}

@app.get("/api/observability/telegram/analyze")
async def analyze_telegram_performance(hours: int = 24):
    """Analiza el rendimiento de Telegram de las últimas N horas"""
    try:
        from app.observability.telegram_analyzer import log_telegram_analysis
        analysis = log_telegram_analysis(hours)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/observability/telegram/summary")
async def telegram_performance_summary():
    """Obtiene un resumen de performance de Telegram (+�ltima hora + 24h)"""
    try:
        from app.observability.telegram_analyzer import log_performance_summary
        summary = log_performance_summary()
        return {"success": True, "summary": summary}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/health/db")
async def health_db(session = Depends(get_session)):
    """Health check que verifica la conexión a la base de datos"""
    try:
        from sqlalchemy import text
        await session.execute(text("SELECT 1"))
        return {"db": "ok", "status": "healthy"}
    except Exception as e:
        return {"db": "error", "status": "unhealthy", "error": str(e)}

graph_router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class GraphChatRequest(BaseModel):
    message: str
    thread_id: str = "default-thread"

limiter = make_simple_limiter(container.cache, limit=100, window_sec=60)

@graph_router.post("/chat", dependencies=[Depends(limiter)])
async def graph_chat(req: GraphChatRequest, request: Request):
    if not container.graph_agent:
        raise HTTPException(status_code=503, detail="LangGraph agent no disponible")

    set_meta(
        endpoint="/assistant/chat",
        thread_id=req.thread_id,
        model=getattr(container.graph_agent, "_model_name", None),
        user_id=(getattr(getattr(request, "state", None), "user", {}) or {}).get("sub"),
        client_ip=(request.client.host if request.client else None),
    )

    await _validate_graph_chat(req)

    async with astage("agent.invoke"):
        reply = await container.graph_agent.invoke(req.message, thread_id=req.thread_id)

    return {"reply": reply, "thread_id": req.thread_id}

@graph_router.get("/debug/confirm/{thread_id}")
async def debug_confirm(thread_id: str):
    key = confirm_store.key_for(thread_id)
    raw = await redis_client.get(key)
    ttl = None
    try:
        ttl = await redis_client.ttl(key)
    except Exception:
        pass
    val = raw.decode("utf-8", "ignore") if isinstance(raw, (bytes, bytearray)) else raw
    return {"key": key, "exists": raw is not None, "ttl": ttl, "value": val}

advisor_catalog_router = make_advisor_catalog_router(get_session_dep=get_session,jwt_port=container.jwt,)

app.include_router(advisor_catalog_router)
app.include_router(auth_router)
app.include_router(graph_router)

asesorias_router = make_asesorias_router(
    get_session_dep=get_session,
    jwt_port=container.jwt,
)
app.include_router(asesorias_router)

def _make_telegram_router():
    return make_telegram_router(
        cache=container.cache,
        agent_getter=lambda: container.graph_agent,
        mcp_client_getter=lambda: container.db_mcp,
        confirm_store_getter=lambda: confirm_store,
    )


telegram_router = _make_telegram_router()
app.telegram_router = telegram_router
app.include_router(telegram_router)

telegram_link_router = make_telegram_link_router(
    require_auth=require_auth,
    cache=container.cache,     
    get_session_dep=get_session,   
)
app.include_router(telegram_link_router)
admin_catalog_router = make_admin_catalog_router(
    get_session_dep=get_session,
    jwt_port=container.jwt)  
app.include_router(admin_catalog_router)  

admin_location_router = make_admin_location_router(get_session_dep=get_session)
app.include_router(admin_location_router)

admin_advisors_router = make_admin_advisors_router(
    get_session_dep=get_session,
    jwt_port=container.jwt
)
app.include_router(admin_advisors_router)



admin_teachers_router = make_admin_teachers_router(
    get_session_dep=get_session,
    jwt_port=container.jwt
)
app.include_router(admin_teachers_router)

profile_router = make_profile_router(
    get_session_dep=get_session,
    jwt_port=container.jwt,
)
app.include_router(profile_router, dependencies=[Depends(require_auth)])

app.include_router(dashboard_router, dependencies=[Depends(require_auth)])

app.include_router(semantic_router, tags=["semantic"])

calendar_router = make_calendar_router(
    get_session_dep=get_session,
    jwt_port=container.jwt,
    cache=container.cache,
    webhook_public_url=WEBHOOK_PUBLIC_URL
)
app.include_router(calendar_router)


def _make_google_calendar_webhook_router():
    return make_google_calendar_webhook_router(
        get_session_dep=get_session,
        cache=container.cache,
        cal_client_factory=_build_calendar_client,
    )


google_webhook_router = _make_google_calendar_webhook_router()

app.include_router(google_webhook_router)

webhook_app = FastAPI(
    title="CINAP Webhooks",
    debug=API_DEBUG,
    lifespan=make_lifespan(
        start_scheduler=False,
        auto_configure_google=False,
        configure_telegram=True,
    ),
)

webhook_app.add_middleware(JSONTimingMiddleware)

webhook_telegram_router = _make_telegram_router()
webhook_app.telegram_router = webhook_telegram_router
webhook_app.include_router(webhook_telegram_router)
webhook_app.include_router(_make_google_calendar_webhook_router())

@webhook_app.get("/api/health")
async def webhook_health():
    return {"ok": True}

teacher_confirmations_router = make_teacher_confirmations_router(
    get_session_dep=get_session,
    jwt_port=container.jwt,
)
app.include_router(teacher_confirmations_router)

@scheduler.scheduled_job("cron", hour=22, minute=00)
async def cron_sweep_due_slots_and_close_asesorias_daily():
    async with AsyncSessionLocal() as session:
        repo = SqlAlchemySlotsRepo(session)
        res = await repo.sweep_cupos_vencidos(batch=5000)
        await session.commit()
