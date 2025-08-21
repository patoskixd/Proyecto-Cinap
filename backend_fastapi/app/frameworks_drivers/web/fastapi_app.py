from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.frameworks_drivers.config.settings import API_DEBUG, CORS_ORIGINS
from app.frameworks_drivers.di.container import container, startup, shutdown
from app.interface_adapters.controllers.assistant_controller import AssistantController
from app.interface_adapters.presenters.assistant_presenter import AssistantPresenter

app = FastAPI(title="MCP Assistant", debug=API_DEBUG)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(router)

@app.on_event("startup")
async def _startup(): await startup(app)

@app.on_event("shutdown")
async def _shutdown(): await shutdown(app)
