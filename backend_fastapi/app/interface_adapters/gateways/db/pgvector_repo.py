from sqlalchemy import text as sqla_text, bindparam
from pgvector.sqlalchemy import Vector

DIM = 768

class PgVectorKnowledgeRepository:
    def __init__(self, s): self.s = s

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
                    gi.title, kd.text,
                    kd.page_no, kd.doc_title,
                    (kd.embedding <=> :qvec) AS dist
                FROM knowledge_doc kd
                LEFT JOIN general_info gi ON gi.id = kd.source_id
                {where}
                ORDER BY kd.embedding <=> :qvec
                LIMIT :k
            """)
            .bindparams(
                bindparam("qvec", type_=Vector(DIM)),
                bindparam("k"),
            )
        )
        res = await self.s.execute(stmt, params)
        return [dict(r._mapping) for r in res]