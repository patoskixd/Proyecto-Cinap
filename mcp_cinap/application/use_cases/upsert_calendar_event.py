from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
from application.ports import CalendarEventsRepo

@dataclass(frozen=True)
class UpsertCalendarEventIn:
    asesoria_id: str
    organizer_usuario_id: str
    calendar_event_id: str
    html_link: Optional[str] = None

class UpsertCalendarEvent:
    def __init__(self, repo: CalendarEventsRepo):
        self.repo = repo

    async def exec(self, i: UpsertCalendarEventIn) -> dict:
        await self.repo.upsert_calendar_event(
            asesoria_id=i.asesoria_id,
            organizer_usuario_id=i.organizer_usuario_id,
            calendar_event_id=i.calendar_event_id,
            html_link=i.html_link
        )
        return {
            "asesoria_id": i.asesoria_id,
            "calendar_event_id": i.calendar_event_id,
            "html_link": i.html_link
        }