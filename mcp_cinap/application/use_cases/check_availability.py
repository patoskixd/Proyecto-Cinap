from typing import List
from application.dto import AvailabilityIn, SlotOut
from application.ports import UnitOfWork, TimeRange, Pagination
from domain.errors import ValidationError

class CheckAvailability:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def execute(self, data: AvailabilityIn) -> List[SlotOut]:
        if data.start >= data.end:
            raise ValidationError("Rango horario inválido")
        tr = TimeRange(start=data.start, end=data.end)
        pag = Pagination(page=data.page, per_page=data.per_page)

        async with self.uow:
            if data.servicio_id:
                rows = await self.uow.slots.list_open_by_advisor_service_range(
                    data.asesor_id, data.servicio_id, tr, pag
                )
            else:
                rows = await self.uow.slots.list_open_by_advisor_range(
                    data.asesor_id, tr, pag
                )
        return [SlotOut(id=r["id"], inicio=r["inicio"], fin=r["fin"], servicio_id=r["servicio_id"]) for r in rows]
