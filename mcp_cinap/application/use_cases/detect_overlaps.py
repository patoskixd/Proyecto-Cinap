from typing import List
from application.dto import OverlapIn, OverlapOut
from application.ports import UnitOfWork, CalendarGateway, TimeRange
from domain.errors import ValidationError

_DEFAULT_APPT_STATES = ("PENDIENTE", "CONFIRMADA", "REPROGRAMADA")

class DetectOverlaps:
    def __init__(self, uow: UnitOfWork, calendar: CalendarGateway | None = None):
        self.uow = uow
        self.calendar = calendar

    async def execute(self, data: OverlapIn) -> List[OverlapOut]:
        if data.start >= data.end:
            raise ValidationError("Rango horario inválido")
        tr = TimeRange(start=data.start, end=data.end)
        results: List[OverlapOut] = []

        async with self.uow:
            appts = await self.uow.appointments.list_overlaps_for_advisor(
                data.asesor_id, tr, _DEFAULT_APPT_STATES
            )
        for a in appts:
            results.append(OverlapOut(
                source="ASESORIA", id=a["asesoria_id"],
                inicio=a["inicio"], fin=a["fin"], estado=a["estado"]
            ))

        if data.include_calendar and self.calendar:
            busy = await self.calendar.advisor_busy_intervals(data.asesor_id, tr)
            for b in busy:
                results.append(OverlapOut(source="CALENDAR", id=None, inicio=b.start, fin=b.end))

        results.sort(key=lambda x: x.inicio)
        return results
