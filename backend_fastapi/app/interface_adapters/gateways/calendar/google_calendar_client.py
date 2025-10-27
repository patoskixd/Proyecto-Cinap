from __future__ import annotations
import httpx, uuid, asyncio, logging, inspect
from typing import Optional
from datetime import datetime
from app.use_cases.ports.calendar_port import CalendarPort, CalendarEventInput, CalendarEventOut

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
CAL_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
SCOPES = "https://www.googleapis.com/auth/calendar"
CAL_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
CAL_WATCH_URL  = "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch"

log = logging.getLogger(__name__)


class GoogleCalendarClient(CalendarPort):
    def __init__(
        self,
        *,
        client_id: str,
        client_secret: str,
        timeout: int = 20,
        get_refresh_token_by_usuario_id=None,
        invalidate_refresh_token_by_usuario_id=None,
    ):
        """
        get_refresh_token_by_usuario_id: async fn(usuario_id: str) -> str | None
        invalidate_refresh_token_by_usuario_id: async fn(usuario_id: str) -> None
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.timeout = timeout
        self._get_rt = get_refresh_token_by_usuario_id
        self._invalidate_rt = invalidate_refresh_token_by_usuario_id

    async def _get_refresh_token(self, usuario_id: str) -> Optional[str]:
        """Acepta factories async o sync para recuperar refresh token."""
        if not self._get_rt:
            return None
        try:
            maybe_token = self._get_rt(usuario_id)
            if inspect.isawaitable(maybe_token):
                return await maybe_token
            return maybe_token
        except Exception as exc:
            log.warning("No se pudo obtener refresh token para %s: %s", usuario_id, exc)
            return None

    async def _auth_headers_for_user(self, usuario_id: str) -> dict:
        refresh_token = await self._get_refresh_token(usuario_id)
        if not refresh_token:
            raise RuntimeError(f"Cuenta Google sin refresh_token (usuario_id={usuario_id})")
        access = await self._exchange_refresh(refresh_token, usuario_id=usuario_id)
        return {"Authorization": f"Bearer {access}"}

    async def _exchange_refresh(self, refresh_token: str, *, usuario_id: str | None = None) -> str:
        log.debug("Attempting to refresh Google token (len=%s)", len(refresh_token) if refresh_token else None)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            try:
                r.raise_for_status()
            except httpx.HTTPStatusError as exc:
                body_json = None
                try:
                    body_json = r.json()
                except Exception:
                    body_json = None
                body_repr = body_json if body_json is not None else r.text[:500] if hasattr(r, "text") else "<unavailable>"
                log.warning(
                    "Google refresh_token exchange failed (status=%s, body=%s)",
                    r.status_code,
                    body_repr,
                )
                error_code = None
                if isinstance(body_json, dict):
                    error_code = body_json.get("error")
                    if error_code == "invalid_grant" and usuario_id and self._invalidate_rt:
                        try:
                            maybe = self._invalidate_rt(usuario_id)
                            if inspect.isawaitable(maybe):
                                await maybe
                            log.info("Marcado refresh_token inválido para usuario %s", usuario_id)
                        except Exception as cb_exc:
                            log.warning("No se pudo marcar refresh token inválido para %s: %s", usuario_id, cb_exc)
                raise
            data = r.json()
            return data["access_token"]

    def _rfc3339(self, dt: datetime) -> dict:
        return {"dateTime": dt.isoformat(), "timeZone": "America/Santiago"}

    async def create_event(self, data: CalendarEventInput) -> CalendarEventOut:
        rt = await self._get_refresh_token(data.organizer_usuario_id)
        if not rt:
            raise RuntimeError("El asesor no tiene Google conectado (refresh_token ausente)")

        access = await self._exchange_refresh(rt, usuario_id=data.organizer_usuario_id)

        ev = {
            "summary": data.title,
            "start": self._rfc3339(data.start),
            "end": self._rfc3339(data.end),
            "location": data.location or None,
            "description": data.description or None,
            "attendees": [
                {
                    "email": a.email, 
                    "displayName": a.display_name or None, 
                    "optional": a.optional,
                    "responseStatus": a.response_status or "needsAction"  
                }
                for a in data.attendees
            ],
        }

        if data.create_meet_link:
            ev["conferenceData"] = {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            }

        headers = {"Authorization": f"Bearer {access}"}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(
                CAL_EVENTS_URL,
                headers=headers,
                json=ev,
                params={
                    "supportsAttachments": "false",
                    "sendUpdates": "all",       
                    "sendNotifications": "true"  
                },
            )
            if r.status_code == 403:
                raise RuntimeError("Falta permiso Calendar en la cuenta Google del asesor.")
            r.raise_for_status()
            j = r.json()
            return CalendarEventOut(
                provider_event_id=j.get("id", ""),
                html_link=j.get("htmlLink"),
            )
        
    async def get_event(self, *, organizer_usuario_id: str, event_id: str) -> dict:
        rt = await self._get_refresh_token(organizer_usuario_id)
        if not rt:
            raise RuntimeError("El asesor no tiene Google conectado (refresh_token ausente)")
        access = await self._exchange_refresh(rt, usuario_id=organizer_usuario_id)
        headers = {"Authorization": f"Bearer {access}"}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(f"{CAL_EVENTS_URL}/{event_id}", headers=headers)
            r.raise_for_status()
            return r.json()

    async def watch_primary_calendar(self, *, organizer_usuario_id: str, callback_url: str,
                                     channel_id: str, token: str | None = None,
                                     ttl_seconds: int = 86_000) -> dict:
        rt = await self._get_refresh_token(organizer_usuario_id)
        if not rt:
            raise RuntimeError("El asesor no tiene Google conectado (refresh_token ausente)")
        access = await self._exchange_refresh(rt, usuario_id=organizer_usuario_id)
        headers = {"Authorization": f"Bearer {access}"}
        body = {
            "id": channel_id,           # UUID que generas
            "type": "web_hook",
            "address": callback_url,    # tu endpoint público https
            "token": token or "",       # opcional, para validar que la notificación es tuya
            "params": {"ttl": str(ttl_seconds)}
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # app/interface_adapters/gateways/calendar/google_calendar_client.py

            r = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
                headers=headers,
                json=body
            )

            r.raise_for_status()
            return r.json()

    async def stop_channel(
        self,
        *,
        organizer_usuario_id: str,
        channel_id: str,
        resource_id: str,
    ) -> None:
        headers = await self._auth_headers_for_user(organizer_usuario_id)
        body = {"id": channel_id, "resourceId": resource_id}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post("https://www.googleapis.com/calendar/v3/channels/stop", headers=headers, json=body)
            if r.status_code not in (200, 204):
                log.debug("channels.stop (%s) devolvió %s: %s", channel_id, r.status_code, r.text[:200])
                r.raise_for_status()
        log.info("Canal Google detenido: channel_id=%s resource_id=%s", channel_id, resource_id)

    async def delete_event(
        self,
        *,
        organizer_usuario_id: str,
        event_id: str,
        send_updates: str = "all",
    ) -> None:
        if not event_id:
            return

        headers = await self._auth_headers_for_user(organizer_usuario_id)
        params = {"sendUpdates": send_updates}
        url = f"{CAL_EVENTS_URL}/{event_id}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.delete(url, headers=headers, params=params)
            if r.status_code in (200, 204):
                return
            if r.status_code == 404:
                log.info("Evento %s ya no existe en Calendar.", event_id)
                return
            r.raise_for_status()
    async def set_attendee_response(
        self,
        *,
        event_id: str,
        attendee_email: str,
        response: str = "accepted",
        # Modo organizador:
        organizer_usuario_id: Optional[str] = None,
        calendar_id: str = "primary",
        # Modo invitado (lo que disparas desde Telegram):
        usuario_id: Optional[str] = None,
        send_updates: str = "all",
    ) -> bool:
        """
        Ajusta el responseStatus del asistente 'attendee_email' en el evento.
        - Si pasas usuario_id: actúa como ese USUARIO (calendar_id='primary').
        - Si pasas organizer_usuario_id: actúa como ORGANIZADOR (calendar_id indicado).
        """
        if not event_id or not attendee_email:
            raise ValueError("event_id y attendee_email son obligatorios")

        # 1) ¿Con quién autenticamos?
        if usuario_id:
            headers = await self._auth_headers_for_user(usuario_id)
            target_calendar_id = "primary"
        elif organizer_usuario_id:
            headers = await self._auth_headers_for_user(organizer_usuario_id)
            target_calendar_id = calendar_id or "primary"
        else:
            raise RuntimeError("Debes proporcionar usuario_id (invitado) o organizer_usuario_id (organizador)")

        # 2) GET evento (si no existe para ese calendario, seguimos con attendees vacíos)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            get_url = f"https://www.googleapis.com/calendar/v3/calendars/{target_calendar_id}/events/{event_id}"
            r_get = await client.get(get_url, headers=headers)
            attendees = []
            ev_summary = None
            if r_get.status_code == 404:
                log.info(f"Evento {event_id} no presente en {target_calendar_id}; intentaremos PATCH directo de attendees")
            else:
                try:
                    r_get.raise_for_status()
                    ev = r_get.json()
                    attendees = ev.get("attendees", []) or []
                    ev_summary = ev.get("summary")
                except Exception as e:
                    log.warning(f"GET evento fallo (seguiré): {e}")

        # 3) Actualiza/inyecta a ese asistente
        updated = False
        for a in attendees:
            if (a.get("email") or "").lower() == attendee_email.lower():
                a["responseStatus"] = response
                updated = True
                break
        if not updated:
            attendees.append({"email": attendee_email, "responseStatus": response})

        # 4) PATCH
        body = {"attendees": attendees}
        params = {"sendUpdates": send_updates}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            patch_url = f"https://www.googleapis.com/calendar/v3/calendars/{target_calendar_id}/events/{event_id}"
            r_patch = await client.patch(patch_url, headers=headers, json=body, params=params)

            if r_patch.status_code in (200, 201):
                log.info(f"RSVP actualizado ({response}) para '{attendee_email}' en '{ev_summary or event_id}'")
                return True

            # Log detallado para depurar
            try:
                txt = r_patch.text[:500]
            except Exception:
                txt = "<no body>"
            log.warning(f"PATCH RSVP falló: {r_patch.status_code} {txt}")
            r_patch.raise_for_status()
            return True
