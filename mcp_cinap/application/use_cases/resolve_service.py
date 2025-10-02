from typing import Optional, List, Tuple
from application.ports import ServiceRepository
from dataclasses import dataclass

@dataclass
class ResolveServiceIn:
    query: str
    limit: int = 10

@dataclass
class ServiceCandidate:
    id: str
    nombre: str

class ResolveService:
    def __init__(self, repo: ServiceRepository):
        self.repo = repo

    async def execute(self, data: ResolveServiceIn) -> Tuple[Optional[ServiceCandidate], List[ServiceCandidate]]:
        rows = await self.repo.search_by_name(data.query.strip(), limit=data.limit)
        cands = [ServiceCandidate(id=str(r["id"]), nombre=r["nombre"]) for r in rows]
        if len(cands) == 1:
            return cands[0], []
        return None, cands
