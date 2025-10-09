from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from usecases.models import EventResponse, ListEventsResponse

class EventOut(BaseModel):
    id: str
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    description: str | None = None
    location: str | None = None
    attendees: List[str] = []

def present_event(resp: EventResponse) -> EventOut:
    return EventOut.model_validate(resp.__dict__)

def present_list(resp: ListEventsResponse) -> list[EventOut]:
    return [present_event(it) for it in resp.items]