import os, httpx
from typing import List
from app.use_cases.ports.embeddings_port import EmbeddingsPort

class EmbeddingsHTTPClient(EmbeddingsPort):
    def __init__(self):
        self._url = os.getenv("EMBEDDINGS_URL", "http://127.0.0.1:8004/v1/embeddings")
        self._model = os.getenv("EMBED_MODEL", "hiiamsid/sentence_similarity_spanish_es")
        self._api_key = os.getenv("EMBED_API_KEY", "")
        self._dim = int(os.getenv("EMBED_DIM", "768"))
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0), http2=True)

    @property
    def dim(self) -> int: return self._dim

    async def embed_many(self, texts: List[str]) -> List[List[float]]:
        headers = {"Authorization": f"Bearer {self._api_key}"} if self._api_key else {}
        payload = {"model": self._model, "input": texts}
        r = await self._client.post(self._url, json=payload, headers=headers)
        r.raise_for_status()
        data = (r.json() or {}).get("data") or []
        if len(data) != len(texts): raise RuntimeError("Mismatch embeddings/texts")
        embs = [it["embedding"] for it in data]
        if any(len(e) != self._dim for e in embs): raise RuntimeError("Unexpected dim")
        import math
        def l2(v): 
            n = math.sqrt(sum(x*x for x in v)) or 1.0
            return [x/n for x in v]
        return [l2(e) for e in embs]
