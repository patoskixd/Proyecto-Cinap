from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class AssistantViewModel(BaseModel):
    reply: str
    tool_calls: Optional[List[Dict[str, Any]]] = None