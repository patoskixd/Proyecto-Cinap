from pydantic import BaseModel
from datetime import datetime

class EventCreateIn(BaseModel):
    title: str
    start: datetime
    end: datetime

class EventIdIn(BaseModel):
    id: str