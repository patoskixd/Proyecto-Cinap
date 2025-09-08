from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.use_cases.ports.slots_port import SlotsRepo

@dataclass
class UIRuleIn:
    day: str
    startTime: str
    endTime: str
    isoDate: Optional[str] = None

@dataclass
class OpenSlotsInput:
    usuario_id: str
    service_id: str
    recurso_id: Optional[str]    
    location: str
    room: str
    roomNotes: Optional[str]
    schedules: List[UIRuleIn]
    tz: str = "America/Santiago"

@dataclass
class OpenSlotsResult:
    createdSlots: int
    skipped: int

class OpenSlotsConflict(Exception):
    def __init__(self, conflicts: list[tuple[str, datetime, datetime]]):
        super().__init__("Conflicto con cupos existentes")
        self.conflicts = conflicts

class OpenSlotsUseCase:
    def __init__(self, repo: SlotsRepo):
        self.repo = repo

    @staticmethod
    def _to_dt(tz: str, iso_date: str, hhmm: str) -> datetime:
        return datetime.strptime(f"{iso_date} {hhmm}", "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo(tz))

    async def exec(self, inp: OpenSlotsInput) -> OpenSlotsResult:
        asesor_id = await self.repo.resolve_asesor_id(inp.usuario_id)
        if not asesor_id:
            raise ValueError("El usuario no tiene perfil de asesor.")

        if not await self.repo.ensure_asesor_puede_dicto_servicio(asesor_id, inp.service_id):
            raise ValueError("El asesor no está asociado al servicio seleccionado.")

        dur = await self.repo.get_servicio_minutes(inp.service_id)
        notas = " / ".join(x for x in [inp.location.strip(), inp.room.strip(), (inp.roomNotes or "").strip()] if x) or None

        segments: list[tuple[datetime, datetime]] = []
        for r in inp.schedules:
            if not r.isoDate:
                continue
            start_dt = self._to_dt(inp.tz, r.isoDate, r.startTime)
            end_dt   = self._to_dt(inp.tz, r.isoDate, r.endTime)

            cur = start_dt
            while cur + timedelta(minutes=dur) <= end_dt:
                fin = cur + timedelta(minutes=dur)
                segments.append((cur, fin))
                cur = fin

        if not segments:
            return OpenSlotsResult(createdSlots=0, skipped=0)

        if inp.recurso_id:
            conflicts = await self.repo.find_conflicting_slots(inp.recurso_id, segments)
            if conflicts:
                raise OpenSlotsConflict(conflicts)
            
        rows = []
        for r in inp.schedules:
            if not r.isoDate:
                continue
            start_dt = self._to_dt(inp.tz, r.isoDate, r.startTime)
            end_dt   = self._to_dt(inp.tz, r.isoDate, r.endTime)

            cur = start_dt
            while cur + timedelta(minutes=dur) <= end_dt:
                rows.append((asesor_id, inp.service_id, inp.recurso_id, cur, cur + timedelta(minutes=dur), notas))
                cur += timedelta(minutes=dur)

        created, skipped = await self.repo.bulk_insert_cupos(rows)
        return OpenSlotsResult(createdSlots=created, skipped=skipped)
