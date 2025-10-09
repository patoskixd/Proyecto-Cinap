from typing import Optional
from entities.event import Event
from usecases.ports import EventRepository
from usecases.models import (
    CreateEventRequest, EventResponse,
    ListEventsRequest, ListEventsResponse, UpdateEventRequest
)

def _validate_title(title: str) -> None:
    if not title or not title.strip():
        raise ValueError("title es requerido")

def _validate_times(start, end) -> None:
    if start >= end:
        raise ValueError("start debe ser anterior a end")

def _to_response(e: Event) -> EventResponse:
    return EventResponse(
        id=e.id,
        calendar_id=e.calendar_id,
        title=e.title,
        start=e.start,
        end=e.end,
        description=e.description,
        location=e.location,
        attendees=list(e.attendees),
    )

class CreateEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, req: CreateEventRequest) -> EventResponse:
        _validate_title(req.title)
        _validate_times(req.start, req.end)
        ev = self.repo.add(
            calendar_id=req.calendar_id,
            title=req.title,
            start=req.start,
            end=req.end,
            oauth_access_token=req.oauth_access_token,
            description=req.description,
            location=req.location,
            attendees=req.attendees or [],
            send_updates=req.send_updates,
        )
        return _to_response(ev)

class ListEvents:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, req: ListEventsRequest) -> ListEventsResponse:
        items = [
            _to_response(e) for e in self.repo.list(
                calendar_id=req.calendar_id,
                time_min=req.time_min,
                time_max=req.time_max,
                q=req.q,
                max_results=req.max_results,
            )
        ]
        return ListEventsResponse(items=items)

class GetEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, *, calendar_id: str, event_id: str):
        e = self.repo.get(calendar_id=calendar_id, event_id=event_id)
        return _to_response(e) if e else None

class DeleteEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, *, calendar_id: str, event_id: str) -> None:
        self.repo.delete(calendar_id=calendar_id, event_id=event_id)

class UpdateEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, req: UpdateEventRequest) -> Optional[EventResponse]:
        current = self.repo.get(calendar_id=req.calendar_id, event_id=req.event_id)
        if not current:
            return None

        new_title = req.title if req.title is not None else current.title
        new_start = req.start if req.start is not None else current.start
        new_end   = req.end   if req.end   is not None else current.end
        new_desc  = req.description if req.description is not None else current.description
        new_loc   = req.location    if req.location    is not None else current.location
        new_atts  = req.attendees   if req.attendees   is not None else current.attendees

        _validate_title(new_title)
        if new_start >= new_end:
            raise ValueError("start debe ser anterior a end")

        updated = self.repo.update(
            calendar_id=req.calendar_id,
            event_id=req.event_id,
            title=req.title,
            start=req.start,
            end=req.end,
            description=req.description,
            location=req.location,
            attendees=req.attendees,
        )
        return _to_response(updated)