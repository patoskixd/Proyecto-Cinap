from __future__ import annotations

import logging
from uuid import UUID

from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo
from app.use_cases.ports.calendar_port import CalendarPort

log = logging.getLogger(__name__)


class CancelReservation:
    def __init__(
        self,
        cal_repo: CalendarEventsRepo,
        calendar: CalendarPort,
    ) -> None:
        self.cal_repo = cal_repo
        self.calendar = calendar

    async def exec(self, asesoria_id: UUID) -> None:
        payload = await self.cal_repo.get_calendar_payload(str(asesoria_id))

        event_id = None
        organizer_usuario_id = None
        cupo_id = None

        if payload:
            event_id = payload.get("calendar_event_id")
            organizer_usuario_id = payload.get("organizer_usuario_id")
            cupo_id = payload.get("cupo_id")

        if event_id and organizer_usuario_id:
            try:
                await self.calendar.delete_event(
                    organizer_usuario_id=str(organizer_usuario_id),
                    event_id=str(event_id),
                    send_updates="all",
                )
            except Exception:  # pragma: no cover
                log.exception("No se pudo eliminar evento de Calendar para la asesoría %s", asesoria_id)

        await self.cal_repo.delete_asesoria_and_mark_cancelled(str(asesoria_id), str(cupo_id) if cupo_id else None)
