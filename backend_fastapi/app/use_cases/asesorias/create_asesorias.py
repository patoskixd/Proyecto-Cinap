from __future__ import annotations

from app.use_cases.ports.asesoria_port import (
    AsesoriaRepo,
    CreateAsesoriaIn,
    CreateAsesoriaOut,
)


class CreateAsesoria:

    def __init__(self, repo: AsesoriaRepo):
        self._repo = repo

    async def exec(self, input: CreateAsesoriaIn) -> CreateAsesoriaOut:
        return await self._repo.create_and_reserve(input)
