from __future__ import annotations
from contextlib import suppress
import logging
import uuid
import asyncio
from typing import Union
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import from_url as redis_from_url
from app.use_cases.auth.google_callback import GoogleCallbackUseCase
from app.use_cases.auth.logout import LogoutUseCase
from app.use_cases.auth.ensure_docente_profile import EnsureDocenteProfileUseCase
from app.interface_adapters.gateways.oauth.google_oauth_client import GoogleOAuthClient
from app.interface_adapters.gateways.token.jwt_service import PyJWTService
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.gateways.db.sqlalchemy_docente_repo import SqlAlchemyDocentePerfilRepo
from app.interface_adapters.gateways.db.sqlalchemy_asesor_repo import SqlAlchemyAsesorRepo
from app.interface_adapters.gateways.cache.redis_cache import RedisCache
from app.interface_adapters.gateways.calendar.google_calendar_client import GoogleCalendarClient
from app.interface_adapters.gateways.db.sqlalchemy_calendar_events_repo import SqlAlchemyCalendarEventsRepo
from app.use_cases.calendar.auto_configure_webhook import AutoConfigureWebhook
from app.frameworks_drivers.config.settings import REDIS_URL
from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient
from app.frameworks_drivers.llm.langgraph_agent import LangGraphAgent
from app.frameworks_drivers.config.settings import (
    VLLM_BASE_URL, VLLM_API_KEY, LLM_MODEL, LLM_TEMP, LLM_TOP_P, MCP_CAL_COMMAND, MCP_CAL_ARGS, MCP_CAL_CWD
)

logger = logging.getLogger(__name__)

class Container:
    oauth: GoogleOAuthClient
    jwt: PyJWTService

    db_mcp: MCPStdioClient | None
    cal_mcp: MCPStdioClient | None
    graph_agent: LangGraphAgent | None
    main_loop: asyncio.AbstractEventLoop | None

    _google_redirect_uri: str
    _jwt_minutes: int
    _default_role_id: uuid.UUID

    def __init__(
        self,
        *,
        google_client_id: str,
        google_client_secret: str,
        google_redirect_uri: str,
        jwt_secret: str,
        jwt_issuer: str,
        jwt_minutes: int,
        teacher_role_id: Union[str, uuid.UUID],
        webhook_public_url: str = "https://ebd68f37e9a7.ngrok-free.app",

        mcp_command: str = "node",
        mcp_args: str = "index.js",
        mcp_cwd: str = ".",
        cal_mcp_command: str | None = None,
        cal_mcp_args: str | None = None,
        cal_mcp_cwd: str | None = None,
        llm_model_name: str = "Qwen/Qwen3-4B",
        langgraph_db_path: str = "checkpoints.db",
    ):
        self._google_redirect_uri = google_redirect_uri
        self._jwt_minutes = int(jwt_minutes)
        self._default_role_id = uuid.UUID(str(teacher_role_id))
        self._webhook_public_url = webhook_public_url
        self._google_client_id = google_client_id
        self._google_client_secret = google_client_secret

        self.oauth = GoogleOAuthClient(
            client_id=google_client_id,
            client_secret=google_client_secret,
            scope="openid email profile https://www.googleapis.com/auth/calendar",
        )
        self.jwt = PyJWTService(secret=jwt_secret, issuer=jwt_issuer, minutes=int(jwt_minutes))
        

        self.db_mcp = MCPStdioClient(mcp_command, mcp_args, mcp_cwd)
        self.cal_mcp = MCPStdioClient(
            cal_mcp_command or MCP_CAL_COMMAND,
            cal_mcp_args or MCP_CAL_ARGS,
            cal_mcp_cwd or MCP_CAL_CWD,
        )
        self.graph_agent = None
        self.main_loop = None
        self._llm_model_name = llm_model_name or LLM_MODEL
        self._langgraph_db_path = langgraph_db_path
        self.redis = redis_from_url(REDIS_URL, decode_responses=False)
        self.cache = RedisCache(self.redis)

    def uc_google_callback(self, session: AsyncSession) -> GoogleCallbackUseCase:
        user_repo = SqlAlchemyUserRepo(session, default_role_id=self._default_role_id)
        docente_repo = SqlAlchemyDocentePerfilRepo(session)

        from datetime import datetime, timezone

        class _Clock:
            def now_utc(self):
                return datetime.now(timezone.utc)

        ensure_docente_profile_uc = EnsureDocenteProfileUseCase(
            docente_repo=docente_repo,
            user_repo=user_repo,
            profesor_role_name="Profesor"
        )

        auto_configure_webhook = self.make_auto_configure_webhook(session)

        return GoogleCallbackUseCase(
            user_repo=user_repo,
            oauth=self.oauth,
            jwt=self.jwt,
            clock=_Clock(),
            redirect_uri=self._google_redirect_uri,
            jwt_minutes=self._jwt_minutes,
            ensure_docente_profile_uc=ensure_docente_profile_uc,
            session=session,
            auto_configure_webhook=auto_configure_webhook
        )

    async def startup(self):
        self.main_loop = asyncio.get_running_loop()
        await self.db_mcp.connect()
        await self.cal_mcp.connect()
        self.graph_agent = LangGraphAgent(
            mcps={"db": self.db_mcp, "cal": self.cal_mcp},
            model_name=self._llm_model_name,
            db_path=self._langgraph_db_path,
            main_loop=self.main_loop,
        )
        self.graph_agent.configure_openai(
            base_url=VLLM_BASE_URL,
            api_key=VLLM_API_KEY,
            temperature=LLM_TEMP,
            top_p=LLM_TOP_P,
        )
        await self.graph_agent.startup()

    async def shutdown(self) -> None:
        tasks = []

        if self.db_mcp:
            tasks.append(self.db_mcp.close())
        if self.cal_mcp:
            tasks.append(self.cal_mcp.close())
        if self.redis:
            tasks.append(self.redis.close())

        for t in tasks:
            with suppress(asyncio.CancelledError):
                try:
                    await asyncio.wait_for(t, timeout=2.0)
                except asyncio.TimeoutError:
                    logger.warning("Timeout cerrando recurso: %r", t)
                except Exception:
                    logger.exception("Error cerrando recurso: %r", t)

    def uc_logout(self, session: AsyncSession) -> LogoutUseCase:
        repo = SqlAlchemyUserRepo(session, default_role_id=self._default_role_id)  
        return LogoutUseCase(user_repo=repo)

    def make_auto_configure_webhook(self, session: AsyncSession) -> AutoConfigureWebhook:
        """Crea una instancia de AutoConfigureWebhook con todas las dependencias"""
        cal_client = GoogleCalendarClient(
            client_id=self._google_client_id,
            client_secret=self._google_client_secret,
            get_refresh_token_by_usuario_id=lambda usuario_id: 
                SqlAlchemyUserRepo(session, default_role_id=None).get_refresh_token_by_usuario_id(usuario_id)
        )
        
        calendar_events_repo = SqlAlchemyCalendarEventsRepo(session, cache=self.cache)
        
        return AutoConfigureWebhook(
            cal=cal_client,
            repo=calendar_events_repo,
            webhook_public_url=self._webhook_public_url
        )