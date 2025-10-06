from __future__ import annotations
import httpx, uuid, asyncio
from typing import Optional
from datetime import datetime
from app.use_cases.ports.calendar_port import CalendarPort, CalendarEventInput, CalendarEventOut

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
CAL_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
SCOPES = "https://www.googleapis.com/auth/calendar"

class GoogleCalendarClient(CalendarPort):
    def __init__(self, *, client_id: str, client_secret: str, timeout: int = 20, get_refresh_token_by_usuario_id):
        """
        get_refresh_token_by_usuario_id: async fn(usuario_id: str) -> str | None
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.timeout = timeout
        self._get_rt = get_refresh_token_by_usuario_id

    async def _exchange_refresh(self, refresh_token: str) -> str:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            })
            r.raise_for_status()
            data = r.json()
            return data["access_token"]

    def _rfc3339(self, dt: datetime) -> dict:
        return {"dateTime": dt.isoformat(), "timeZone": "America/Santiago"}

    async def create_event(self, data: CalendarEventInput) -> CalendarEventOut:
        rt = await self._get_rt(data.organizer_usuario_id)
        if not rt:
            raise RuntimeError("El asesor no tiene Google conectado (refresh_token ausente)")

        access = await self._exchange_refresh(rt)

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
