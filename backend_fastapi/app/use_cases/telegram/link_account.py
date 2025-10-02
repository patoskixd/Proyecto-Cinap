from app.use_cases.ports.telegram_repo_port import TelegramRepoPort

class LinkTelegramAccount:
    def __init__(self, repo: TelegramRepoPort):
        self.repo = repo

    async def execute( self, token: str, telegram_user_id: int, chat_id: int, username: str | None ) -> bool:
        return await self.repo.link_telegram( token=token, telegram_user_id=telegram_user_id, chat_id=chat_id, username=username,)
