from typing import Optional, List, Tuple
from application.ports import AdvisorRepository
from dataclasses import dataclass
from interface_adapters.services.text_norm import norm_key

@dataclass
class ResolveAdvisorIn:
    query: str
    limit: int = 10

@dataclass
class AdvisorCandidate:
    id: str
    nombre: str
    email: Optional[str]

class ResolveAdvisor:
    def __init__(self, repo: AdvisorRepository):
        self.repo = repo

    async def execute(self, data: ResolveAdvisorIn) -> Tuple[Optional[AdvisorCandidate], List[AdvisorCandidate]]:
        q_raw = (data.query or "").strip()
        if not q_raw:
            return None, []

        if "@" in q_raw:
            row = await self.repo.find_by_email(q_raw.casefold())
            if row:
                cand = AdvisorCandidate(id=str(row["id"]), nombre=row["nombre"], email=row.get("email"))
                return cand, []

        rows = await self.repo.search_by_name(q_raw, limit=data.limit)
        cands = [AdvisorCandidate(id=str(r["id"]), nombre=r["nombre"], email=r.get("email")) for r in rows]
        if not cands:
            return None, []

        qn = norm_key(q_raw)

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
