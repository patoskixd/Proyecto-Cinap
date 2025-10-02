from typing import Optional, List, Tuple
from application.ports import AdvisorRepository
from dataclasses import dataclass

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
        q = data.query.strip()
        if "@" in q:
            row = await self.repo.find_by_email(q)
            if row:
                cand = AdvisorCandidate(id=str(row["id"]), nombre=row["nombre"], email=row.get("email"))
                return cand, []
        rows = await self.repo.search_by_name(q, limit=data.limit)
        cands = [AdvisorCandidate(id=str(r["id"]), nombre=r["nombre"], email=r.get("email")) for r in rows]
        if len(cands) == 1:
            return cands[0], []
        return None, cands
