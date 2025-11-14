from dataclasses import dataclass
from typing import Literal, Sequence, Dict, Any
from uuid import UUID
from application.ports import UnitOfWork, TimeRange

@dataclass
class ListUserAsesoriasIn:
    user_docente_id: UUID | None
    user_asesor_id: UUID | None
    tr: TimeRange
    role: Literal["auto","docente","asesor"] = "auto"
    states: Sequence[str] = ()
    page: int = 1
    per_page: int = 10

class ListUserAsesorias:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def execute(self, inp: ListUserAsesoriasIn) -> Sequence[Dict[str, Any]]:
        out: list[Dict[str, Any]] = []

        if inp.role in ("docente","auto") and inp.user_docente_id:
            rows = await self.uow.appointments.list_for_docente_range(
                inp.user_docente_id, inp.tr, inp.states, inp.page, inp.per_page
            )
            for r in rows: r["rol"] = "docente"
            out.extend(rows)

        if inp.role in ("asesor","auto") and inp.user_asesor_id:
            rows = await self.uow.appointments.list_for_asesor_range(
                inp.user_asesor_id, inp.tr, inp.states, inp.page, inp.per_page
            )
            for r in rows: r["rol"] = "asesor"
            out.extend(rows)

        out.sort(key=lambda r: r["inicio"], reverse=True)
        return out