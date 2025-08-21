from dataclasses import dataclass
from datetime import datetime
from typing import List

@dataclass(frozen=True)
class Attendee:
    email: str
    display_name: str | None = None

@dataclass(frozen=True)
class Event:
    id: str | None
    title: str
    start: datetime
    end: datetime
    attendees: List[Attendee]
    location: str | None = None
    description: str | None = None