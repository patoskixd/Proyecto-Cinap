from __future__ import annotations
from dataclasses import dataclass
from typing import Sequence, Protocol
from datetime import datetime
import uuid

@dataclass(frozen=True)
class PendingConfirmation:
    id: uuid.UUID
    categoria: str
    servicio: str
    inicio: datetime
    fin: datetime
    solicitado_en: datetime
    ubicacion: str | None = None
    solicitante: str | None = None

class TeacherConfirmationsRepo(Protocol):
    async def get_pending_for_usuario(self, usuario_id: uuid.UUID) -> Sequence[PendingConfirmation]: ...

class GetTeacherPendingConfirmations:
    def __init__(self, repo: TeacherConfirmationsRepo):
        self.repo = repo

    async def exec(self, usuario_id: uuid.UUID) -> list[PendingConfirmation]:
        rows = await self.repo.get_pending_for_usuario(usuario_id)
        return list(rows)
