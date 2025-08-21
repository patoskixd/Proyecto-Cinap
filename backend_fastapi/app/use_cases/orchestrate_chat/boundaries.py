from typing import Protocol
from .models import OrchestrateChatInput, OrchestrateChatOutput

class OrchestrateChatInputBoundary(Protocol):
    async def execute(self, inp: OrchestrateChatInput) -> OrchestrateChatOutput: ...