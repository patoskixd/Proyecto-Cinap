from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from app.interface_adapters.gateways.db.sqlalchemy_reservations_repo import SqlAlchemyReservationsRepo
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo
from app.use_cases.ports.calendar_port import CalendarPort, CalendarEventInput, CalendarAttendee

log = logging.getLogger(__name__)


class ConfirmReservation:
    def __init__(
        self,
        reservations_repo: SqlAlchemyReservationsRepo,
        cal_repo: CalendarEventsRepo,
        calendar: CalendarPort,
    ) -> None:
        self.reservations_repo = reservations_repo
        self.cal_repo = cal_repo
        self.calendar = calendar

    async def exec(self, asesoria_id: UUID, actor_usuario_id: Optional[UUID] = None) -> None:
        context = await self.reservations_repo.get_reservation_context(asesoria_id)

        payload = await self.cal_repo.get_calendar_payload(str(asesoria_id)) or {}
        calendar_event_id = payload.get("calendar_event_id")
        organizer_usuario_id = payload.get("organizer_usuario_id") or context.get("asesor_usuario_id")
        docente_usuario_id = context.get("docente_usuario_id")
        docente_email = context.get("docente_email")

        use_teacher_credentials = (
            actor_usuario_id is not None
            and docente_usuario_id is not None
            and str(actor_usuario_id) == str(docente_usuario_id)
            and docente_email
        )

        if calendar_event_id and use_teacher_credentials:
            try:
                await self.calendar.set_attendee_response(
                    event_id=str(calendar_event_id),
                    attendee_email=docente_email or "",
                    usuario_id=str(docente_usuario_id),
                    response="accepted",
                )
            except Exception:  # pragma: no cover
                log.exception(
                    "No se pudo actualizar la respuesta del evento %s al confirmar asesoría %s",
                    calendar_event_id,
                    asesoria_id,
                )
        elif organizer_usuario_id and calendar_event_id:
            try:
                await self.calendar.set_attendee_response(
                    event_id=str(calendar_event_id),
                    organizer_usuario_id=str(organizer_usuario_id),
                    attendee_email=docente_email or "",
                    response="accepted",
                )
            except Exception:  # pragma: no cover
                log.exception(
                    "No se pudo actualizar la respuesta del evento %s al confirmar asesoría %s",
                    calendar_event_id,
                    asesoria_id,
                )
        elif organizer_usuario_id:
            # Si no existe evento aún (p. ej. la asesoría venía pendiente), lo creamos
            try:
                event_out = await self.calendar.create_event(
                    CalendarEventInput(
                        organizer_usuario_id=str(organizer_usuario_id),
                        title=f"Asesoría CINAP · {context.get('servicio_nombre', '')}",
                        start=context["inicio"],
                        end=context["fin"],
                        attendees=[
                            CalendarAttendee(
                                email=docente_email or "",
                                display_name=context.get("docente_nombre") or "",
                                optional=False,
                                response_status="needsAction",
                            )
                        ],
                        location=context.get("location_text"),
                        description=self._compose_description(context),
                        create_meet_link=True,
                    )
                )
                await self.cal_repo.upsert_calendar_event(
                    asesoria_id=str(asesoria_id),
                    organizer_usuario_id=str(organizer_usuario_id),
                    calendar_event_id=event_out.provider_event_id,
                    html_link=event_out.html_link,
                )

                try:
                    if use_teacher_credentials:
                        await self.calendar.set_attendee_response(
                            event_id=event_out.provider_event_id,
                            attendee_email=docente_email or "",
                            usuario_id=str(docente_usuario_id),
                            response="accepted",
                        )
                    else:
                        await self.calendar.set_attendee_response(
                            event_id=event_out.provider_event_id,
                            organizer_usuario_id=str(organizer_usuario_id),
                            attendee_email=docente_email or "",
                            response="accepted",
                        )
                except Exception:  # pragma: no cover
                    log.exception(
                        "No se pudo actualizar la respuesta del evento recién creado al confirmar asesoría %s",
                        asesoria_id,
                    )
            except Exception:  # pragma: no cover
                log.exception("No se pudo crear el evento en Calendar al confirmar asesoría %s", asesoria_id)

        await self.cal_repo.mark_confirmed(str(asesoria_id))

    def _compose_description(self, ctx: dict) -> str:
        return (
            "ASESORIA CINAP\n\n"
            f"Servicio: {ctx.get('servicio_nombre', '')}\n"
            f"Docente: {ctx.get('docente_nombre', '')} ({ctx.get('docente_email', '')})\n"
            f"Asesor: {ctx.get('asesor_nombre', '')}\n"
            f"Ubicación: {ctx.get('location_text') or 'No especificada'}\n"
            f"Origen: {ctx.get('origen') or 'No especificado'}\n"
            f"Notas: {ctx.get('notas') or 'Sin notas adicionales'}\n\n"
            "Este evento fue reactivado desde la plataforma CINAP."
        )
