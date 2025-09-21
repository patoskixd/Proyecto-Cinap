from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Protocol


@dataclass
class CreateAsesoriaIn:
    docente_usuario_id: str 
    cupo_id: str
    origen: Optional[str] = None
    notas: Optional[str] = None


@dataclass
class CreateAsesoriaOut:
    asesoria_id: str
    cupo_id: str
    estado: str              
    creado_en: str
    servicio_nombre: str
    categoria_nombre: str
    docente_nombre: str
    docente_email: str
    inicio: str
    fin: str
    edificio_nombre: str | None
    campus_nombre: str | None
    sala_numero: str | None
    recurso_alias: str | None


class AsesoriaRepo(Protocol):
    async def create_and_reserve(self, input: CreateAsesoriaIn) -> CreateAsesoriaOut: ...
