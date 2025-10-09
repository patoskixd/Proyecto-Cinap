from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List
from entities.event import Event

class EventRepository(ABC):
    @abstractmethod
    def add(
        self,
        *,
        calendar_id: str,
        title: str,
        start: datetime,
        end: datetime,
        oauth_access_token: str,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None,
        send_updates: str = "all",
    ) -> Event: ...

    @abstractmethod
    def list(
        self,
        *,
        calendar_id: str,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        q: Optional[str] = None,
        max_results: int = 100,
    ) -> List[Event]: ...

    @abstractmethod
    def get(self, *, calendar_id: str, event_id: str) -> Optional[Event]: ...

    @abstractmethod
    def delete(self, *, calendar_id: str, event_id: str) -> None: ...

    @abstractmethod
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
        raise NotImplementedError