from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

@dataclass
class CreateEventRequest:
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    requested_by_role: Optional[str] = None
    requested_by_email: Optional[str] = None

@dataclass
class EventResponse:
    id: str
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str]
    location: Optional[str]
    attendees: List[str]
    requested_by_role: Optional[str]
    requested_by_email: Optional[str]

@dataclass
class ListEventsRequest:
    calendar_id: str
    time_min: Optional[datetime] = None
    time_max: Optional[datetime] = None
    q: Optional[str] = None
    max_results: int = 100

@dataclass
class ListEventsResponse:
    items: List[EventResponse]

@dataclass
class UpdateEventRequest:
    calendar_id: str
    event_id: str
    title: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None