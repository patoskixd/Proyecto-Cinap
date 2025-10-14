from __future__ import annotations
import logging
from typing import Optional
import uuid
from app.use_cases.ports.calendar_port import CalendarPort
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo

logger = logging.getLogger(__name__)

class AutoConfigureWebhook:
    """
    Configura automáticamente el webhook de Google Calendar para un asesor
    cuando se detecta que no tiene webhook configurado.
    """
    
    def __init__(self, cal: CalendarPort, repo: CalendarEventsRepo, webhook_public_url: str):
        self.cal = cal
        self.repo = repo
        self.webhook_public_url = webhook_public_url

    async def ensure_webhook_configured(self, usuario_id: str, access_token: str | None = None) -> dict:
        """
        Asegura que el asesor tenga configurado su webhook.
        Se llama automáticamente cuando:
        1. El asesor hace login por primera vez
        2. Se crea una asesoría y no hay webhook
        3. Periódicamente para verificar
        """
        
        try:
            logger.info(f"🔧 Verificando webhook para asesor {usuario_id}")
            
            # Verificar si ya tiene webhook configurado
            existing_channels = await self.repo.get_channels_for_user(usuario_id)
            
            if existing_channels:
                logger.info(f"✅ Asesor {usuario_id} ya tiene {len(existing_channels)} webhooks configurados")
                return {"configured": True, "channels": len(existing_channels), "new_channel": None}
            
            # No tiene webhook, configurar uno nuevo
            logger.info(f"🔨 Configurando webhook automáticamente para asesor {usuario_id}")
            
            channel_id = str(uuid.uuid4())
            callback_url = self.webhook_public_url.rstrip("/") + "/webhooks/google/calendar"
            
            # Configurar webhook en Google Calendar
            # Si tenemos access_token (desde login), usarlo; sino usar el del usuario
            token_to_use = access_token or "cinap-auto"
            
            result = await self.cal.watch_primary_calendar(
                organizer_usuario_id=usuario_id,
                callback_url=callback_url,
                channel_id=channel_id,
                token=token_to_use
            )
            
            # Guardar el mapping en Redis
            resource_id = result.get("resourceId")
            await self.repo.save_channel_owner(channel_id, usuario_id, resource_id)
            
            logger.info(f"✅ Webhook configurado automáticamente: {channel_id}")
            
            return {
                "configured": True, 
                "channels": 1, 
                "new_channel": channel_id,
                "resource_id": resource_id
            }
            
        except Exception as e:
            logger.error(f"❌ Error configurando webhook automático para {usuario_id}: {e}")
            return {"configured": False, "error": str(e)}

    async def configure_for_all_advisors(self) -> dict:
        """
        Configura webhooks para todos los asesores que no los tengan.
        Útil para configuración inicial en producción.
        """
        
        try:
            # Obtener todos los asesores
            advisors = await self.repo.get_all_advisors()
            
            results = {
                "total_advisors": len(advisors),
                "configured": 0,
                "already_configured": 0,
                "errors": 0,
                "details": []
            }
            
            for advisor in advisors:
                usuario_id = advisor["usuario_id"]
                email = advisor.get("email", "N/A")
                
                try:
                    result = await self.ensure_webhook_configured(usuario_id)
                    
                    if result["configured"]:
                        if result.get("new_channel"):
                            results["configured"] += 1
                            status = f"✅ Nuevo webhook: {result['new_channel']}"
                        else:
                            results["already_configured"] += 1
                            status = f"ℹ️ Ya configurado ({result['channels']} channels)"
                    else:
                        results["errors"] += 1
                        status = f"❌ Error: {result.get('error', 'Desconocido')}"
                        
                    results["details"].append({
                        "usuario_id": usuario_id,
                        "email": email,
                        "status": status
                    })
                    
                except Exception as e:
                    results["errors"] += 1
                    results["details"].append({
                        "usuario_id": usuario_id, 
                        "email": email,
                        "status": f"❌ Excepción: {str(e)}"
                    })
            
            logger.info(f"🎯 Configuración masiva completada: {results['configured']} nuevos, "
                       f"{results['already_configured']} existentes, {results['errors']} errores")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error en configuración masiva: {e}")
            return {"error": str(e)}