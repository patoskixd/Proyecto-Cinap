from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass(frozen=True)
class Advisor:
    id: int
    nombre: str

@dataclass(frozen=True)
class Service:
    id: int
    nombre: str

@dataclass
class Slot:
    id: int
    asesor_id: int
    servicio_id: int
    inicio: datetime
    fin: datetime
    estado: str

@dataclass
class Appointment:
    id: int
    docente_id: int
    cupo_id: int
    estado: str
    origen: str
    notas: Optional[str] = None
