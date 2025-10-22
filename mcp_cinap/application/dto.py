from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from uuid import UUID

@dataclass
class AvailabilityIn:
    servicio_id: UUID
    start: datetime
    end: datetime
    page: int = 1
    per_page: int = 50
    asesor_id: Optional[UUID] = None

@dataclass
class SlotOut:
    id: UUID
    inicio: datetime
    fin: datetime
    servicio_id: UUID

@dataclass
class OverlapIn:
    asesor_id: UUID
    start: datetime
    end: datetime
    include_calendar: bool = False

@dataclass
class OverlapOut:
    source: str
    id: Optional[UUID]
    inicio: datetime
    fin: datetime
    estado: Optional[str] = None
