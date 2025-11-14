from dataclasses import dataclass
from app.use_cases.ports.auth_repos import UserRepo

@dataclass
class LogoutUseCase:
    user_repo: UserRepo

    async def execute(self, *, user_id: str) -> None:
        await self.user_repo.mark_logged_out(user_id)
