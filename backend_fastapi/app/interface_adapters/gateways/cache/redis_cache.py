from __future__ import annotations
from typing import Optional
from redis.asyncio import Redis

class RedisCache:
    def __init__(self, redis: Redis):
        self._r = redis

    async def get(self, key: str) -> Optional[bytes]:
        return await self._r.get(key)

    async def set(self, key: str, value: bytes, ttl_seconds: int | None = None) -> None:
        if ttl_seconds:
            await self._r.set(key, value, ex=ttl_seconds)
        else:
            await self._r.set(key, value)

    async def delete(self, key: str) -> None:
        await self._r.delete(key)

    async def acquire_lock(self, key: str, ttl_seconds: int = 10) -> bool:
        ok = await self._r.set(f"lock:{key}", b"1", ex=ttl_seconds, nx=True)
        return bool(ok)

    async def release_lock(self, key: str) -> None:
        await self._r.delete(f"lock:{key}")
