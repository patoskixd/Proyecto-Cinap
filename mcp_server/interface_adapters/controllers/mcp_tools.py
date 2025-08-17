from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class EventCreateIn(BaseModel):
    calendar_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    start: datetime
    end: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    requested_by_role: Optional[str] = None
    requested_by_email: Optional[str] = None

class ListEventsIn(BaseModel):
    calendar_id: str
    time_min: Optional[datetime] = None
    time_max: Optional[datetime] = None
    q: Optional[str] = None
    max_results: int = 100

class EventKeyIn(BaseModel):
    calendar_id: str
    event_id: str

class EventUpdateIn(BaseModel):
    calendar_id: str
    event_id: str
    title: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None