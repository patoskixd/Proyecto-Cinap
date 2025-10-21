from __future__ import annotations
import base64
from collections import deque
import copy
from datetime import datetime
import time
from zoneinfo import ZoneInfo
import json, sqlite3, asyncio, re
from typing import Any, Dict, List
from contextvars import ContextVar
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain.tools import StructuredTool
from pydantic import BaseModel, create_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from app.frameworks_drivers.mcp.stdio_client import MCPStdioClient
from app.observability.confirm_store import is_confirmation
from app.observability.metrics import set_meta, stage, astage, measure_stage
from app.observability.metrics_llm import MetricsCallbackHandler
try:
    from langchain_ollama import ChatOllama
except Exception:
    ChatOllama = None
from app.frameworks_drivers.config.settings import (
    USE_OLLAMA,
    OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TEMP, OLLAMA_TOP_P,
)

_TOOL_JSON_RE = re.compile(
    r"^\s*```(?:json)?\s*\{.*?(?:\"name\"|\"function\")\s*:\s*\"[^\"]+\".*?(?:\"arguments\"|\"parameters\")\s*:\s*\{.*?\}\s*\}\s*```"
    r"|^\s*\{.*?(?:\"name\"|\"function\")\s*:\s*\"[^\"]+\".*?(?:\"arguments\"|\"parameters\")\s*:\s*\{.*?\}\s*\}\s*$",
    re.DOTALL | re.IGNORECASE,
)

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)

CURRENT_THREAD_ID: ContextVar[str | None] = ContextVar("CURRENT_THREAD_ID", default=None)

CONFIRM_TOOLS = {"schedule_asesoria", "cancel_asesoria", "confirm_asesoria"}

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

def _attach_items_payload(text: str, items: list[dict], kind: str) -> str:
    from datetime import datetime

    def _first(d: dict, *keys):
        for k in keys:
            v = d.get(k)
            if isinstance(v, dict):
                v = v.get("iso") or v.get("at") or v.get("value") or v.get("utc")
            if v not in (None, "", []):
                return v
        return None

    def _compose_start(d: dict):
        # 1) Directos comunes
        v = _first(
            d,
            "start", "start_time", "inicio",
            "fechaHoraInicio", "startAt", "start_at",
            "startTime", "startTimeIso", "when"
        )
        if v:
            return v
        # 2) Composición fecha + hora (muy común en tu backend)
        fecha = _first(d, "fecha", "date", "dia", "day")
        hora  = _first(d, "hora", "time", "hora_inicio", "horaInicio", "slot")
        if fecha and hora:
            try:
                # Deja que el webhook lo parsee; basta concatenar
                return f"{fecha} {hora}"
            except Exception:
                pass
        # 3) Solo fecha (el webhook igual la muestra)
        if fecha:
            return fecha
        return None

    def _compose_end(d: dict):
        v = _first(
            d,
            "end", "end_time", "fin",
            "fechaHoraFin", "endAt", "end_at",
            "endTime", "endTimeIso"
        )
        return v

    ui_items = []
    for it in (items or []):
        ui_items.append({
            "title": it.get("title") or it.get("nombre") or "",
            "subtitle": it.get("subtitle") or it.get("email") or it.get("asesor") or "",
            "start": _compose_start(it),
            "end":   _compose_end(it),
            # ⬇⬇⬇ Conserva todo el item original
            "meta": it,
        })

    payload = {"kind": kind, "items": ui_items}
    blob = base64.b64encode(json.dumps(payload, ensure_ascii=False).encode("utf-8")).decode("ascii")
    return ((text or "").strip() + ("\n\n" if text else "") + f"<!--CINAP_LIST:{blob}-->").strip()


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

def _fmt_list_item(it: dict) -> str:
    title = str(it.get("title") or "(sin título)").strip()
    sub = str(it.get("subtitle") or it.get("email") or "").strip()
    return f"{title}\n{sub}" if sub else title

