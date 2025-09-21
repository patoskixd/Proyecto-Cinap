from __future__ import annotations
from typing import List
from app.use_cases.ports.confirmations_port import AdvisorConfirmationsRepo, PendingConfirmationDTO

class GetPendingConfirmations:
    def __init__(self, repo: AdvisorConfirmationsRepo):
        self.repo = repo

    async def exec(self, usuario_id: str) -> List[PendingConfirmationDTO]:
        asesor_id = await self.repo.resolve_asesor_id(usuario_id)
        if not asesor_id:
            return []
        return await self.repo.get_pending_for(asesor_id)
