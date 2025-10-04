from __future__ import annotations
from dataclasses import dataclass
from app.use_cases.ports.asesoria_port import AsesoriaRepo, CreateAsesoriaIn, CreateAsesoriaOut
from app.use_cases.ports.calendar_port import CalendarPort, CalendarEventInput, CalendarAttendee
from datetime import timezone
from typing import Protocol
import logging

logger = logging.getLogger(__name__)

class SlotReaderPort(Protocol):
    async def get_slot_context(self, cupo_id: str) -> dict: ...


class CreateAsesoriaAndInvite:
    def __init__(self, repo: AsesoriaRepo, cal: CalendarPort, slot_reader: SlotReaderPort):
        self._repo = repo
        self._cal = cal
        self._slots = slot_reader

    async def exec(self, inp: CreateAsesoriaIn) -> CreateAsesoriaOut:
        logger.info(f"Iniciando CreateAsesoriaAndInvite.exec() con cupo_id={inp.cupo_id}")
        out = await self._repo.create_and_reserve(inp)
        logger.info(f"Asesoria creada in BD: {out.asesoria_id}. Iniciando creacion de evento en Google Calendar...")
        
        try:
            # 1. Obtener contexto del cupo
            logger.info(f"Obteniendo contexto del cupo: {out.cupo_id}")
            ctx = await self._slots.get_slot_context(out.cupo_id)
            logger.info(f"Contexto obtenido - Asesor: {ctx.get('asesor_nombre')} ({ctx.get('asesor_usuario_id')})")

            # 2. Crear evento en Google Calendar
            title = f"Asesoría CINAP · {ctx['servicio_nombre']}"
            description = f"""ASESORIA CINAP
            
Servicio: {ctx['servicio_nombre']}
Docente: {ctx['docente_nombre']} ({out.docente_email})
Asesor: {ctx['asesor_nombre']}
Ubicacion: {ctx.get('location_text', 'No especificada')}
Origen: {inp.origen or 'No especificado'}
Notas: {inp.notas or 'Sin notas adicionales'}

IMPORTANTE: Por favor ACEPTA o RECHAZA esta invitacion para confirmar tu asistencia.
El asesor recibira una notificacion con tu respuesta y podra preparar la sesion adecuadamente.

Si aceptas: El asesor confirmara la cita y podra preparar los materiales.
Si rechazas: Se liberara el cupo para otros docentes interesados.
"""
            
            logger.info(f"Creando evento en Google Calendar: '{title}' para asesor {ctx['asesor_usuario_id']}")
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
            logger.info(f"Evento de Google Calendar creado exitosamente: {ev_out.provider_event_id}")
            
        except Exception as e:
            logger.error(f" Error creando evento en Google Calendar para asesoría {out.asesoria_id}: {str(e)}", exc_info=True)
            # No rompemos la reserva por fallo de calendario: que quede PENDIENTE sin invitación
            # En producción podrías encolar esto para retry posterior
            
        return out
