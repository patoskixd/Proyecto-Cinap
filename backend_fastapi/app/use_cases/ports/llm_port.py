from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Protocol

@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    args: Dict[str, Any]

@dataclass(frozen=True)
class ChatReply:
    content: Optional[str]
    tool_calls: List[ToolCall]
    raw_provider_message: Optional[Dict[str, Any]] = None

class LLMPort(Protocol):
    async def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> ChatReply: ...
