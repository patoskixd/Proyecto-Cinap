from dataclasses import dataclass
from typing import Any, Dict, List, Optional

@dataclass(frozen=True)
class OrchestrateChatInput:
    message: str
    session_id: Optional[str] = None

@dataclass(frozen=True)
class ToolCallRecord:
    name: str
    args: Dict[str, Any]
    result: Dict[str, Any]

@dataclass(frozen=True)
class OrchestrateChatOutput:
    reply: str
    tool_calls: Optional[List[ToolCallRecord]] = None