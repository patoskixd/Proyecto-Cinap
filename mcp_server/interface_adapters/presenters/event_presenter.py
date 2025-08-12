from datetime import datetime
from pydantic import BaseModel
from usecases.models import EventResponse, ListEventsResponse

class EventOut(BaseModel):
    id: str
    title: str
    start: datetime
    end: datetime

def present_event(resp: EventResponse) -> EventOut:
    return EventOut.model_validate({"id": resp.id, "title": resp.title, "start": resp.start, "end": resp.end})

def present_list(resp: ListEventsResponse) -> list[EventOut]:
    return [present_event(item) for item in resp.items]