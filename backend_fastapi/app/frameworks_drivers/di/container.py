from fastapi import FastAPI
import asyncio
from app.frameworks_drivers.config.settings import OLLAMA_URL, MODEL, LLM_TIMEOUT, MCP_COMMAND, MCP_ARGS, MCP_CWD
from app.frameworks_drivers.llm.ollama_client import OllamaClient
from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient
from app.use_cases.orchestrate_chat.interactor import OrchestrateChatInteractor
from app.frameworks_drivers.llm.langgraph_agent import LangGraphAgent

class Container:
    llm = None
    mcp = None
    orchestrate = None
    graph_agent: LangGraphAgent | None = None
    main_loop: asyncio.AbstractEventLoop | None = None

container = Container()

async def startup(_: FastAPI):
    container.main_loop = asyncio.get_running_loop()

    container.llm = OllamaClient(OLLAMA_URL, MODEL, LLM_TIMEOUT)
    container.mcp = MCPStdioClient(MCP_COMMAND, MCP_ARGS, MCP_CWD)
    await container.mcp.connect()

    container.orchestrate = OrchestrateChatInteractor(container.llm, container.mcp)

    container.graph_agent = LangGraphAgent(
        container.mcp,
        model_name="qwen3:4b",
        db_path="checkpoints.db",
        main_loop=container.main_loop,
    )
    await container.graph_agent.startup()

async def shutdown(_: FastAPI):
    if container.mcp:
        await container.mcp.close()
