from dataclasses import asdict
from app.use_cases.orchestrate_chat.models import OrchestrateChatOutput
from app.interface_adapters.viewmodels.assistant_view import AssistantViewModel

class AssistantPresenter:
    @staticmethod
    def to_view(output: OrchestrateChatOutput) -> AssistantViewModel:
        return AssistantViewModel(
            reply=output.reply,
            tool_calls=[asdict(tc) for tc in (output.tool_calls or [])] or None
        )