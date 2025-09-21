from __future__ import annotations
import uuid
import asyncio
from typing import Union
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import from_url as redis_from_url
from app.use_cases.auth.google_callback import GoogleCallbackUseCase
from app.use_cases.auth.logout import LogoutUseCase
from app.interface_adapters.gateways.oauth.google_oauth_client import GoogleOAuthClient
from app.interface_adapters.gateways.token.jwt_service import PyJWTService
from app.interface_adapters.gateways.db.sqlalchemy_user_repo import SqlAlchemyUserRepo
from app.interface_adapters.gateways.cache.redis_cache import RedisCache
from app.frameworks_drivers.config.settings import REDIS_URL
from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient
from app.frameworks_drivers.llm.langgraph_agent import LangGraphAgent
from app.frameworks_drivers.config.settings import (
    VLLM_BASE_URL, VLLM_API_KEY, LLM_MODEL, LLM_TEMP, LLM_TOP_P,
)

class Container:
    oauth: GoogleOAuthClient
    jwt: PyJWTService

    mcp: MCPStdioClient | None
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

        mcp_command: str = "node",
        mcp_args: str = "index.js",
        mcp_cwd: str = ".",
        llm_model_name: str = "Qwen/Qwen3-4B",
        langgraph_db_path: str = "checkpoints.db",
    ):
        self._google_redirect_uri = google_redirect_uri
        self._jwt_minutes = int(jwt_minutes)
        self._default_role_id = uuid.UUID(str(teacher_role_id))

        self.oauth = GoogleOAuthClient(
            client_id=google_client_id,
            client_secret=google_client_secret,
            scope="openid email profile https://www.googleapis.com/auth/calendar",
        )
        self.jwt = PyJWTService(secret=jwt_secret, issuer=jwt_issuer, minutes=int(jwt_minutes))
        

        self.mcp = MCPStdioClient(mcp_command, mcp_args, mcp_cwd)
        self.graph_agent = None
        self.main_loop = None
        self._llm_model_name = llm_model_name or LLM_MODEL
        self._langgraph_db_path = langgraph_db_path
        self.redis = redis_from_url(REDIS_URL, decode_responses=False)
        self.cache = RedisCache(self.redis)

    def uc_google_callback(self, session: AsyncSession) -> GoogleCallbackUseCase:
        user_repo = SqlAlchemyUserRepo(session, default_role_id=self._default_role_id)

        from datetime import datetime, timezone

        class _Clock:
            def now_utc(self):
                return datetime.now(timezone.utc)

        return GoogleCallbackUseCase(
            user_repo=user_repo,
            oauth=self.oauth,
            jwt=self.jwt,
            clock=_Clock(),
            redirect_uri=self._google_redirect_uri,
            jwt_minutes=self._jwt_minutes,
        )

    async def startup(self):
        self.main_loop = asyncio.get_running_loop()
        await self.mcp.connect()
        self.graph_agent = LangGraphAgent(
            self.mcp,
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

    async def shutdown(self):
        if self.mcp:
            await self.mcp.close()
        if self.redis:
            await self.redis.close()

    def uc_logout(self, session: AsyncSession) -> LogoutUseCase:
        repo = SqlAlchemyUserRepo(session, default_role_id=self._default_role_id)  
        return LogoutUseCase(user_repo=repo)