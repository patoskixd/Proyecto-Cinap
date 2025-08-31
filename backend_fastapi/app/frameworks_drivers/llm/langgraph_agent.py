from __future__ import annotations
import json, sqlite3, asyncio, re
from typing import Any, Dict, List
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain.tools import StructuredTool
from pydantic import BaseModel, create_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient

_TOOL_JSON_RE = re.compile(
    r"^\s*```(?:json)?\s*\{.*?(?:\"name\"|\"function\")\s*:\s*\"[^\"]+\".*?(?:\"arguments\"|\"parameters\")\s*:\s*\{.*?\}\s*\}\s*```"
    r"|^\s*\{.*?(?:\"name\"|\"function\")\s*:\s*\"[^\"]+\".*?(?:\"arguments\"|\"parameters\")\s*:\s*\{.*?\}\s*\}\s*$",
    re.DOTALL | re.IGNORECASE,
)

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)

def _normalize_event_update_args(kwargs: dict) -> dict:
    if not isinstance(kwargs, dict):
        return kwargs

    out = dict(kwargs)

    if "selector" not in out and any(k in out for k in ("event_id", "title", "from", "to", "start_from", "end_to", "calendar_id")):
        sel = {}
        if "event_id" in out: sel["event_id"] = out.pop("event_id")
        if "id" in out: sel["event_id"] = out.pop("id")
        if "eventId" in out: sel["event_id"] = out.pop("eventId")
        if "title" in out: sel["title"] = out.pop("title")
        sf = out.pop("start_from", None) or out.pop("selector_start_from", None) or out.pop("from", None) or out.pop("time_min", None)
        et = out.pop("end_to", None) or out.pop("selector_end_to", None) or out.pop("to", None) or out.pop("time_max", None)
        if sf is not None: sel["start_from"] = sf
        if et is not None: sel["end_to"] = et
        if "calendar_id" in out: sel["calendar_id"] = out.pop("calendar_id")
        out["selector"] = sel

    if "patch" not in out and any(k in out for k in ("title","summary","start","end","attendees","location","description","shift_days","shift_minutes","new_date","new_start_time","new_end_time","keep_duration")):
        pat = {}
        if "summary" in out: pat["title"] = out.pop("summary")
        for k in ("title","start","end","attendees","location","description","shift_days","shift_minutes","new_date","new_start_time","new_end_time","keep_duration"):
            if k in out: pat[k] = out.pop(k)
        out["patch"] = pat

    sel = out.get("selector")
    if isinstance(sel, dict):
        if "eventId" in sel: sel["event_id"] = sel.pop("eventId")
        if "id" in sel and "event_id" not in sel: sel["event_id"] = sel.pop("id")
        if "from" in sel and "start_from" not in sel: sel["start_from"] = sel.pop("from")
        if "to" in sel and "end_to" not in sel: sel["end_to"] = sel.pop("to")
        if "time_min" in sel and "start_from" not in sel: sel["start_from"] = sel.pop("time_min")
        if "time_max" in sel and "end_to" not in sel: sel["end_to"] = sel.pop("time_max")

    pat = out.get("patch")
    if isinstance(pat, dict):
        if "summary" in pat and "title" not in pat: pat["title"] = pat.pop("summary")

    return out

def _normalize_event_delete_by_title_args(kwargs: dict) -> dict:
    if not isinstance(kwargs, dict):
        return kwargs
    out = dict(kwargs)

    if "title" in out and any(k in out for k in ("from","to","start_from","end_to","time_min","time_max","desc","description","description_contains","calendar_id")):
        pass

    if "from" in out and "start_from" not in out:
        out["start_from"] = out.pop("from")
    if "to" in out and "end_to" not in out:
        out["end_to"] = out.pop("to")
    if "time_min" in out and "start_from" not in out:
        out["start_from"] = out.pop("time_min")
    if "time_max" in out and "end_to" not in out:
        out["end_to"] = out.pop("time_max")

    if "desc" in out and "description_contains" not in out:
        out["description_contains"] = out.pop("desc")
    if "description" in out and "description_contains" not in out:
        out["description_contains"] = out.pop("description")

    return out

