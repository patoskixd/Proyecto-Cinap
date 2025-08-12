from dataclasses import dataclass
from datetime import datetime

@dataclass
class Event:
    id: str
    title: str
    start: datetime
    end: datetime