from __future__ import annotations

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt

from app.frameworks_drivers.config.settings import API_DEBUG, CORS_ORIGINS, JWT_SECRET
from app.frameworks_drivers.di.container import container, startup, shutdown

# Routers propios
from app.interface_adapters.controllers.assistant_controller import AssistantController
from app.interface_adapters.presenters.assistant_presenter import AssistantPresenter
from app.interface_adapters.controllers.auth_controller import router as auth_router

# --------- Dependencia para exigir autenticación en APIs protegidas ---------
# (La dejamos por si quieres proteger otros routers; NO se usa en /assistant)
def require_auth(request: Request):
    token = request.cookies.get("app_session")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        request.state.user = data  # opcional
        return data
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# --------- App principal ----------
app = FastAPI(title="MCP Assistant", debug=API_DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,     # necesario si en algún momento envías cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Healthcheck simple (público) ----
@app.get("/health")
async def health():
    return {"ok": True}

# ---- Assistant (PÚBLICO) ----
# 👇 Quitamos dependencies=[Depends(require_auth)] para que el chat quede abierto
router = APIRouter(prefix="/assistant", tags=["assistant"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(req: ChatRequest):
    if not container.orchestrate:
        raise HTTPException(status_code=503, detail="Interactor no disponible")
    controller = AssistantController(container.orchestrate, AssistantPresenter())
    vm = await controller.chat(req.message)
    return vm

# Montaje de routers
app.include_router(router)       # /assistant/*
app.include_router(auth_router)  # /auth/*  (público para login/callback/logout/me)

# Hooks de ciclo de vida
@app.on_event("startup")
async def _startup():
    await startup(app)

@app.on_event("shutdown")
async def _shutdown():
    await shutdown(app)
