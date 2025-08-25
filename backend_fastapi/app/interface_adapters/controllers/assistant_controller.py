from fastapi import HTTPException
from app.use_cases.orchestrate_chat.models import OrchestrateChatInput
from app.use_cases.orchestrate_chat.interactor import OrchestrateChatInteractor
from app.interface_adapters.presenters.assistant_presenter import AssistantPresenter
from app.interface_adapters.viewmodels.assistant_view import AssistantViewModel

class AssistantController:
    def __init__(self, interactor: OrchestrateChatInteractor, presenter: AssistantPresenter):
        self.interactor = interactor
        self.presenter = presenter

    async def chat(self, message: str) -> AssistantViewModel:
        if not message:
            raise HTTPException(status_code=400, detail="message es requerido")
        output = await self.interactor.execute(OrchestrateChatInput(message=message))
        return self.presenter.to_view(output)