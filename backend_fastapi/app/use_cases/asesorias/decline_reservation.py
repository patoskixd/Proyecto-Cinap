from __future__ import annotations

import logging
from uuid import UUID

from app.interface_adapters.gateways.db.sqlalchemy_reservations_repo import SqlAlchemyReservationsRepo
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo
from app.use_cases.ports.calendar_port import CalendarPort

log = logging.getLogger(__name__)


class DeclineReservation:
    def __init__(
        self,
        reservations_repo: SqlAlchemyReservationsRepo,
        cal_repo: CalendarEventsRepo,
        calendar: CalendarPort,
    ) -> None:
        self.reservations_repo = reservations_repo
        self.cal_repo = cal_repo
        self.calendar = calendar

    async def exec(self, asesoria_id: UUID, actor_usuario_id: UUID | None = None) -> None:
        context = await self.reservations_repo.get_reservation_context(asesoria_id)
        payload = await self.cal_repo.get_calendar_payload(str(asesoria_id)) or {}
        event_id = payload.get("calendar_event_id")
        organizer_usuario_id = payload.get("organizer_usuario_id") or context.get("asesor_usuario_id")
        docente_email = context.get("docente_email")
        docente_usuario_id = context.get("docente_usuario_id")

        use_teacher_credentials = (
            actor_usuario_id is not None
            and docente_usuario_id is not None
            and str(actor_usuario_id) == str(docente_usuario_id)
        )

        if event_id and docente_usuario_id and docente_email and use_teacher_credentials:
            try:
                await self.calendar.set_attendee_response(
                    event_id=str(event_id),
                    attendee_email=docente_email,
                    usuario_id=str(docente_usuario_id),
                    response="declined",
                )
            except Exception:  # pragma: no cover
                log.exception(
                    "No se pudo actualizar la respuesta del evento %s al declinar asesoría %s",
                    event_id,
                    asesoria_id,
                )
        elif event_id and organizer_usuario_id and docente_email:
            try:
                await self.calendar.set_attendee_response(
                    event_id=str(event_id),
                    organizer_usuario_id=str(organizer_usuario_id),
                    attendee_email=docente_email,
                    response="declined",
                )
            except Exception:  # pragma: no cover
                log.exception(
                    "No se pudo actualizar la respuesta del evento %s al declinar asesoría %s",
                    event_id,
                    asesoria_id,
                )

        await self.cal_repo.mark_cancelled(str(asesoria_id))
