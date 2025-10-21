from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any, Union

@dataclass
class CreateEventRequest:
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    oauth_access_token: str
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    send_updates: str = "all"

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
    html_link: Optional[str] = None

@dataclass
class ListEventsRequest:
    calendar_id: str
    oauth_access_token: str
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
    oauth_access_token: str
    send_updates: str = "all"
    title: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[Union[List[str], List[Dict[str, Any]]]] = None
    absolute_patch: Optional[Dict[str, Any]] = None        