def _render_numbered(items: list[dict], limit: int = 10) -> str:
    shown = items[:limit]
    lines = [f"{idx+1}) {_fmt_list_item(ev)}" for idx, ev in enumerate(shown)]

    if len(items) > limit:
        lines.append(f"... y {len(items) - limit} más")

    return "\n".join(lines)

def _format_mcp_result(res: dict, tool_name: str) -> str:
    if isinstance(res, dict) and res.get("ok"):
        data = res.get("data") or {}
        items = data.get("items") or data.get("events")
        if isinstance(items, list) and items:
            header = (res.get("say") or "").strip()
            text = (header + "\n" + _render_numbered(items)) if header else ""
            return _attach_items_payload(text, items, kind=tool_name)

        ev = data.get("event")
        if isinstance(ev, dict):
            say = (res.get("say") or "").strip()
            return say or _fmt_list_item(ev)

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

class CappedCheckpointer:
    def __init__(self, base, max_messages: int = 10, keys=("messages",)):
        self._base = base
        self._max = int(max_messages)
        self._keys = tuple(keys)

    def __getattr__(self, name):
        return getattr(self._base, name)

    def _cap_checkpoint(self, cp):
        if not isinstance(cp, dict):
            return cp
        cp2 = copy.deepcopy(cp)
        for k in self._keys:
            try:
                seq = cp2.get(k)
                if isinstance(seq, list) and len(seq) > self._max:
                    cp2[k] = seq[-self._max:]
            except Exception:
                pass
        return cp2

    def _cap_in_args(self, args, kwargs):
        if "checkpoint" in kwargs:
            kwargs = dict(kwargs)
            kwargs["checkpoint"] = self._cap_checkpoint(kwargs["checkpoint"])
            return args, kwargs
        if len(args) >= 2:
            args = list(args)
            args[1] = self._cap_checkpoint(args[1])
            return tuple(args), kwargs
        return args, kwargs

    def put(self, *args, **kwargs):
        args, kwargs = self._cap_in_args(args, kwargs)
        return self._base.put(*args, **kwargs)

    async def aput(self, *args, **kwargs):
        args, kwargs = self._cap_in_args(args, kwargs)
        if hasattr(self._base, "aput"):
            return await self._base.aput(*args, **kwargs)
        return self._base.put(*args, **kwargs)

class LangGraphRunner:
    def __init__(self, app, system_text: str | None = None):
        self._app = app
        self._system_text = system_text or None

    async def invoke(self, message: str, *, thread_id: str) -> str:
        def _run():
            with stage("agent.llm.prompt_build"):
                msgs = []
                if self._system_text:
                    msgs.append(SystemMessage(content=self._system_text))
                msgs.append(HumanMessage(content=message))

            with stage("agent.langgraph.invoke"):
                res = self._app.invoke(
                    {"messages": msgs},
                    config={"configurable": {"thread_id": thread_id}},
                )
                out = res.get("messages", [])

            with stage("agent.present.extract"):
                return _strip_think(out[-1].content if out else "")

        async with astage("agent.total"):
            return await asyncio.to_thread(_run)

