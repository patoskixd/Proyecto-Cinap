import os, shlex
from typing import Any, Dict, List
from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters
from app.use_cases.ports.mcp_port import MCPPort

class MCPStdioClient(MCPPort):
    def __init__(self, command: str, args: str, cwd: str | None = None, env: dict | None = None):
        self._command = command
        self._args = shlex.split(args) if isinstance(args, str) else args
        self._cwd = cwd
        self._env = env or os.environ.copy()
        self._stdio_ctx = None
        self._session_ctx = None
        self.session: ClientSession | None = None

    async def connect(self):
        server = StdioServerParameters(command=self._command, args=self._args, cwd=self._cwd, env=self._env)
        self._stdio_ctx = stdio_client(server)
        read, write = await self._stdio_ctx.__aenter__()
        self._session_ctx = ClientSession(read, write)
        self.session = await self._session_ctx.__aenter__()
        await self.session.initialize()

    async def list_tools_openai_schema(self) -> List[Dict[str, Any]]:
        assert self.session is not None
        resp = await self.session.list_tools()
        return [{
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description or "",
                "parameters": t.inputSchema or {"type":"object","properties":{}}
            }
        } for t in resp.tools]

    async def call_tool(self, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        assert self.session is not None
        result = await self.session.call_tool(name, args)
        return result.model_dump()

    async def close(self):
        if self._session_ctx:
            await self._session_ctx.__aexit__(None, None, None)
            self._session_ctx = None
            self.session = None
        if self._stdio_ctx:
            await self._stdio_ctx.__aexit__(None, None, None)
            self._stdio_ctx = None

# Solo asegúrate que MCP tenga la herramienta event_create y esté conectado a Google Calendar.