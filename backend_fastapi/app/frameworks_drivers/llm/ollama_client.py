import json
import httpx
from typing import Any, Dict, List, Optional
from app.use_cases.ports.llm_port import LLMPort, ChatReply, ToolCall

class OllamaClient(LLMPort):
    def __init__(self, base_url: str, model: str, timeout: float = 60.0):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    async def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> ChatReply:
        payload: Dict[str, Any] = {"model": self.model, "messages": messages, "stream": False}
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(self.base_url, json=payload)
            r.raise_for_status()
            data = r.json()

        choice = (data.get("choices") or [None])[0] or {}
        msg: Dict[str, Any] = choice.get("message") or {}

        content: Optional[str] = msg.get("content")
        tool_calls_raw = msg.get("tool_calls") or []

        tool_calls: List[ToolCall] = []
        for tc in tool_calls_raw:
            fn = (tc or {}).get("function", {})
            raw_args = fn.get("arguments", "{}")
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
            except Exception:
                args = {}
            tool_calls.append(
                ToolCall(
                    id=str(tc.get("id", "")),
                    name=str(fn.get("name", "")),
                    args=args,
                )
            )

        return ChatReply(
            content=content,
            tool_calls=tool_calls,
            raw_provider_message=msg or None,
        )
