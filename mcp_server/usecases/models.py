from dataclasses import dataclass
from datetime import datetime

@dataclass
class CreateEventRequest:
    title: str
    start: datetime
    end: datetime

@dataclass
class EventResponse:
    id: str
    title: str
    start: datetime
    end: datetime

@dataclass
class ListEventsResponse:
    items: list[EventResponse]