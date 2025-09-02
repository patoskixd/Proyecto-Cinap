from typing import Protocol
from datetime import datetime

class ClockPort(Protocol):
    def now_utc(self) -> datetime: ...