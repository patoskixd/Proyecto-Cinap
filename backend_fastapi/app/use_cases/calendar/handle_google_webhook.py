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
        print(f"EXEC INICIADO: channel_id={channel_id}, resource_state={resource_state}")
        logger.info(f"Recibido webhook Google Calendar: channel_id={channel_id}, resource_state={resource_state}")
        
        organizer_usuario_id = await self.repo.map_channel_owner(channel_id)
        print(f"MAPEADO: channel_id {channel_id} -> usuario_id: {organizer_usuario_id}")
        logger.info(f"Buscando asesor para channel_id {channel_id} -> usuario_id: {organizer_usuario_id}")
        
        if not organizer_usuario_id:
            print(f"NO ENCONTRADO: {channel_id}")
            logger.warning(f"No se encontró asesor para channel_id {channel_id}")
            return {"ok": True, "synced": 0}

        # Trae las asesorías PENDIENTE y CANCELADAS de este asesor para manejar re-aceptaciones
        print(f"BUSCANDO asesorías pendientes y canceladas para {organizer_usuario_id}")
        pendings = await self.repo.list_pending_and_cancelled_for_organizer(organizer_usuario_id)
        print(f"ENCONTRADAS: {len(pendings)} asesorías para revisar")
        logger.info(f"Revisando {len(pendings)} asesorías (pendientes + canceladas) para asesor {organizer_usuario_id}")

        synced = 0
        for i, p in enumerate(pendings):
            asesoria_id = p.get('asesoria_id', 'N/A')
            asesoria_estado = p.get('asesoria_estado', 'UNKNOWN')
            print(f"PROCESANDO {i+1}/{len(pendings)}: {asesoria_id} (Estado actual: {asesoria_estado})")
            try:
                print(f"OBTENIENDO evento {p['provider_event_id']}")
                ev = await self.cal.get_event(
                    organizer_usuario_id=organizer_usuario_id,
                    event_id=p["provider_event_id"]
                )
                print(f"EVENTO OBTENIDO: {ev.get('id', 'N/A')}")
                
                # Busca al docente en attendees y su responseStatus
                attendees = ev.get("attendees", []) or []
                print(f"ATTENDEES ({len(attendees)}): {[att.get('email') for att in attendees]}")
                print(f"BUSCANDO docente: {p['docente_email']}")
                
                # Debug detallado de attendees
                for i, att in enumerate(attendees):
                    att_email = att.get("email", "")
                    att_status = att.get("responseStatus", "")
                    print(f"👤 Attendee {i+1}: email='{att_email}' status='{att_status}'")
                
                status = None
                for at in attendees:
                    att_email = (at.get("email") or "").lower().strip()
                    docente_email = (p["docente_email"] or "").lower().strip()
                    print(f"COMPARANDO: '{att_email}' vs '{docente_email}' (len: {len(att_email)} vs {len(docente_email)})")
                    
                    if att_email == docente_email:
                        status = (at.get("responseStatus") or "").lower()
                        print(f"DOCENTE ENCONTRADO: {att_email} -> status: '{status}'")
                        break
                
                if not status:
                    print(f"DOCENTE NO ENCONTRADO en attendees")
                    print(f"Emails disponibles: {[att.get('email', '') for att in attendees]}")
                    print(f"Email buscado: '{p['docente_email']}'")
                    # Intentar match menos estricto
                    for at in attendees:
                        att_email = (at.get("email") or "").lower().strip()
                        docente_email = (p["docente_email"] or "").lower().strip()
                        if docente_email in att_email or att_email in docente_email:
                            status = (at.get("responseStatus") or "").lower()
                            print(f"MATCH PARCIAL: {att_email} contiene/está en {docente_email} -> status: '{status}'")
                            break

                # Manejar todos los estados posibles de Google Calendar
                if status in ("accepted", "declined", "tentative"):
                    asesoria_id = p["asesoria_id"]
                    cupo_id = p["cupo_id"]
                    estado_actual = p["asesoria_estado"]
                    print(f"PROCESANDO status: '{status}' para asesoría {asesoria_id} (estado actual: {estado_actual})")
                    logger.info(f"Docente {p['docente_email']} {status} la asesoría {asesoria_id}")
                    
                    if status == "accepted":
                        if estado_actual == "CANCELADA":
                            # Re-aceptación: asesoría cancelada que vuelve a ser aceptada
                            print(f"🔄 RE-ACEPTACIÓN: Reactivando asesoría cancelada {asesoria_id}")
                            await self.repo.mark_confirmed(asesoria_id)
                            print(f"✅ RE-CONFIRMADA: Asesoría {asesoria_id} reactivada")
                            logger.info(f"Asesoría {asesoria_id} RE-CONFIRMADA - cambió de CANCELADA a CONFIRMADA")
                        elif estado_actual == "PENDIENTE":
                            # Confirmación normal
                            print(f" EJECUTANDO mark_confirmed para asesoría {asesoria_id}")
                            await self.repo.mark_confirmed(asesoria_id)
                            print(f" CONFIRMADA: Asesoría {asesoria_id}")
                            logger.info(f"Asesoría {asesoria_id} marcada como CONFIRMADA")
                    elif status in ("declined", "tentative"):
                        if estado_actual == "PENDIENTE":
                            # Cancelación normal
                            print(f"EJECUTANDO mark_rejected_and_free_slot para asesoría {asesoria_id}")
                            try:
                                await self.repo.mark_rejected_and_free_slot(asesoria_id, cupo_id)
                                print(f"CANCELADA: Asesoría {asesoria_id} - cupo permanece ocupado ({status})")
                                logger.info(f"Asesoría {asesoria_id} marcada como CANCELADA - cupo permanece ocupado - Razón: {status}")
                            except Exception as cancel_error:
                                print(f" ERROR CANCELANDO: {cancel_error}")
                                logger.error(f"Error cancelando asesoría {asesoria_id}: {cancel_error}")
                                raise
                        else:
                            print(f"Asesoría {asesoria_id} ya está en estado {estado_actual}, no se procesa {status}")
                    
                    synced += 1
                    print(f" SYNCED: {synced} asesorías procesadas hasta ahora")
                elif status == "needsaction":
                    # El docente aún no ha respondido - no hacer nada
                    print(f" PENDIENTE: Docente {p['docente_email']} aún no ha respondido")
                    logger.debug(f"Docente {p['docente_email']} aún no ha respondido (needsAction)")
                    
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
                    print(f" EVENTO ELIMINADO: Asesor eliminó evento para asesoría {asesoria_id}")
                    logger.info(f"Evento eliminado por asesor para asesoría {asesoria_id}, eliminando asesoría y liberando cupo")
                    
                    try:
                        await self.repo.delete_asesoria_and_mark_cancelled(asesoria_id, cupo_id)
                        print(f" ELIMINADA: Asesoría {asesoria_id} eliminada completamente y cupo liberado")
                        logger.info(f"Asesoría {asesoria_id} eliminada completamente por eliminación del evento")
                        synced += 1
                    except Exception as delete_error:
                        print(f" ERROR ELIMINANDO: {delete_error}")
                        logger.error(f"Error eliminando asesoría {asesoria_id}: {delete_error}")
                else:
                    print(f" ERROR GENERAL procesando asesoría {p.get('asesoria_id')}: {e}")
                    logger.error(f"Error procesando asesoría {p.get('asesoria_id')}: {e}")

        logger.info(f"Webhook procesado: {synced} asesorías actualizadas")
        return {"ok": True, "synced": synced}
