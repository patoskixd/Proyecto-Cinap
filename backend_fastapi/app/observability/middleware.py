from __future__ import annotations
import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .metrics import _get_trace, new_request, finalize_and_log, setup_json_logger, set_meta

_timelogger = setup_json_logger("timings", log_file="logs/timings.jsonl")

class JSONTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        rid = request.headers.get("X-Request-ID")
        if not rid:
            rid = new_request()
        else:
            new_request(rid)

        set_meta(
            method=request.method,
            path=str(request.url.path),
            client=str(request.client.host if request.client else None),
            user_agent=request.headers.get("user-agent"),
        )

        start = time.perf_counter()
        try:
            response = await call_next(request)
            ok, err = True, None
        except Exception as e:
            response = Response(status_code=500, media_type="application/json")
            ok, err = False, f"{type(e).__name__}: {e}"
            raise
        finally:
            elapsed = round(time.perf_counter() - start, 6)
            elapsed_ms = round(elapsed * 1000, 1)  # Convertir a milisegundos con 1 decimal
            
            _get_trace()["stages"].append({
                "name": "http_total", "elapsed_sec": elapsed, "ok": ok, "error": err
            })
            base_record = {
                "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime()),
                "http": {"status": getattr(response, "status_code", None)},
                "timing_summary": {
                    "total_seconds": elapsed,
                    "total_ms": elapsed_ms
                }
            }
            finalize_and_log(_timelogger, base_record)

        response.headers["X-Request-ID"] = rid
        return response
