from __future__ import annotations
import os
import uuid, hashlib, re
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text as sqla_text, bindparam
from pgvector.sqlalchemy import Vector

DIM = int(os.getenv("EMBED_DIM", "768"))

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def _chunk_text(text: str, max_chars=1200, overlap=200) -> List[str]:
    paras = re.split(r"\n\s*\n+", (text or "").strip())
    chunks: List[str] = []
    buf = ""

    def flush():
        nonlocal buf
        if buf.strip():
            chunks.append(re.sub(r"\s+", " ", buf.strip()))
        buf = ""

    for p in paras:
        sents = re.split(r"(?<=[\.\?\!])\s+", p.strip())
        for s in sents:
            if not s:
                continue
            if len(buf) + 1 + len(s) <= max_chars:
                buf = f"{buf} {s}".strip() if buf else s
            else:
                if buf:
                    chunks.append(re.sub(r"\s+", " ", buf.strip()))
                    tail = buf[-overlap:] if overlap > 0 else ""
                    buf = (tail + " " + s).strip() if tail else s
                else:
                    for i in range(0, len(s), max_chars):
                        part = s[i:i+max_chars]
                        if part:
                            chunks.append(part)
                    buf = ""
        if len(buf) < max_chars:
            buf = buf.strip()
    flush()
    return [c for c in chunks if c]

class PgVectorKnowledgeRepository:
    def __init__(self, session: AsyncSession):
        self.s = session

    async def search_topk(self, qvec, *, kinds=None, top_k=5, probes=10):
        await self.s.execute(sqla_text(f"SET LOCAL ivfflat.probes = {int(probes)};"))
        where = "WHERE 1=1"
        params = {"qvec": qvec, "k": int(top_k)}

        if kinds:
            where += " AND kd.kind = ANY(:kinds)"
            params["kinds"] = kinds

        stmt = (
            sqla_text(f"""
                SELECT
                    kd.id, kd.source_table, kd.source_id, kd.kind,
                    kd.text, kd.page_no, kd.doc_title,
                    (kd.embedding <=> :qvec) AS dist
                FROM knowledge_doc kd
                {where}
                ORDER BY kd.embedding <=> :qvec
                LIMIT :k
            """)
            .bindparams(bindparam("qvec", type_=Vector(DIM)),
                        bindparam("k"))
        )
        res = await self.s.execute(stmt, params)
        return [dict(r._mapping) for r in res]

    async def add_document_from_text(
        self,
        *,
        title: str,
        text: str,
        url: Optional[str] = None,
        source_table: str = "document",
        kind: str = "doc.chunk",
        embed_fn,
    ) -> tuple[str, int]:
        chunks = _chunk_text(text, max_chars=1200, overlap=200)
        if not chunks:
            return (str(uuid.uuid4()), 0)

        embs = await embed_fn(chunks)
        source_id = str(uuid.uuid4())

        rows = [{
            "id": str(uuid.uuid4()),
            "source_table": source_table,
            "source_id": source_id,
            "kind": kind,
            "text": chunk,
            "page_no": None,
            "chunk_no": idx,
            "doc_title": title,
            "doc_url": url,
            "hash": _hash(chunk),
            "embedding": emb,
        } for idx, (chunk, emb) in enumerate(zip(chunks, embs))]

        stmt = sqla_text("""
            INSERT INTO knowledge_doc (
              id, source_table, source_id, kind, text,
              page_no, chunk_no, doc_title, doc_url, hash,
              embedding, created_at, updated_at
            ) VALUES (
              :id, :source_table, :source_id, :kind, :text,
              :page_no, :chunk_no, :doc_title, :doc_url, :hash,
              :embedding, now(), now()
            )
            ON CONFLICT (id) DO NOTHING
        """).bindparams(bindparam("embedding", type_=Vector(DIM)))

        await self.s.execute(stmt, rows)
        return (source_id, len(rows))

    async def add_document_from_pages(
        self,
        *,
        title: str,
        pages: List[str],
        url: Optional[str] = None,
        embed_fn,
    ) -> tuple[str, int]:
        source_id = str(uuid.uuid4())
        stmt = sqla_text("""
            INSERT INTO knowledge_doc (
              id, source_table, source_id, kind, text,
              page_no, chunk_no, doc_title, doc_url, hash,
              embedding, created_at, updated_at
            ) VALUES (
              :id, 'document', :source_id, 'doc.chunk', :text,
              :page_no, :chunk_no, :doc_title, :doc_url, :hash,
              :embedding, now(), now()
            )
            ON CONFLICT (id) DO NOTHING
        """).bindparams(bindparam("embedding", type_=Vector(DIM)))

        total = 0
        for pno, page_text in enumerate(pages, start=1):
            chunks = _chunk_text(page_text)
            if not chunks:
                continue
            embs = await embed_fn(chunks)
            rows = []
            for idx, (chunk, emb) in enumerate(zip(chunks, embs)):
                rows.append({
                    "id": str(uuid.uuid4()),
                    "source_id": source_id,
                    "text": chunk,
                    "page_no": pno,
                    "chunk_no": idx,
                    "doc_title": title,
                    "doc_url": url,
                    "hash": _hash(chunk),
                    "embedding": emb,
                })
            await self.s.execute(stmt, rows)
            total += len(rows)
        return (source_id, total)

    async def delete_document(self, source_id: str) -> int:
        res = await self.s.execute(
            sqla_text("DELETE FROM knowledge_doc WHERE source_id = :sid"),
            {"sid": source_id},
        )
        return int(res.rowcount or 0)
