# metrics.py (extensión)
from __future__ import annotations
import json, time, uuid, logging, inspect, threading, asyncio
from typing import Any, Callable, Dict, Optional
from contextvars import ContextVar
from contextlib import contextmanager, asynccontextmanager

_trace_ctx: ContextVar[Dict[str, Any]] = ContextVar("_trace_ctx", default={})

def _now() -> float:
    return time.perf_counter()

def _get_trace() -> Dict[str, Any]:
    t = _trace_ctx.get()
    if not t:
        t = {"request_id": str(uuid.uuid4()), "stages": [], "meta": {}}
        _trace_ctx.set(t)
    return t

def set_meta(**kwargs) -> None:
    _get_trace()["meta"].update(kwargs)

def _append_stage(name, elapsed, ok, err, extra=None):
    rec = {
        "name": name,
        "elapsed_sec": round(elapsed, 6),
        "elapsed_ms": round(elapsed * 1000, 2),  # Agregar milisegundos para facilitar lectura
        "ok": ok,
        "error": err,
        "thread": threading.current_thread().name,
        "timestamp": time.time(),  # Timestamp absoluto para ordenar eventos
    }
    try:
        asyncio.get_running_loop()
        rec["loop"] = "event_loop"
    except RuntimeError:
        rec["loop"] = "no_loop"
    if extra: rec["extra"] = extra
    _get_trace()["stages"].append(rec)

def measure_stage(name: str, extra: Optional[Callable[..., Dict[str, Any]]] = None):
    def decorator(func: Callable):
        is_coro = inspect.iscoroutinefunction(func)

        async def _async(*args, **kwargs):
            start = _now(); ok=True; err=None; xtra=None
            try:
                res = await func(*args, **kwargs)
                return res
            except Exception as e:
                ok=False; err=f"{type(e).__name__}: {e}"
                raise
            finally:
                if extra:
                    try: xtra = extra(*args, **kwargs)
                    except Exception: xtra = None
                _append_stage(name, _now()-start, ok, err, xtra)

        def _sync(*args, **kwargs):
            start = _now(); ok=True; err=None; xtra=None
            try:
                res = func(*args, **kwargs)
                return res
            except Exception as e:
                ok=False; err=f"{type(e).__name__}: {e}"
                raise
            finally:
                if extra:
                    try: xtra = extra(*args, **kwargs)
                    except Exception: xtra = None
                _append_stage(name, _now()-start, ok, err, xtra)

        return _async if is_coro else _sync
    return decorator

@contextmanager
def stage(name: str, extra: Optional[Dict[str, Any]] = None):
    start = _now(); ok=True; err=None
    try:
        yield
    except Exception as e:
        ok=False; err=f"{type(e).__name__}: {e}"
        raise
    finally:
        _append_stage(name, _now()-start, ok, err, extra)

@asynccontextmanager
async def astage(name: str, extra: Optional[Dict[str, Any]] = None):
    start = _now(); ok=True; err=None
    try:
        yield
    except Exception as e:
        ok=False; err=f"{type(e).__name__}: {e}"
        raise
    finally:
        _append_stage(name, _now()-start, ok, err, extra)

class JsonLineFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = record.msg if isinstance(record.msg, dict) else {"message": record.getMessage()}
        payload.setdefault("level", record.levelname)
        payload.setdefault("logger", record.name)
        payload.setdefault("ts_unix", time.time())
        return json.dumps(payload, ensure_ascii=False)

def setup_json_logger(logger_name: str = "timings", level: int = logging.INFO,
                      log_file: Optional[str] = "logs/timings.jsonl") -> logging.Logger:
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)
    logger.handlers = []
    fmt = JsonLineFormatter()
    sh = logging.StreamHandler(); sh.setFormatter(fmt); logger.addHandler(sh)
    if log_file:
        # Crear directorio logs si no existe
        import os
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt); logger.addHandler(fh)
    return logger

def new_request(request_id: Optional[str] = None) -> str:
    rid = request_id or str(uuid.uuid4())
    _trace_ctx.set({"request_id": rid, "stages": [], "meta": {}})
    return rid

def _group_sums(stages):
    sums = {}
    details = {}  
    
    for s in stages:
        n = s.get("name","")
        if n.endswith(".total"):
            continue
        top = n.split(".", 1)[0] if "." in n else n
        sums[top] = round(sums.get(top, 0.0) + float(s["elapsed_sec"]), 6)
        
        # Agregar detalles específicos para análisis
        if top not in details:
            details[top] = []
        details[top].append({
            "stage": n,
            "ms": s.get("elapsed_ms", 0),
            "ok": s.get("ok", True)
        })
    
    return sums, details

def finalize_and_log(logger: logging.Logger, base_record: Dict[str, Any]) -> Dict[str, Any]:
    trace = _get_trace()
    total = next((s["elapsed_sec"] for s in trace["stages"] if s["name"]=="http_total"), 0.0)
    if total == 0.0:
        total = round(sum(float(s["elapsed_sec"]) for s in trace["stages"]), 6)
    by_group, details = _group_sums(trace["stages"])

    record = {
        **base_record,
        "request_id": trace["request_id"],
        "meta": trace["meta"],
        "stages": trace["stages"],
        "by_group": by_group,
        "stage_details": details,  # Nuevos detalles por categoría
        "total_elapsed_sec": round(total, 6),
        "total_elapsed_ms": round(total * 1000, 2),  
    }
    
    # Para Telegram, agregar métricas específicas en formato legible
    is_telegram = any(s.get("name", "").startswith("telegram.") for s in trace["stages"])
    if is_telegram:
        telegram_breakdown = {}
        for stage in trace["stages"]:
            name = stage.get("name", "")
            if name.startswith("telegram."):
                stage_name = name.replace("telegram.", "")
                telegram_breakdown[stage_name] = round(stage.get("elapsed_ms", 0), 1)
        record["telegram_breakdown_ms"] = telegram_breakdown
    
    logger.info(record)
    return record

def _is_in_async_context() -> bool:
    """Verifica si estamos en un contexto asíncrono"""
    try:
        asyncio.get_running_loop()
        return True
    except RuntimeError:
        return False

