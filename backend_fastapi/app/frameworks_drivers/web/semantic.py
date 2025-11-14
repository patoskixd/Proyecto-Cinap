from __future__ import annotations
import io
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text as sqla_text

from app.frameworks_drivers.config.db import get_session
from app.interface_adapters.gateways.db.pgvector_repo import PgVectorKnowledgeRepository
from app.interface_adapters.gateways.embeddings.embeddings_http_client import EmbeddingsHTTPClient
from app.use_cases.semantic_search.semantic_repo import SemanticSearchUC

admin_docs_router = APIRouter(prefix="/api/admin", tags=["admin-docs"])
semantic_router   = APIRouter(prefix="/api", tags=["semantic"])

@admin_docs_router.get("/documents")
async def list_documents(s: AsyncSession = Depends(get_session)):
    rows = await s.execute(sqla_text("""
        SELECT source_id as id,
               MAX(doc_title) AS name,
               MAX(kind) AS kind,
               COUNT(*) AS chunks,
               MIN(created_at) AS created_at
        FROM knowledge_doc
        GROUP BY source_id
        ORDER BY created_at DESC
    """))
    return [dict(r._mapping) for r in rows]

@admin_docs_router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), s: AsyncSession = Depends(get_session)):
    repo = PgVectorKnowledgeRepository(s)
    emb = EmbeddingsHTTPClient()

    name = file.filename or "documento"
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Archivo vacío")
    try:
        if name.lower().endswith(".pdf"):
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw))
            pages = [p.extract_text() or "" for p in reader.pages]
            sid, inserted = await repo.add_document_from_pages(
                title=name, pages=pages, embed_fn=emb.embed_many
            )
        elif name.lower().endswith(".docx"):
            import docx
            d = docx.Document(io.BytesIO(raw))
            text = "\n".join(p.text for p in d.paragraphs if p.text)
            sid, inserted = await repo.add_document_from_text(
                title=name, text=text, embed_fn=emb.embed_many
            )
        else:
            text = raw.decode("utf-8", errors="ignore")
            sid, inserted = await repo.add_document_from_text(
                title=name, text=text, embed_fn=emb.embed_many
            )

        await s.commit()
        return {"ok": True, "id": sid, "name": name, "inserted": inserted}
    except Exception as e:
        await s.rollback()
        raise HTTPException(500, f"Error procesando archivo: {e!s}")

@admin_docs_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, s: AsyncSession = Depends(get_session)):
    repo = PgVectorKnowledgeRepository(s)
    deleted = await repo.delete_document(doc_id)
    await s.commit()
    return {"ok": True, "deleted": int(deleted)}

@semantic_router.post("/search/semantic")
async def search_semantic(
    q: str = Body(..., embed=True),
    kinds: list[str] | None = Body(default=None),
    top_k: int = Body(default=5),
    probes: int = Body(default=10),
    s: AsyncSession = Depends(get_session),
):
    repo = PgVectorKnowledgeRepository(s)
    emb = EmbeddingsHTTPClient()
    uc = SemanticSearchUC(repo, emb)
    return await uc.execute(q, kinds=kinds, top_k=top_k, probes=probes)
