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
    API_DEBUG, CORS_ORIGINS,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
    JWT_SECRET, JWT_ISSUER, JWT_MINUTES, FRONTEND_ORIGIN, TEACHER_ROLE_ID,
    MCP_COMMAND, MCP_ARGS, MCP_CWD,
)
from app.frameworks_drivers.config.db import get_session
from app.frameworks_drivers.di.container import Container
from app.frameworks_drivers.web.rate_limit import make_simple_limiter
from app.interface_adapters.controllers.auth_router_factory import make_auth_router
from app.interface_adapters.controllers.slots_router import make_slots_router
from app.interface_adapters.controllers.advisor_catalog_router import (make_advisor_catalog_router)
from app.interface_adapters.controllers.advisor_confirmations_router import make_confirmations_router
from app.interface_adapters.controllers.asesorias_router import make_asesorias_router
from app.interface_adapters.controllers.telegram_webhook import make_telegram_router
from app.interface_adapters.controllers.telegram_link_router import make_telegram_link_router
from app.interface_adapters.controllers.admin_catalog_router import make_admin_catalog_router  
from app.interface_adapters.controllers.admin_location_router import make_admin_location_router

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await container.startup()

        if getattr(container, "graph_agent", None) and hasattr(container.graph_agent, "set_confirm_store"):
            container.graph_agent.set_confirm_store(confirm_store)

        yield
    finally:
        try:
            await container.shutdown()
        except Exception:
            pass

app = FastAPI(title="MCP Assistant", debug=API_DEBUG, lifespan=lifespan)

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
    jwt_secret=JWT_SECRET,
    jwt_issuer=JWT_ISSUER,
    jwt_minutes=JWT_MINUTES,
    teacher_role_id=TEACHER_ROLE_ID,
    mcp_command=MCP_COMMAND,
    mcp_args=MCP_ARGS,
    mcp_cwd=MCP_CWD,
)

redis_client: Redis = container.cache
confirm_store = ConfirmStore(redis_client, prefix="preview:", ttl_sec=600)

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

@app.get("/health")
async def health():
    return {"ok": True}

@app.get("/health/db")
async def health_db(session = Depends(get_session)):
    """Health check que verifica la conexión a la base de datos"""
    try:
        from sqlalchemy import text
        await session.execute(text("SELECT 1"))
        return {"db": "ok", "status": "healthy"}
    except Exception as e:
        return {"db": "error", "status": "unhealthy", "error": str(e)}

@app.get("/health/db")
async def health_db(session = Depends(get_session)):
    """Health check que verifica la conexión a la base de datos"""
    try:
        from sqlalchemy import text
        await session.execute(text("SELECT 1"))
        return {"db": "ok", "status": "healthy"}
    except Exception as e:
        return {"db": "error", "status": "unhealthy", "error": str(e)}

graph_router = APIRouter(prefix="/assistant", tags=["assistant"])

class GraphChatRequest(BaseModel):
    message: str
    thread_id: str = "default-thread"

limiter = make_simple_limiter(container.cache, limit=10, window_sec=60)

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

telegram_router = make_telegram_router(
    cache=container.cache,
    agent_getter=lambda: container.graph_agent,
)
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
