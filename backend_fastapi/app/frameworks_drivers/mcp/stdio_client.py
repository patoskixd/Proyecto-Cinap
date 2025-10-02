from contextlib import suppress
import os, shlex
import json
from typing import Any, Dict, List
import anyio
from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters
from app.use_cases.ports.mcp_port import MCPPort

from app.observability.metrics import astage

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
        async with astage("mcp.connect"):
            server = StdioServerParameters(command=self._command, args=self._args, cwd=self._cwd, env=self._env)
            self._stdio_ctx = stdio_client(server)
            read, write = await self._stdio_ctx.__aenter__()
            self._session_ctx = ClientSession(read, write)
            self.session = await self._session_ctx.__aenter__()
            await self.session.initialize()

    async def list_tools_openai_schema(self) -> List[Dict[str, Any]]:
        assert self.session is not None
        async with astage("mcp.list_tools"):
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

        async with astage("mcp.serialize", extra={"tool": name}):
            try:
                preview = {"name": name, "args": args}
                approx_bytes = len(json.dumps(preview, ensure_ascii=False).encode("utf-8"))
            except Exception:
                approx_bytes = None

        async with astage("mcp.rpc", extra={"tool": name, "bytes": approx_bytes}):
            result = await self.session.call_tool(name, args)
            r = result.model_dump()

        async with astage("mcp.deserialize", extra={"tool": name}):
            sc = r.get("structuredContent")
            if isinstance(sc, dict) and isinstance(sc.get("result"), dict):
                return sc["result"]

            for c in r.get("content", []) or []:
                if isinstance(c, dict) and c.get("type") == "text":
                    t = c.get("text")
                    if isinstance(t, str):
                        try:
                            obj = json.loads(t)
                            if isinstance(obj, dict) and ("ok" in obj or "error" in obj):
                                return obj
                        except Exception:
                            pass

            return r

    async def close(self):
        if self._session_ctx:
            with anyio.CancelScope(shield=True):
                with suppress(Exception):
                    if getattr(self.session, "shutdown", None):
                        await self.session.shutdown()
                    elif getattr(self.session, "close", None):
                        await self.session.close()

                with suppress(GeneratorExit, RuntimeError, Exception):
                    await self._session_ctx.__aexit__(None, None, None)

            self._session_ctx = None
            self.session = None

        if self._stdio_ctx:
            with anyio.CancelScope(shield=True):
                with suppress(GeneratorExit, RuntimeError, Exception):
                    await self._stdio_ctx.__aexit__(None, None, None)

            self._stdio_ctx = None
