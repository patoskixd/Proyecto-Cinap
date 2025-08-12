from abc import ABC, abstractmethod
from datetime import datetime
from entities.event import Event

class EventRepository(ABC):
    @abstractmethod
    def add(self, title: str, start: datetime, end: datetime) -> Event:
        raise NotImplementedError

    @abstractmethod
    def list(self) -> list[Event]:
        raise NotImplementedError

    @abstractmethod
    def get(self, id: str) -> Event | None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, id: str) -> None:
        raise NotImplementedError