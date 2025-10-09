from typing import Optional, List, Tuple
from application.ports import ServiceRepository
from dataclasses import dataclass
from interface_adapters.services.text_norm import norm_key

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
        qn = norm_key(data.query)
        rows = await self.repo.search_by_name(data.query.strip(), limit=data.limit)
        cands = [ServiceCandidate(id=str(r["id"]), nombre=r["nombre"]) for r in rows]
        if not cands:
            return None, []

        exact = [c for c in cands if norm_key(c.nombre) == qn]
        if len(exact) == 1:
            return exact[0], []

        starts = [c for c in cands if norm_key(c.nombre).startswith(qn)]
        if len(starts) == 1:
            return starts[0], []

        contains = [c for c in cands if qn in norm_key(c.nombre)]
        if len(contains) == 1:
            return contains[0], []

        return None, cands