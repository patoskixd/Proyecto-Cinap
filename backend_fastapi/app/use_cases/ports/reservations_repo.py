from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional, Sequence
from uuid import UUID


@dataclass(frozen=True)
class ReservationRecord:
    id: UUID
    inicio: datetime
    fin: datetime
    estado: str
    servicio_id: UUID
    servicio_nombre: str
    categoria_id: UUID
    categoria_nombre: str
    duracion_minutos: Optional[int]
    asesor_id: Optional[UUID]
    asesor_usuario_id: Optional[UUID]
    asesor_nombre: Optional[str]
    asesor_email: Optional[str]
    docente_nombre: str
    docente_email: str
    location_text: Optional[str]


@dataclass(frozen=True)
class ReservationsPage:
    items: Sequence[ReservationRecord]
    total: int
    page: int
    pages: int


@dataclass(frozen=True)
class ReservationsQuery:
    role: str
    profile_id: Optional[UUID]
    kind: str  # "upcoming" | "past"
    page: int
    limit: int
    status: Optional[str] = None
    category: Optional[str] = None
    service: Optional[str] = None
    advisor: Optional[str] = None
    date_from: Optional[date] = None


class ReservationsRepo:
    async def list(self, query: ReservationsQuery) -> ReservationsPage:
        raise NotImplementedError

    async def get_reservation_context(self, asesoria_id: UUID) -> dict:
        raise NotImplementedError
