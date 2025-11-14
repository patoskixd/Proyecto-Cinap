from __future__ import annotations
import logging
from typing import Literal
from app.use_cases.ports.calendar_port import CalendarPort
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo

logger = logging.getLogger(__name__)

class HandleGoogleWebhook:
    """
    Estrategia: Google NO manda el event_id; al recibir una notificación
    revalidamos todos los 'PENDIENTE' del asesor que es dueño del canal.
    """
    def __init__(self, cal: CalendarPort, repo: CalendarEventsRepo):
        self.cal = cal
        self.repo = repo

    async def exec(self, *, channel_id: str, resource_state: str, token: str|None):
        logger.info(f"Recibido webhook Google Calendar: channel_id={channel_id}, resource_state={resource_state}")
        
        organizer_usuario_id = await self.repo.map_channel_owner(channel_id)
        logger.info(f"Buscando asesor para channel_id {channel_id} -> usuario_id: {organizer_usuario_id}")
        
        if not organizer_usuario_id:
            logger.warning(f"No se encontró asesor para channel_id {channel_id}")
            return {"ok": True, "synced": 0}

        # Trae asesorias activas (pendientes, confirmadas o canceladas) del asesor para sincronizar estados
        candidates = await self.repo.list_pending_and_cancelled_for_organizer(organizer_usuario_id)
        logger.info(f"Revisando {len(candidates)} asesorias (pendientes/confirmadas/canceladas) para asesor {organizer_usuario_id}")

        synced = 0
        event_cache: dict[str, dict] = {}
        for i, p in enumerate(candidates):
            asesoria_id = p.get('asesoria_id', 'N/A')
            asesoria_estado = p.get('asesoria_estado', 'UNKNOWN')
            try:
                provider_event_id = p.get("provider_event_id")
                if not provider_event_id:
                    continue
                if provider_event_id in event_cache:
                    ev = event_cache[provider_event_id]
                else:
                    ev = await self.cal.get_event(
                        organizer_usuario_id=organizer_usuario_id,
                        event_id=provider_event_id
                    )
                    event_cache[provider_event_id] = ev
                
                # Busca al docente en attendees y su responseStatus
                attendees = ev.get("attendees", []) or []
                
                status = None
                for at in attendees:
                    att_email = (at.get("email") or "").lower().strip()
                    docente_email = (p["docente_email"] or "").lower().strip()
                    
                    if att_email == docente_email:
                        status = (at.get("responseStatus") or "").lower()
                        break
                
                if not status:
                    # Intentar match menos estricto
                    for at in attendees:
                        att_email = (at.get("email") or "").lower().strip()
                        docente_email = (p["docente_email"] or "").lower().strip()
                        if docente_email in att_email or att_email in docente_email:
                            status = (at.get("responseStatus") or "").lower()
                            break

                # Manejar todos los estados posibles de Google Calendar
                updated = False
                if status in ("accepted", "declined", "tentative"):
                    asesoria_id = p["asesoria_id"]
                    cupo_id = p["cupo_id"]
                    estado_actual = p["asesoria_estado"]
                    logger.info(f"Docente {p['docente_email']} {status} la asesoria {asesoria_id}")
                    if status == "accepted":
                        if estado_actual == "CONFIRMADA":
                            logger.debug(f"Asesoria {asesoria_id} ya estaba CONFIRMADA, se ignora accepted.")
                        elif estado_actual == "CANCELADA":
                            await self.repo.mark_confirmed(asesoria_id)
                            updated = True
                            logger.info(f"Asesoria {asesoria_id} paso de CANCELADA a CONFIRMADA por aceptacion del docente")
                        elif estado_actual == "PENDIENTE":
                            await self.repo.mark_confirmed(asesoria_id)
                            updated = True
                            logger.info(f"Asesoria {asesoria_id} marcada como CONFIRMADA")
                        else:
                            logger.debug(f"Asesoria {asesoria_id} ya estaba en {estado_actual}; se omite accepted.")
                    elif status in ("declined", "tentative"):
                        if estado_actual == "CANCELADA":
                            logger.debug(f"Asesoria {asesoria_id} ya estaba CANCELADA, se ignora {status}.")
                        elif estado_actual in ("PENDIENTE", "CONFIRMADA"):
                            try:
                                await self.repo.mark_rejected_and_free_slot(asesoria_id, cupo_id)
                                updated = True
                                logger.info(f"Asesoria {asesoria_id} marcada como CANCELADA por {status}")
                            except Exception as cancel_error:
                                logger.error(f"Error cancelando asesoria {asesoria_id}: {cancel_error}")
                                raise
                        else:
                            logger.debug(f"Asesoria {asesoria_id} ya en estado {estado_actual}; se omite {status}.")
                    if updated:
                        synced += 1

                elif status == "needsaction":
                    estado_actual = p.get('asesoria_estado')
                    if estado_actual == "CONFIRMADA":
                        await self.repo.update_event_state(p["asesoria_id"], "PENDIENTE")
                        logger.info(f"Asesoria {p['asesoria_id']} marcada como PENDIENTE desde needsAction")
                        synced += 1
                    else:
                        logger.debug(f"Docente {p['docente_email']} aun no ha respondido (needsAction)")
                    
                elif status:
                    logger.debug(f"Status {status} de docente {p['docente_email']} no requiere acción")
                else:
                    logger.debug(f"Docente {p['docente_email']} aún no ha respondido")
                    
            except Exception as e:
                # Verificar si el evento fue eliminado (error 404)
                error_str = str(e).lower()
                if "404" in error_str or "not found" in error_str or "notfound" in error_str:
                    # El asesor eliminó el evento desde Google Calendar
                    asesoria_id = p.get('asesoria_id')
                    cupo_id = p.get('cupo_id')
                    logger.info(f"Evento eliminado por asesor para asesoría {asesoria_id}, eliminando asesoría y liberando cupo")
                    
                    try:
                        await self.repo.delete_asesoria_and_mark_cancelled(asesoria_id, cupo_id)
                        logger.info(f"Asesoría {asesoria_id} eliminada completamente por eliminación del evento")
                        synced += 1
                    except Exception as delete_error:
                        logger.error(f"Error eliminando asesoría {asesoria_id}: {delete_error}")
                else:
                    logger.error(f"Error procesando asesoría {p.get('asesoria_id')}: {e}")

        logger.info(f"Webhook procesado: {synced} asesorías actualizadas")
        return {"ok": True, "synced": synced}