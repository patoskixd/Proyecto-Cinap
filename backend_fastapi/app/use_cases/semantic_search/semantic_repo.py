import os, math, re
import httpx

def _l2_normalize(vec):
    n = math.sqrt(sum(x*x for x in vec)) or 1.0
    return [x/n for x in vec]

EMBEDDINGS_URL = os.getenv("EMBEDDINGS_URL", "http://127.0.0.1:8004/v1/embeddings")
EMBED_MODEL    = os.getenv("EMBED_MODEL", "hiiamsid/sentence_similarity_spanish_es")
EMBED_API_KEY  = os.getenv("EMBED_API_KEY", "")
EMBED_DIM      = int(os.getenv("EMBED_DIM", "768"))

_http_client: httpx.AsyncClient | None = None
async def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0), http2=True)
    return _http_client

def _split_sentences(text: str) -> list[str]:
    sents = re.split(r'(?<=[\.\?\!])\s+', (text or "").strip())
    return [re.sub(r'\s+', ' ', s).strip() for s in sents if s and len(s.strip()) > 0]

async def _embed_many(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    headers = {}
    if EMBED_API_KEY:
        headers["Authorization"] = f"Bearer {EMBED_API_KEY}"
    payload = {"model": EMBED_MODEL, "input": texts}
    c = await _get_client()
    r = await c.post(EMBEDDINGS_URL, json=payload, headers=headers)
    r.raise_for_status()
    data = (r.json() or {}).get("data") or []
    embs = []
    for it in data:
        emb = it.get("embedding")
        if not isinstance(emb, list) or len(emb) != EMBED_DIM:
            raise RuntimeError("Embedding inválido")
        embs.append(_l2_normalize(emb))
    if len(embs) != len(texts):
        raise RuntimeError(f"Embeddings devueltos {len(embs)} != textos {len(texts)}")
    return embs

def _cos(a, b): return sum(x*y for x, y in zip(a, b))

async def _best_snippet(q: str, items: list[dict]) -> dict | None:
    if not items:
        return None

    qvec = (await _embed_many([q]))[0]

    best = None
    for it in items:
        title = it.get("doc_title") or it.get("title") or it.get("kind") or "Resultado"
        page_no = it.get("page_no")
        sents = _split_sentences(it.get("text") or "")
        if not sents:
            continue

        svecs = await _embed_many(sents)

        sims = [ _cos(qvec, sv) for sv in svecs ]
        idx = max(range(len(sims)), key=lambda i: sims[i])
        window = [sents[idx]]
        if idx-1 >= 0 and len(window[0]) < 240:
            window.insert(0, sents[idx-1])
        if idx+1 < len(sents) and sum(len(x) for x in window) < 480:
            window.append(sents[idx+1])

        snippet = " ".join(window).strip()
        cand = (sims[idx], title, page_no, snippet)
        if (best is None) or (cand[0] > best[0]):
            best = cand

    if not best:
        return None

    sim, title, page_no, snippet = best
    if len(snippet) > 700:
        snippet = snippet[:700].rsplit(" ", 1)[0] + "…"
    return {"title": title, "page_no": page_no, "text": snippet}

class SemanticSearchUC:
    def __init__(self, repo):
        self.repo = repo

    async def _embed(self, text: str):
        return (await _embed_many([text]))[0]

    async def execute(self, q: str, *, kinds=None, top_k=5, probes=10):
        qvec = await self._embed(q)
        items = await self.repo.search_topk(qvec, kinds=kinds, top_k=top_k, probes=probes)
        best = await _best_snippet(q, items)
        return {"q": q, "items": items, "best": best}