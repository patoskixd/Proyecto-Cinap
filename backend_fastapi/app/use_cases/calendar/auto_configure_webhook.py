from __future__ import annotations
import logging
from typing import Optional
import uuid
import inspect
from app.use_cases.ports.calendar_port import CalendarPort
from app.use_cases.ports.calendar_events_repo import CalendarEventsRepo

logger = logging.getLogger(__name__)

class AutoConfigureWebhook:
    """
    Configura automáticamente el webhook de Google Calendar para los usuarios
    (asesores, docentes, etc.) que aún no tengan un canal activo.
    """

    def __init__(self, cal: CalendarPort, repo: CalendarEventsRepo, webhook_public_url: str):
        self.cal = cal
        self.repo = repo
        self.webhook_public_url = webhook_public_url

    async def ensure_webhook_configured(
        self,
        usuario_id: str,
        access_token: str | None = None,
        *,
        role: str = "usuario",
    ) -> dict:
        """
        Asegura que el usuario indicado tenga configurado su webhook.
        Se llama automáticamente cuando:
        1. El usuario hace login por primera vez (asesor)
        2. Se crea una asesoría y no hay webhook
        3. Periódicamente para verificar
        """

        try:
            logger.info(" Verificando webhook para %s %s", role, usuario_id)

            if not self.webhook_public_url:
                logger.warning(
                    "WEBHOOK_PUBLIC_URL no definido; omitiendo auto-configuración para %s %s",
                    role,
                    usuario_id,
                )
                return {"configured": False, "error": "missing_webhook_public_url"}

            existing_channels = await self.repo.get_channels_for_user(usuario_id)

            if existing_channels:
                logger.info(
                    " %s %s ya tiene %d webhooks configurados",
                    role.capitalize(),
                    usuario_id,
                    len(existing_channels),
                )
                return {"configured": True, "channels": len(existing_channels), "new_channel": None}

            refresh_token = None
            fetch_token = getattr(self.cal, "_get_refresh_token", None)
            if callable(fetch_token):
                try:
                    maybe_token = fetch_token(usuario_id)
                    refresh_token = await maybe_token if inspect.isawaitable(maybe_token) else maybe_token
                except Exception:
                    refresh_token = None

            if not refresh_token:
                logger.warning(
                    " Saltando auto-config para %s %s: sin refresh_token de Google",
                    role,
                    usuario_id,
                )
                return {
                    "configured": False,
                    "skipped": True,
                    "reason": "missing_refresh_token",
                }

            logger.info("Configurando webhook automáticamente para %s %s", role, usuario_id)

            channel_id = str(uuid.uuid4())
            callback_url = self.webhook_public_url.rstrip("/") + "/webhooks/google/calendar"

            token_to_use = access_token or "cinap-auto"

            result = await self.cal.watch_primary_calendar(
                organizer_usuario_id=usuario_id,
                callback_url=callback_url,
                channel_id=channel_id,
                token=token_to_use
            )

            resource_id = result.get("resourceId")
            await self.repo.save_channel_owner(channel_id, usuario_id, resource_id)

            logger.info(
                "Webhook configurado automáticamente para %s %s (channel_id=%s)",
                role,
                usuario_id,
                channel_id,
            )

            return {
                "configured": True, 
                "channels": 1, 
                "new_channel": channel_id,
                "resource_id": resource_id
            }

        except Exception as e:
            logger.error("Error configurando webhook automático para %s %s: %s", role, usuario_id, e)
            return {"configured": False, "error": str(e)}

    async def configure_for_all_advisors(self) -> dict:
        """
        Configura webhooks para todos los asesores que no los tengan.
        Útil para configuración inicial en producción.
        """

        try:
            advisors = await self.repo.get_all_advisors()
            return await self._configure_group(users=advisors, role="asesor")
        except Exception as e:
            logger.error("Error en configuración masiva de asesores: %s", e)
            return {"error": str(e)}

    async def configure_for_all_teachers(self) -> dict:
        """
        Configura webhooks para todos los docentes activos que aún no los tengan.
        """
        try:
            teachers = await self.repo.get_all_teachers()
            return await self._configure_group(users=teachers, role="docente")
        except Exception as e:
            logger.error("Error en configuración masiva de docentes: %s", e)
            return {"error": str(e)}

    async def _configure_group(self, *, users: list[dict], role: str) -> dict:
        results = {
            "role": role,
            "total": len(users),
            "configured": 0,
            "already_configured": 0,
            "skipped": 0,
            "errors": 0,
            "details": [],
        }

        for user in users:
            usuario_id = user.get("usuario_id")
            email = user.get("email", "N/A")

            if not usuario_id:
                results["errors"] += 1
                results["details"].append(
                    {"usuario_id": None, "email": email, "status": " Sin usuario_id"}
                )
                continue

            try:
                result = await self.ensure_webhook_configured(usuario_id, role=role)

                if result["configured"]:
                    if result.get("new_channel"):
                        results["configured"] += 1
                        status = f" Nuevo webhook: {result['new_channel']}"
                    else:
                        results["already_configured"] += 1
                        status = f" Ya configurado ({result.get('channels', 0)} channels)"
                elif result.get("skipped"):
                    results["skipped"] += 1
                    reason = result.get("reason", "omitido")
                    status = f" Omitido: {reason}"
                else:
                    results["errors"] += 1
                    status = f"Error: {result.get('error', 'Desconocido')}"

                results["details"].append(
                    {
                        "usuario_id": usuario_id,
                        "email": email,
                        "status": status,
                    }
                )

            except Exception as e:
                results["errors"] += 1
                results["details"].append(
                    {
                        "usuario_id": usuario_id,
                        "email": email,
                        "status": f"Excepción: {str(e)}",
                    }
                )

        logger.info(
            " Configuración masiva (%s) completada: nuevos=%s, existentes=%s, omitidos=%s, errores=%s",
            role,
            results["configured"],
            results["already_configured"],
            results["skipped"],
            results["errors"],
        )
        return results
