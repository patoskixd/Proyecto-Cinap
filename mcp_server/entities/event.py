from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List

@dataclass
class Event:
    id: str
    calendar_id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: List[str] = field(default_factory=list)
    requested_by_role: Optional[str] = None
    requested_by_email: Optional[str] = None