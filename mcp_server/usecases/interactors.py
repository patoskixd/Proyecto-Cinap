from datetime import datetime
from entities.event import Event
from usecases.ports import EventRepository
from usecases.models import CreateEventRequest, EventResponse, ListEventsResponse

def _validate_title(title: str) -> None:
    if not title or not title.strip():
        raise ValueError("title es requerido")

def _validate_times(start: datetime, end: datetime) -> None:
    if start >= end:
        raise ValueError("start debe ser antes que end")

class CreateEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, req: CreateEventRequest) -> EventResponse:
        _validate_title(req.title)
        _validate_times(req.start, req.end)
        e = self.repo.add(req.title, req.start, req.end)
        return EventResponse(id=e.id, title=e.title, start=e.start, end=e.end)

class ListEvents:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self) -> ListEventsResponse:
        items = [
            EventResponse(id=e.id, title=e.title, start=e.start, end=e.end)
            for e in self.repo.list()
        ]
        return ListEventsResponse(items=items)

class GetEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, id: str) -> Event | None:
        e = self.repo.get(id)
        if not e:
            return None
        return EventResponse(id=e.id, title=e.title, start=e.start, end=e.end)

class DeleteEvent:
    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    def execute(self, id: str) -> None:
        self.repo.delete(id)