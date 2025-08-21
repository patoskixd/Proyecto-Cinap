from fastapi import FastAPI
from app.frameworks_drivers.config.settings import OLLAMA_URL, MODEL, LLM_TIMEOUT, MCP_COMMAND, MCP_ARGS, MCP_CWD
from app.frameworks_drivers.llm.ollama_client import OllamaClient
from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient
from app.use_cases.orchestrate_chat.interactor import OrchestrateChatInteractor

class Container:
    llm: OllamaClient | None = None
    mcp: MCPStdioClient | None = None
    orchestrate: OrchestrateChatInteractor | None = None

container = Container()

async def startup(_: FastAPI):
    container.llm = OllamaClient(OLLAMA_URL, MODEL, LLM_TIMEOUT)
    container.mcp = MCPStdioClient(MCP_COMMAND, MCP_ARGS, MCP_CWD)
    await container.mcp.connect()
    container.orchestrate = OrchestrateChatInteractor(container.llm, container.mcp)

async def shutdown(_: FastAPI):
    if container.mcp:
        await container.mcp.close()