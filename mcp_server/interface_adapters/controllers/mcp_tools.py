from pydantic import BaseModel, Field
from datetime import datetime
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

class EventUpdateFlexibleIn(BaseModel):
    selector: Union[UpdateSelectorById, UpdateSelectorByTitle]
    patch: UpdatePatch

class DeleteByTitleIn(BaseModel):
    calendar_id: Optional[str] = Field(None, description="Opcional; por defecto 'primary'")
    title: str = Field(..., description="Título del evento a eliminar")
    start_from: Optional[datetime] = Field(None, description="Opcional; inicio de ventana")
    end_to: Optional[datetime] = Field(None, description="Opcional; fin de ventana")
    description_contains: Optional[str] = Field(None, description="Opcional; texto a filtrar en la descripción")