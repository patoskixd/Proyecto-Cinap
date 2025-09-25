from __future__ import annotations
import time
from typing import Any, Dict, Optional

from langchain_core.callbacks import BaseCallbackHandler

from app.observability.metrics import _append_stage

class MetricsCallbackHandler(BaseCallbackHandler):
    """
    Mide con precisión la llamada al modelo (tiempo de red/inferencia) y, si existe,
    adjunta uso de tokens. Compatible con ChatOpenAI (langchain_openai).
    """
    def __init__(self, stage_name: str = "llm.http"):
        self.stage_name = stage_name
        self._t0: Optional[float] = None
        self._prompt_chars: int = 0

    def on_llm_start(self, serialized: Dict[str, Any], prompts: list[str], **kwargs: Any) -> None:
        self._t0 = time.perf_counter()
        self._prompt_chars = sum(len(p) for p in (prompts or []))

    def on_llm_end(self, response, **kwargs: Any) -> None:
        elapsed = time.perf_counter() - (self._t0 or time.perf_counter())
        usage = self._extract_usage(response)

        _append_stage(
            self.stage_name,
            elapsed,
            True,
            None,
            extra={
                "prompt_chars": self._prompt_chars,
                "input_tokens": usage.get("prompt_tokens"),
                "output_tokens": usage.get("completion_tokens"),
                "total_tokens": usage.get("total_tokens"),
            },
        )

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> None:
        elapsed = time.perf_counter() - (self._t0 or time.perf_counter())
        _append_stage(self.stage_name, elapsed, False, f"{type(error).__name__}: {error}")

    def _extract_usage(self, llm_result) -> Dict[str, int]:
        usage = {}
        try:
            lo = (getattr(llm_result, "llm_output", None) or {})  # dict
            usage = (
                lo.get("token_usage")
                or lo.get("usage")
                or lo.get("openai", {}).get("usage")
                or {}
            )
        except Exception:
            usage = {}

        return {
            "prompt_tokens": usage.get("prompt_tokens") or usage.get("input_tokens"),
            "completion_tokens": usage.get("completion_tokens") or usage.get("output_tokens"),
            "total_tokens": usage.get("total_tokens"),
        }
