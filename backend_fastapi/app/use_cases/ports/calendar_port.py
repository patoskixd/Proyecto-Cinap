from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, Sequence, Optional

@dataclass(frozen=True)
class CalendarAttendee:
    email: str
    display_name: Optional[str] = None
    optional: bool = False
    response_status: Optional[str] = None 

@dataclass(frozen=True)
class CalendarEventInput:
    organizer_usuario_id: str  
    title: str
    start: datetime           
    end: datetime             
    attendees: Sequence[CalendarAttendee]
    location: Optional[str] = None
    description: Optional[str] = None
    create_meet_link: bool = True

@dataclass(frozen=True)
class CalendarEventOut:
    provider_event_id: str
    html_link: str | None

class CalendarPort(Protocol):
    async def create_event(self, data: CalendarEventInput) -> CalendarEventOut: ...
    async def get_event(self, *, organizer_usuario_id: str, event_id: str) -> dict: ...
    async def watch_primary_calendar(self, *, organizer_usuario_id: str, callback_url: str,
                                     channel_id: str, token: str | None = None,
                                     ttl_seconds: int = 86_000) -> dict: ...