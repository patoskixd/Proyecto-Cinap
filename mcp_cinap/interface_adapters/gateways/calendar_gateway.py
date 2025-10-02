from typing import Sequence
from application.ports import CalendarGateway, TimeRange

class NullCalendarGateway(CalendarGateway):
    async def advisor_busy_intervals(self, asesor_id: int, tr: TimeRange) -> Sequence[TimeRange]:
        return []

class MCPCalendarGateway(CalendarGateway):
    def __init__(self, mcp_client):
        self.client = mcp_client

    async def advisor_busy_intervals(self, asesor_id: int, tr: TimeRange) -> Sequence[TimeRange]:
        return []
