from typing import Protocol, Sequence, Optional
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

@dataclass
class TimeRange:
    start: datetime
    end: datetime

@dataclass
class Pagination:
    page: int = 1
    per_page: int = 50

class UnitOfWork(Protocol):
    async def __aenter__(self): ...
    async def __aexit__(self, exc_type, exc, tb): ...
    @property
    def slots(self) -> "SlotRepository": ...
    @property
    def appointments(self) -> "AppointmentRepository": ...

class SlotRepository(Protocol):
    async def list_open_by_advisor_service_range(
        self, asesor_id: UUID, servicio_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[dict]: ...
    async def list_open_by_advisor_range(
        self, asesor_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[dict]: ...
    async def list_open_by_service_range(
        self, servicio_id: UUID, tr: TimeRange, pag: Pagination
    ) -> Sequence[dict]: ...

class AppointmentRepository(Protocol):
    async def list_overlaps_for_advisor(
        self, asesor_id: UUID, tr: TimeRange, states: Sequence[str]
    ) -> Sequence[dict]: ...
    async def list_for_docente_range(
        self, docente_id: UUID, tr: TimeRange, states: Sequence[str], page: int, per_page: int
    ) -> Sequence[dict]: ...
    async def list_for_asesor_range(
        self, asesor_id: UUID, tr: TimeRange, states: Sequence[str], page: int, per_page: int
    ) -> Sequence[dict]: ...

class CalendarGateway(Protocol):
    async def advisor_busy_intervals(self, asesor_id: int, tr: TimeRange) -> Sequence[TimeRange]: ...

class AdvisorRepository(Protocol):
    async def find_by_email(self, email: str) -> Optional[dict]: ...
    async def search_by_name(self, text: str, limit: int = 10) -> Sequence[dict]: ...
    async def get_by_ids(self, ids: Sequence[UUID]) -> Sequence[dict]: ...

class ServiceRepository(Protocol):
    async def search_by_name(self, text: str, limit: int = 10) -> Sequence[dict]: ...
    async def get_by_id(self, service_id: UUID) -> Optional[dict]: ...
    async def get_by_ids(self, ids: Sequence[UUID]) -> Sequence[dict]: ...

class CalendarEventsRepo(Protocol):
    async def upsert_calendar_event(
        self, *,
        asesoria_id: str,
        organizer_usuario_id: str,
        calendar_event_id: str,
        html_link: Optional[str] = None
    ) -> None: ...