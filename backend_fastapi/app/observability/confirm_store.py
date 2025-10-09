from __future__ import annotations
import json, time, hashlib
from typing import Any, Optional

def _canon(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def _decode(raw: Any) -> Optional[dict]:
    if not raw:
        return None
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", "ignore")
    try:
        return json.loads(raw)
    except Exception:
        return None

class ConfirmStore:
    def __init__(self, redis_client: Any, prefix: str = "preview:", ttl_sec: int = 600):
        self.r = redis_client
        self.prefix = prefix
        self.ttl = ttl_sec

    def _key(self, thread_id: str) -> str:
        return f"{self.prefix}{thread_id}"

    def key_for(self, thread_id: str) -> str:
        return self._key(thread_id)

    async def put(self, thread_id: str, tool: str, args: dict) -> str:
        idem = hashlib.sha256(_canon({"tool": tool, "args": args}).encode("utf-8")).hexdigest()
        payload = {
            "tool": tool,
            "args": args,
            "created_at": int(time.time()),
            "idempotency": idem
        }
        data = _canon(payload)
        key = self._key(thread_id)

        try:
            await self.r.set(key, data, ex=self.ttl)
            return idem
        except TypeError:
            pass

        setex = getattr(self.r, "setex", None)
        if callable(setex):
            await setex(key, self.ttl, data)
            return idem

        await self.r.set(key, data)
        expire = getattr(self.r, "expire", None)
        if callable(expire):
            await expire(key, self.ttl)

        return idem

    async def get(self, thread_id: str) -> Optional[dict]:
        raw = await self.r.get(self._key(thread_id))
        return _decode(raw)

    async def patch(self, thread_id: str, updates: dict) -> bool:
        key = self._key(thread_id)
        raw = await self.r.get(key)
        current = _decode(raw)
        if not current:
            return False

        merged = dict(current)
        for k, v in (updates or {}).items():
            merged[k] = v

        ttl_fn = getattr(self.r, "ttl", None)
        ttl_val = None
        if callable(ttl_fn):
            try:
                ttl_val = await ttl_fn(key)
            except Exception:
                ttl_val = None

        data = _canon(merged)

        try:
            if ttl_val and isinstance(ttl_val, int) and ttl_val > 0:
                await self.r.set(key, data, ex=ttl_val)
            else:
                await self.r.set(key, data, ex=self.ttl)
        except TypeError:
            setex = getattr(self.r, "setex", None)
            if callable(setex):
                await setex(key, ttl_val if (isinstance(ttl_val, int) and ttl_val > 0) else self.ttl, data)
            else:
                await self.r.set(key, data)
                expire = getattr(self.r, "expire", None)
                if callable(expire):
                    await expire(key, ttl_val if (isinstance(ttl_val, int) and ttl_val > 0) else self.ttl)

        return True

    async def peek(self, thread_id: str) -> bool:
        raw = await self.r.get(self._key(thread_id))
        return raw is not None

    async def pop(self, thread_id: str) -> Optional[dict]:
        k = self._key(thread_id)
        getdel = getattr(self.r, "getdel", None)
        if callable(getdel):
            raw = await getdel(k)
        else:
            raw = await self.r.get(k)
            if raw:
                try:
                    await self.r.delete(k)
                except AttributeError:
                    del_fn = getattr(self.r, "del", None)
                    if callable(del_fn):
                        await del_fn(k)

        return _decode(raw)

CONFIRM_WORDS = {
    "sí", "si", "dale", "confirma", "confirmo", "hazlo", "adelante",
    "ok", "procede", "de acuerdo", "listo", "va", "vale"
}

def is_confirmation(msg: str | None) -> bool:
    if not msg:
        return False
    m = msg.strip().lower()
    return any(w in m for w in CONFIRM_WORDS)