def _strip_think(text: str | None) -> str:
    if not isinstance(text, str):
        return ""
    return _THINK_RE.sub("", text).strip()

def _strip_code_fences(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    return s.strip()

def _fmt_event_line(ev: dict) -> str:
    t = ev.get("title") or "(sin título)"
    s = str(ev.get("start") or "")
    e = str(ev.get("end") or "")
    return f"{t} — {s}–{e}"

def _render_numbered(items: list[dict], limit: int = 10) -> str:
    shown = items[:limit]
    lines = [f"{idx+1}) {_fmt_event_line(ev)}" for idx, ev in enumerate(shown)]
    if len(items) > limit:
        lines.append(f"... y {len(items)-limit} más")
    return "\n".join(lines)

def _format_mcp_result(res: dict, tool_name: str) -> str:
    if isinstance(res, dict) and res.get("ok"):
        data = res.get("data") or {}
        items = data.get("items") or data.get("events")
        if isinstance(items, list) and items:
            header = res.get("say") or f"{len(items)} evento(s) encontrados."
            return header + "\n" + _render_numbered(items)
        ev = data.get("event")
        if isinstance(ev, dict):
            line = _fmt_event_line(ev)
            return f"{res.get('say')}\n{line}" if res.get("say") else line
        if res.get("say"):
            return str(res["say"])
        return "Operación completada."

    if isinstance(res, dict) and isinstance(res.get("error"), dict):
        err = res["error"]; code = str(err.get("code","ERROR")); msg = str(err.get("message",""))
        if code == "AMBIGUOUS_MATCH":
            cands = (err.get("extra") or {}).get("candidates") or []
            if isinstance(cands, list) and cands:
                def _fmt_with_id(ev: dict) -> str:
                    return f"{ev.get('title','(sin título)')} — {ev.get('start','')}–{ev.get('end','')} (id: {ev.get('id','')})"
                lines = [f"{idx+1}) {_fmt_with_id(ev)}" for idx, ev in enumerate(cands)]
                return "Hay múltiples coincidencias:\n" + "\n".join(lines) + "\n\nIndica el número o el id."
        if code == "EVENT_NOT_FOUND":
            return "No encontré ese evento en el rango indicado. ¿Probamos con otro rango o título?"
        return f"Ocurrió un error ({code}). {msg}".strip()

    try:
        return f"[{tool_name}] resultado no estándar: " + json.dumps(res, ensure_ascii=False)[:1200]
    except Exception:
        return f"[{tool_name}] resultado no estándar (no JSON serializable)."

def _looks_like_tool_json(s: str) -> bool:
    return bool(_TOOL_JSON_RE.match(s or ""))

def _pydantic_model_from_json_schema(name: str, schema: Dict[str, Any]) -> type[BaseModel]:
    props = schema.get("properties", {}) if isinstance(schema, dict) else {}
    required = set(schema.get("required", [])) if isinstance(schema, dict) else set()
    fields: Dict[str, tuple[Any, Any]] = {}

    def py_type_from_schema(s: Dict[str, Any]) -> Any:
        t = s.get("type")
        if t == "string":
            return str
        if t == "integer":
            return int
        if t == "number":
            return float
        if t == "boolean":
            return bool
        if t == "object":
            return Dict[str, Any]
        if t == "array":
            items = s.get("items", {}) if isinstance(s.get("items"), dict) else {}
            it = items.get("type")
            if it == "string":
                return List[str]
            if it == "integer":
                return List[int]
            if it == "number":
                return List[float]
            if it == "boolean":
                return List[bool]
            if it == "object":
                return List[Dict[str, Any]]
            return List[Any]
        return Any

    for key, spec in props.items():
        py_t = py_type_from_schema(spec if isinstance(spec, dict) else {})
        default = ... if key in required else None
        fields[key] = (py_t, default)

    if not fields:
        return create_model(name)

    return create_model(name, **fields)

def _parse_tool_json(s: str) -> tuple[str, dict] | None:
    try:
        raw = _strip_code_fences(s)
        obj = json.loads(raw)
        name = obj.get("name") or obj.get("function")
        args = obj.get("arguments") or obj.get("parameters") or {}
        if isinstance(name, str) and isinstance(args, dict):
            return name, args
    except Exception:
        pass
    return None

class LangGraphRunner:
    def __init__(self, app, system_text: str | None = None):
        self._app = app
        self._system_text = system_text or None

    async def invoke(self, message: str, *, thread_id: str) -> str:
        def _run():
            msgs = []
            if self._system_text:
                msgs.append(SystemMessage(content=self._system_text))
            msgs.append(HumanMessage(content=message))
            res = self._app.invoke(
                {"messages": msgs},
                config={"configurable": {"thread_id": thread_id}},
            )
            out = res.get("messages", [])
            return _strip_think(out[-1].content if out else "")
        return await asyncio.to_thread(_run)

class LangGraphAgent:
    def __init__(self, mcp: MCPStdioClient, *, model_name: str, db_path: str, main_loop: asyncio.AbstractEventLoop):
        self._mcp = mcp
        self._model_name = model_name
        self._db_path = db_path
        self._runner: LangGraphRunner | None = None
        self._main_loop = main_loop

    def _make_tool(self, name: str, description: str, ModelIn: type[BaseModel]) -> StructuredTool:
        async def caller_async(**kwargs) -> str:
            if name == "event_delete_by_title":
                kwargs = _normalize_event_delete_by_title_args(kwargs)
            if name == "event_update":
                kwargs = _normalize_event_update_args(kwargs)

            res = await self._mcp.call_tool(name, kwargs)
            return _format_mcp_result(res, name)

        def caller_sync(**kwargs) -> str:
            fut = asyncio.run_coroutine_threadsafe(caller_async(**kwargs), self._main_loop)
            return fut.result()

        return StructuredTool.from_function(
            name=name,
            description=description or f"Tool {name}",
            func=caller_sync,
            coroutine=caller_async,
            args_schema=ModelIn,
            return_direct=True,
        )

    async def _build_tools_from_mcp(self) -> list[StructuredTool]:
        specs = await self._mcp.list_tools_openai_schema()
        tools: list[StructuredTool] = []

        for spec in specs:
            fn = spec.get("function", {}) or {}
            name = str(fn.get("name") or "")
            if not name:
                continue
            schema = fn.get("parameters") or {"type": "object", "properties": {}}
            ModelIn = _pydantic_model_from_json_schema(f"{name}_Input", schema)
            tools.append(self._make_tool(name, fn.get("description") or "", ModelIn))

        return tools

    async def startup(self):
        llm = ChatOllama(model=self._model_name)
        tools = await self._build_tools_from_mcp()
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        checkpointer = SqliteSaver(conn)
        app_or_graph = create_react_agent(llm, tools, checkpointer=checkpointer)
        app = app_or_graph.compile(checkpointer=checkpointer) if hasattr(app_or_graph, "compile") else app_or_graph
        sys_text = (
        "Eres un asistente que usa herramientas. "
        "El Timezone es America/Santiago. "
        "No devuelvas JSON con {name, arguments}. "
        "Si necesitas ejecutar una acción, usa la herramienta. "
        "Si el usuario pide realizar una acción (aunque ya se haya hecho antes), DEBES llamar a la herramienta correspondiente nuevamente. "
        "Tras ejecutarla, responde con una frase corta en español resumiendo el resultado."
        )
        self._runner = LangGraphRunner(app, system_text=sys_text)

    async def invoke(self, message: str, *, thread_id: str) -> str:
        if not self._runner:
            raise RuntimeError("LangGraphAgent no inicializado")

        reply = await self._runner.invoke(message, thread_id=thread_id)

        if _looks_like_tool_json(reply):
            parsed = _parse_tool_json(reply)
            if parsed:
                name, args = parsed
                res = await self._mcp.call_tool(name, args)
                return _strip_think(_format_mcp_result(res, name))

        return _strip_think(reply)
