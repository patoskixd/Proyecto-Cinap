from fastapi import Request, HTTPException
from app.use_cases.ports.cache_port import CachePort

def make_simple_limiter(cache: CachePort, limit:int, window_sec:int):
    async def limiter(request: Request):
        ip = request.client.host if request.client else "unknown"
        key = f"rl:{request.url.path}:{ip}"
        val = await cache.get(key)
        cnt = int(val) if val else 0
        if cnt >= limit:
            raise HTTPException(status_code=429, detail="Too Many Requests")
        if cnt == 0:
            await cache.set(key, b"1", ttl_seconds=window_sec)
        else:
            await cache.set(key, str(cnt+1).encode(), ttl_seconds=window_sec)
    return limiter