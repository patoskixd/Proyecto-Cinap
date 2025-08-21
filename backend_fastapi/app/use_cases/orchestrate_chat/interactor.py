import json
from typing import List
from .models import OrchestrateChatInput, OrchestrateChatOutput, ToolCallRecord
from app.use_cases.ports.llm_port import LLMPort, ToolCall
from app.use_cases.ports.mcp_port import MCPPort

class OrchestrateChatInteractor:
    def __init__(self, llm: LLMPort, mcp: MCPPort):
        self.llm = llm
        self.mcp = mcp

    async def execute(self, inp: OrchestrateChatInput) -> OrchestrateChatOutput:
        tools = await self.mcp.list_tools_openai_schema()

        first = await self.llm.chat(messages=[{"role": "user", "content": inp.message}], tools=tools)

        if not first.tool_calls:
            return OrchestrateChatOutput(reply=first.content or "OK")

        used: List[ToolCallRecord] = []

        messages: List[dict] = [{"role": "user", "content": inp.message}]
        if first.raw_provider_message:
            messages.append(first.raw_provider_message)

        for tc in first.tool_calls:
            result = await self.mcp.call_tool(tc.name, tc.args)
            used.append(ToolCallRecord(name=tc.name, args=tc.args, result=result))
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": tc.name,
                "content": json.dumps(result),
            })

        final = await self.llm.chat(messages=messages, tools=tools)
        return OrchestrateChatOutput(reply=final.content or "OK", tool_calls=used)