class LangGraphAgent:
    def __init__(self, mcps: dict[str, MCPStdioClient], *, model_name: str, db_path: str, main_loop):
        self._mcps = mcps
        self._tool_to_client: dict[str, str] = {}
        self._model_name = model_name
        self._db_path = db_path
        self._runner: LangGraphRunner | None = None
        self._main_loop = main_loop
        self._confirm_store = None

    def set_confirm_store(self, store) -> None:
        self._confirm_store = store

    def _make_tool(self, name: str, description: str, ModelIn: type[BaseModel]) -> StructuredTool:
        async def caller_async(**kwargs) -> str:
            set_meta(route="inline_tool")
            client = self._client_for_tool(name)

            try:
                async with astage("agent.mcp.total", extra={"tool": name}):
                    async with astage("agent.mcp.normalize"):
                        if name == "event_delete_by_title":
                            args = _normalize_event_delete_by_title_args(kwargs)
                        elif name == "event_update":
                            args = _normalize_event_update_args(kwargs)
                        else:
                            args = kwargs

                    thread_id = CURRENT_THREAD_ID.get()
                    args = dict(args)

                    if name in ("schedule_asesoria", "cancel_asesoria", "list_asesorias", "confirm_asesoria"):
                        user = getattr(self, "_current_user", {}) or {}
                        uid = user.get("sub") or user.get("user_id")
                        if not uid:
                            import re
                            tid = CURRENT_THREAD_ID.get()
                            if thread_id and re.fullmatch(r"[0-9a-fA-F-]{36}", thread_id):
                                uid = thread_id
                        if "input" in args and isinstance(args["input"], dict):
                            if uid and not args["input"].get("user_id"):
                                args["input"]["user_id"] = uid
                        else:
                            payload = dict(args.get("input") or {})
                            if uid and not payload.get("user_id"):
                                payload["user_id"] = uid
                            args["input"] = payload

                    if getattr(self, "_confirm_store", None) and thread_id and name in CONFIRM_TOOLS:
                        pending_exists = await self._confirm_store.peek(thread_id)

                        if args.get("confirm") is True and not pending_exists:
                            args["confirm"] = False
                            set_meta(enforced_preview=True)

                        if not bool(args.get("confirm")):
                            async with astage("confirm.store.put", extra={"tool": name}):
                                await self._confirm_store.put(thread_id, name, args)

                            async with astage("mcp.rpc", extra={"tool": name, "phase": "preview"}):
                                preview_res = await client.call_tool(name, {**args, "confirm": False})

                            try:
                                if isinstance(preview_res, dict):
                                    next_hint = None
                                    data = preview_res.get("data") or {}
                                    if isinstance(data, dict):
                                        next_hint = data.get("next_hint")
                                    if not next_hint:
                                        next_hint = preview_res.get("next_hint")

                                    if next_hint:
                                        post = [{
                                            "tool": next_hint.get("next_tool"),
                                            "args": next_hint.get("suggested_args")
                                        }]
                                        await self._confirm_store.patch(thread_id, {"post_confirm": post})
                            except Exception:
                                pass

                            return _format_mcp_result(preview_res, name)

                        set_meta(confirm_requested_inline=True)
                        return "Necesito tu confirmación primero. Responde con “sí” para continuar."

                    async with astage("mcp.rpc", extra={"tool": name, "phase": "direct"}):
                        res = await client.call_tool(name, args)
                    return _format_mcp_result(res, name)

            except Exception as e:
                return f"Ocurrió un error ejecutando {name}: {e!s}"

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
        tools: list[StructuredTool] = []
        for label, client in self._mcps.items():
            specs = await client.list_tools_openai_schema()
            for spec in specs:
                fn = spec.get("function", {}) or {}
                name = str(fn.get("name") or "")
                if not name:
                    continue
                public_name = name

                self._tool_to_client[public_name] = label

                schema = fn.get("parameters") or {"type": "object", "properties": {}}
                ModelIn = _pydantic_model_from_json_schema(f"{public_name}_Input", schema)
                tools.append(self._make_tool(public_name, fn.get("description") or "", ModelIn))
        return tools
    
    def _client_for_tool(self, tool_name: str) -> MCPStdioClient:
        label = self._tool_to_client.get(tool_name)
        if not label:
            label = next(iter(self._mcps.keys()))
        return self._mcps[label]
    
    def configure_openai(self, *, base_url: str, api_key: str,
                         temperature: float | None = None, top_p: float | None = None):
        self._base_url = base_url
        self._api_key = api_key
        if temperature is not None: self._temperature = temperature
        if top_p is not None: self._top_p = top_p

    async def startup(self):
        if USE_OLLAMA:
            if ChatOllama is None:
                raise RuntimeError("langchain_ollama no está instalado. Instala: pip install langchain-ollama")
            llm = ChatOllama(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=OLLAMA_TEMP,
                top_p=OLLAMA_TOP_P,
                timeout=60
            )
        else:
            llm = ChatOpenAI(
                model=self._model_name,
                base_url=getattr(self, "_base_url", None),
                api_key=getattr(self, "_api_key", None),
                temperature=getattr(self, "_temperature", 0.2),
                top_p=getattr(self, "_top_p", 0.95),
                timeout=60,
                callbacks=[MetricsCallbackHandler(stage_name="llm.http")]
            )

        tools = await self._build_tools_from_mcp()
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        base_cp = SqliteSaver(conn)
        checkpointer = CappedCheckpointer(base_cp, max_messages=10)
        app_or_graph = create_react_agent(llm, tools, checkpointer=checkpointer)
        app = app_or_graph.compile(checkpointer=checkpointer) if hasattr(app_or_graph, "compile") else app_or_graph

        SYSTEM_STATIC_EN = """
        You are a tool-using assistant. 
        Your answers must always be in Spanish. 

        TOOL HINTS (Cinap)
        - For "schedule_asesoria", "cancel_asesoria" and "confirm_asesoria", arguments must be inside an input payload.
        - Two-step workflow for schedule:
          1) First produce a PREVIEW by calling the tool with confirm=false.
          2) Only if the user explicitly confirms in their next message, call the tool again with confirm=true to execute.
        - A confirmation applies only to the immediately preceding action and cannot be reused.
        - Do not re-execute a completed action when the user repeats “sí” or similar.
        - For tools that require user_id, don't insert it since it will be injected automatically

        TOOL CALL FORMAT
        - When you decide to use a tool, respond with a single JSON object only (no extra text, no code fences):
          {"name":"<tool_name>","arguments":{...}}
        - Use snake_case parameter names exactly as defined by the tool. Omit null/unknown fields.

        RAG HINTS
        - If the question is informative about CINAP (what is it, services, politics, how it works, etc.), use the tool "semantic_search" with { "q": "<user question>" } to gain context before responding.
        - If there's no results, say it clearly.
        """
        now_cl = datetime.now(ZoneInfo("America/Santiago"))
        offset = now_cl.utcoffset()
        offset_h = int(offset.total_seconds() // 3600)
        offset_sign = "+" if offset_h >= 0 else "-"
        offset_txt = f"UTC{offset_sign}{abs(offset_h):02d}:00"
        system_msg = SYSTEM_STATIC_EN + f"\nContext: TZ=America/Santiago ({offset_txt}), today={now_cl:%d-%m-%Y}\n /no_think"
        self._runner = LangGraphRunner(app, system_text=system_msg)

    async def invoke(self, message: str, *, thread_id: str) -> str:
        if not self._runner:
            raise RuntimeError("LangGraphAgent no inicializado")

        if getattr(self, "_confirm_store", None) and is_confirmation(message):
            async with astage("confirm.fastpath.pop"):
                pending = await self._confirm_store.pop(thread_id)

            if not pending:
                return "No hay ninguna acción pendiente de confirmación."

            if pending:
                tool = (pending.get("tool") or "").strip()
                args = dict(pending.get("args") or {})
                created_at = pending.get("created_at") or 0
                if not isinstance(created_at, int) or (time.time() - created_at) > 120:
                    return "La confirmación caducó. Vuelve a intentarlo, por favor"

                if tool not in CONFIRM_TOOLS:
                    return "No hay ninguna acción pendiente de confirmación"
                else:
                    def _fallback_user_id():
                        user = getattr(self, "_current_user", {}) or {}
                        uid = user.get("sub") or user.get("user_id")
                        if not uid:
                            import re
                            tid = CURRENT_THREAD_ID.get()
                            if tid and re.fullmatch(r"[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}", tid):
                                uid = tid
                        return uid

                    def _put_confirm_and_user_id_in_input(a: dict) -> dict:
                        out = dict(a or {})
                        if "input" not in out or not isinstance(out["input"], dict):
                            out["input"] = {}
                        out["input"] = {**out["input"], "confirm": True}
                        uid = out["input"].get("user_id") or _fallback_user_id()
                        if uid:
                            out["input"]["user_id"] = uid
                        return out

                    if tool in ("schedule_asesoria", "cancel_asesoria"):
                        args = _put_confirm_and_user_id_in_input(args)
                    else:
                        if "input" in args and isinstance(args["input"], dict):
                            args["input"]["confirm"] = True
                        else:
                            args["confirm"] = True

                    set_meta(route="confirm_fastpath", tool=tool)
                    client = self._client_for_tool(tool)

                    msgs: list[str] = []
                    try:
                        async with astage("confirm.fastpath.mcp", extra={"tool": tool, "phase": "confirm"}):
                            res = await client.call_tool(tool, args)
                        msgs.append(_strip_think(_format_mcp_result(res, tool)))
                    except Exception as e:
                        msgs.append(f"Ocurrió un error confirmando {tool}: {e!s}")

                    post_ops = []
                    try:
                        post_ops = (pending.get("post_confirm") or []) if isinstance(pending, dict) else []
                    except Exception:
                        post_ops = []

                    try:
                        confirm_hint = None
                        if isinstance(res, dict):
                            data = res.get("data") or {}
                            nh = data.get("next_hint") or res.get("next_hint")
                            if isinstance(nh, dict) and nh.get("next_tool") and nh.get("suggested_args"):
                                confirm_hint = {"tool": nh["next_tool"], "args": dict(nh["suggested_args"] or {})}

                        def _deep_merge(dst: dict, src: dict) -> dict:
                            out = dict(dst or {})
                            for k, v in (src or {}).items():
                                if isinstance(v, dict) and isinstance(out.get(k), dict):
                                    out[k] = _deep_merge(out[k], v)
                                else:
                                    out[k] = v
                            return out

                        if confirm_hint:
                            if post_ops:
                                for op in post_ops:
                                    if op.get("tool") == confirm_hint["tool"]:
                                        op["args"] = _deep_merge(op.get("args") or {}, confirm_hint["args"])
                                        break
                                else:
                                    post_ops.append(confirm_hint)
                            else:
                                post_ops = [confirm_hint]
                    except Exception:
                        pass

                    def _deep_merge(dst: dict, src: dict) -> dict:
                        out = dict(dst or {})
                        for k, v in (src or {}).items():
                            if isinstance(v, dict) and isinstance(out.get(k), dict):
                                out[k] = _deep_merge(out[k], v)
                            else:
                                out[k] = v
                        return out

                    queue = deque(post_ops or [])

                    while queue:
                        op = queue.popleft()
                        tname = (op.get("tool") or "").strip()
                        targs = dict(op.get("args") or {})
                        if not tname:
                            continue

                        if tname == "event_create":
                            if isinstance(targs.get("attendees"), list):
                                seen = set(); atts = []
                                for a in targs["attendees"]:
                                    a = (a or "").strip().lower()
                                    if a and a not in seen:
                                        seen.add(a); atts.append(a)
                                targs["attendees"] = atts

                        try:
                            c2 = self._client_for_tool(tname)
                            async with astage("confirm.fastpath.mcp", extra={"tool": tname, "phase": "post"}):
                                r2 = await c2.call_tool(tname, targs)
                            msgs.append(_strip_think(_format_mcp_result(r2, tname)))
                        except Exception as e:
                            msgs.append(f"Ocurrió un error encadenando {tname}: {e}")
                            continue

                        try:
                            if isinstance(r2, dict):
                                data2 = r2.get("data") or {}
                                nh2 = data2.get("next_hint") or r2.get("next_hint")
                                if isinstance(nh2, dict) and nh2.get("next_tool") and nh2.get("suggested_args"):
                                    queue.append({
                                        "tool": nh2["next_tool"],
                                        "args": dict(nh2["suggested_args"] or {}),
                                    })
                        except Exception:
                            pass

                    return "\n".join([m for m in msgs if m]).strip()

            set_meta(fastpath="miss_no_pending")

        token = CURRENT_THREAD_ID.set(thread_id)
        try:
            reply = await self._runner.invoke(message, thread_id=thread_id)
            return _strip_think(reply)
        finally:
            CURRENT_THREAD_ID.reset(token)