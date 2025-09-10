from __future__ import annotations

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt

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

app = FastAPI(title="MCP Assistant", debug=API_DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
async def health():
    return {"ok": True}

graph_router = APIRouter(prefix="/assistant", tags=["assistant"])

class GraphChatRequest(BaseModel):
    message: str
    thread_id: str = "default-thread"

limiter = make_simple_limiter(container.cache, limit=10, window_sec=60)

@graph_router.post("/chat", dependencies=[Depends(limiter)])
async def graph_chat(req: GraphChatRequest):
    if not container.graph_agent:
        raise HTTPException(status_code=503, detail="LangGraph agent no disponible")
    reply = await container.graph_agent.invoke(req.message, thread_id=req.thread_id)
    return {"reply": reply, "thread_id": req.thread_id}

app.include_router(auth_router)
app.include_router(graph_router)

@app.on_event("startup")
async def _startup():
    await container.startup()

@app.on_event("shutdown")
async def _shutdown():
    await container.shutdown()
