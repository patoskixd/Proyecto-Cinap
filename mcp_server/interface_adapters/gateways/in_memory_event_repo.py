from typing import Dict, List, Optional
from datetime import datetime
from uuid import uuid4
from entities.event import Event
from usecases.ports import EventRepository

class InMemoryEventRepository(EventRepository):
    def __init__(self) -> None:
        self._items: Dict[tuple[str, str], Event] = {}

    def add(
        self, *,
        calendar_id: str,
        title: str,
        start: datetime,
        end: datetime,
        description: Optional[str],
        location: Optional[str],
        attendees: List[str],
        requested_by_role: Optional[str],
        requested_by_email: Optional[str],
    ) -> Event:
        ev = Event(
            id=str(uuid4()),
            calendar_id=calendar_id,
            title=title,
            start=start,
            end=end,
            description=description,
            location=location,
            attendees=attendees,
            requested_by_role=requested_by_role,
            requested_by_email=requested_by_email,
        )
        self._items[(calendar_id, ev.id)] = ev
        return ev

    def list(
        self, *,
        calendar_id: str,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        q: Optional[str] = None,
        max_results: int = 100,
    ) -> List[Event]:
        events = [e for (cid, _), e in self._items.items() if cid == calendar_id]
        if time_min:
            events = [e for e in events if e.start >= time_min]
        if time_max:
            events = [e for e in events if e.start <= time_max]
        if q:
            ql = q.lower()
            events = [e for e in events if ql in e.title.lower() or ql in (e.description or "").lower()]
        events.sort(key=lambda e: (e.start, e.title.lower()))
        return events[:max_results]

    def get(self, *, calendar_id: str, event_id: str) -> Optional[Event]:
        return self._items.get((calendar_id, event_id))

    def delete(self, *, calendar_id: str, event_id: str) -> None:
        self._items.pop((calendar_id, event_id), None)

    def update(
        self,
        *,
        calendar_id: str,
        event_id: str,
        title: Optional[str] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> Event:
        key = (calendar_id, event_id)
        ev = self._items.get(key)
        if not ev:
            raise ValueError("Event not found")

        if title is not None:
            ev.title = title
        if start is not None:
            ev.start = start
        if end is not None:
            ev.end = end
        if description is not None:
            ev.description = description
        if location is not None:
            ev.location = location
        if attendees is not None:
            ev.attendees = attendees
        self._items[key] = ev
        return ev