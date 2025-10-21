from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.frameworks_drivers.config.db import get_session
from app.interface_adapters.gateways.db.pgvector_repo import PgVectorKnowledgeRepository
from app.use_cases.semantic_search.semantic_repo import SemanticSearchUC

router = APIRouter()

class SemanticIn(BaseModel):
    q: str
    kinds: list[str] | None = None
    top_k: int = 5
    probes: int = 10

@router.post("/search/semantic")
async def search_semantic(body: SemanticIn, s: AsyncSession = Depends(get_session)):
    repo = PgVectorKnowledgeRepository(s)
    uc = SemanticSearchUC(repo)
    return await uc.execute(body.q, kinds=body.kinds, top_k=body.top_k, probes=body.probes)