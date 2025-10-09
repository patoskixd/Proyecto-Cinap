from __future__ import annotations
from dataclasses import dataclass
from app.use_cases.ports.asesoria_port import AsesoriaRepo, CreateAsesoriaIn, CreateAsesoriaOut
from app.use_cases.ports.calendar_port import CalendarPort, CalendarEventInput, CalendarAttendee
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo   # <-- ruta correcta
import logging

logger = logging.getLogger(__name__)

class SlotReaderPort():
    async def get_slot_context(self, cupo_id: str) -> dict: ...

class CreateAsesoriaAndInvite:
    def __init__(self, repo: AsesoriaRepo, cal: CalendarPort, slot_reader: SlotReaderPort, cal_repo: CalendarEventsRepo):
        self._repo = repo
        self._cal = cal
        self._slots = slot_reader
        self._cal_repo = cal_repo         

    async def exec(self, inp: CreateAsesoriaIn) -> CreateAsesoriaOut:
        out = await self._repo.create_and_reserve(inp)

        ev_out = None 
        try:
            # 1) Contexto del cupo (trae horas, asesor, etc.)
            ctx = await self._slots.get_slot_context(out.cupo_id)

            # 2) Construcción del evento
            title = f"Asesoría CINAP · {ctx['servicio_nombre']}"
            description = (
                "ASESORIA CINAP\n\n"
                f"Servicio: {ctx['servicio_nombre']}\n"
                f"Docente: {out.docente_nombre} ({out.docente_email})\n"
                f"Asesor: {ctx['asesor_nombre']}\n"
                f"Ubicación: {ctx.get('location_text', 'No especificada')}\n"
                f"Origen: {inp.origen or 'No especificado'}\n"
                f"Notas: {inp.notas or 'Sin notas adicionales'}\n\n"
                "IMPORTANTE: Por favor ACEPTA o RECHAZA esta invitación.\n"
                "Si aceptas: el asesor confirmará la cita.\n"
                "Si rechazas: se liberará el cupo."
            )

            # 3) Crear en Google Calendar
            ev_out = await self._cal.create_event(
                CalendarEventInput(
                    organizer_usuario_id=ctx["asesor_usuario_id"],
                    title=title,
                    start=ctx["inicio"],
                    end=ctx["fin"],
                    attendees=[CalendarAttendee(
                        email=out.docente_email,
                        display_name=out.docente_nombre,
                        optional=False,
                        response_status="needsAction"
                    )],
                    location=ctx.get("location_text"),
                    description=description,
                    create_meet_link=True,
                )
            )

            # 4) Guardar/actualizar en tabla calendar_event (solo si se creó)
            await self._cal_repo.upsert_calendar_event(
                asesoria_id=out.asesoria_id,
                organizer_usuario_id=ctx["asesor_usuario_id"],
                calendar_event_id=ev_out.provider_event_id,
                html_link=ev_out.html_link,
            )


        except Exception:
            # Deja la asesoria en PENDIENTE aunque falle Calendar, pero loguea la causa real
            logger.exception(f"Error creando evento en Google Calendar para asesoría {out.asesoria_id}")

        return out
