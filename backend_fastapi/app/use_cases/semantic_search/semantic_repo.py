import re
from app.use_cases.ports.embeddings_port import EmbeddingsPort

def split_sentences(text: str) -> list[str]:
    sents = re.split(r'(?<=[\.\?\!])\s+', (text or "").strip())
    return [re.sub(r"\s+"," ", s).strip() for s in sents if s.strip()]

def cos(a, b): return sum(x*y for x,y in zip(a,b))

class SemanticSearchUC:
    def __init__(self, repo, emb: EmbeddingsPort):
        self.repo = repo
        self.emb = emb

    async def execute(self, q: str, *, kinds=None, top_k=5, probes=10):
        qvec = (await self.emb.embed_many([q]))[0]
        items = await self.repo.search_topk(qvec, kinds=kinds, top_k=top_k, probes=probes)

        qv = qvec
        best = None
        for it in items:
            sents = split_sentences(it.get("text") or "")
            if not sents: continue
            svecs = await self.emb.embed_many(sents)
            sims = [cos(qv, sv) for sv in svecs]
            i = max(range(len(sims)), key=sims.__getitem__)
            window = [sents[i]]
            if i-1 >= 0 and len(window[0]) < 240: window.insert(0, sents[i-1])
            if i+1 < len(sents) and sum(len(x) for x in window) < 480: window.append(sents[i+1])
            snippet = " ".join(window).strip()
            cand = (sims[i], snippet, it)
            if (best is None) or (cand[0] > best[0]): best = cand

        return {"q": q, "items": items, "best": None if not best else {
            "text": best[1],
            "title": best[2].get("doc_title"),
            "page_no": best[2].get("page_no"),
        }}
