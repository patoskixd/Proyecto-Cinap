from typing import Dict
from datetime import datetime
from uuid import uuid4
from entities.event import Event
from usecases.ports import EventRepository

class InMemoryEventRepository(EventRepository):
    def __init__(self) -> None:
        self._items: Dict[str, Event] = {}

    def add(self, title: str, start: datetime, end: datetime) -> Event:
        e = Event(id=str(uuid4()), title=title, start=start, end=end)
        self._items[e.id] = e
        return e

    def list(self) -> list[Event]:
        return sorted(self._items.values(), key=lambda e: (e.start, e.title.lower()))

    def get(self, id: str) -> Event | None:
        return self._items.get(id)

    def delete(self, id: str) -> None:
        self._items.pop(id, None)