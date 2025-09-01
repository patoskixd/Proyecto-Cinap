from typing import Optional
from datetime import datetime

class CalendarToolset:
    def __init__(self, create_uc, list_uc):
        self._create_uc = create_uc
        self._list_uc = list_uc

    def create_event(self, title: str, start_iso: str, end_iso: str, description: str = "", calendar_id: Optional[str] = None) -> str:
        resp = self._create_uc.execute({
            "title": title,
            "start": start_iso,
            "end": end_iso,
            "description": description,
            "calendar_id": calendar_id or "primary",
        })
        return f"Evento creado: {resp.get('id', 'sin_id')} - {title}"

    def list_events(self, start_iso: str, end_iso: str, calendar_id: Optional[str] = None) -> str:
        resp = self._list_uc.execute({
            "calendar_id": calendar_id or "primary",
            "time_min": datetime.fromisoformat(start_iso),
            "time_max": datetime.fromisoformat(end_iso),
        })
        return repr(resp)
