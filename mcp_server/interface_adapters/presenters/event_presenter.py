from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from usecases.models import EventResponse, ListEventsResponse

class EventOut(BaseModel):
    id: str
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: List[str] = Field(default_factory=list)
    html_link: Optional[str] = None

def present_event(resp: EventResponse) -> EventOut:
    html_link = getattr(resp, "html_link", None)
    if html_link is None:
        html_link = getattr(resp, "htmlLink", None)
    return EventOut(
        id=getattr(resp, "id"),
        calendar_id=getattr(resp, "calendar_id"),
        title=getattr(resp, "title"),
        start=getattr(resp, "start"),
        end=getattr(resp, "end"),
        description=getattr(resp, "description", None),
        location=getattr(resp, "location", None),
        attendees=list(getattr(resp, "attendees", []) or []),
        html_link=html_link,
    )

def present_list(resp: ListEventsResponse) -> list[EventOut]:
    return [present_event(it) for it in resp.items]