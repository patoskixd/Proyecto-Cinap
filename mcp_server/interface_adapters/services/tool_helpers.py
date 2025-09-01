import os
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Tuple

DEFAULT_CALENDAR_ID = os.getenv("DEFAULT_CALENDAR_ID", "primary")
SEARCH_BACK_DAYS = int(os.getenv("DELETE_SEARCH_BACK_DAYS", "30"))
SEARCH_FWD_DAYS  = int(os.getenv("DELETE_SEARCH_FWD_DAYS", "365"))

def with_default_calendar_id(value: Optional[str]) -> str:
    return value or DEFAULT_CALENDAR_ID

def ensure_range(time_min: Optional[datetime], time_max: Optional[datetime]) -> Tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    return time_min or (now - timedelta(days=SEARCH_BACK_DAYS)), time_max or (now + timedelta(days=SEARCH_FWD_DAYS))

def as_items(result: Any) -> List[Any]:
    if isinstance(result, list): return result
    return getattr(result, "items", []) or []

def event_brief(ev) -> dict:
    return {"id": ev.id, "title": ev.title, "start": getattr(ev,"start",None),
            "end": getattr(ev,"end",None), "description": getattr(ev,"description",None)}