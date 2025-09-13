from pydantic import BaseModel, Field
from datetime import date, datetime, time
from typing import Optional, List, Union

class EventCreateIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")
    title: str
    start: datetime
    end: datetime
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    description: Optional[str] = None

class ListEventsIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")
    start_from: datetime
    end_to: datetime

class EventKeyIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")
    event_id: str

class FindEventIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")
    title: str
    start_from: Optional[datetime] = None
    end_to:   Optional[datetime] = None

class UpdateSelectorById(BaseModel):
    event_id: str
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")

class UpdateSelectorByTitle(BaseModel):
    title: str
    start_from: Optional[datetime] = None
    end_to: Optional[datetime] = None
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto primary")

class UpdatePatch(BaseModel):
    title: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    description: Optional[str] = None
    shift_minutes: Optional[int] = None
    shift_days: Optional[int] = None
    new_date: Optional[date] = None
    new_start_time: Optional[time] = None
    new_end_time: Optional[time] = None
    keep_duration: bool = True

class EventUpdateFlexibleIn(BaseModel):
    selector: Union[UpdateSelectorById, UpdateSelectorByTitle]
    patch: UpdatePatch

class DeleteIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto 'primary'")
    event_id: Optional[str] = Field(None, description="Si se especifica, elimina por ID (ignora título/filtros)")
    title: Optional[str] = Field(None, description="Título del evento a eliminar (si no se envía event_id)")
    start_from: Optional[datetime] = Field(None, description="Inicio de ventana para búsqueda por título")
    end_to: Optional[datetime] = Field(None, description="Fin de ventana para búsqueda por título")
    description_contains: Optional[str] = Field(None, description="Filtro opcional por fragmento en descripción")
    attendee_contains: Optional[str] = Field(None, description="Filtro opcional por substring de email del asistente")
