from typing import Optional, List, Dict, Any
from datetime import datetime
from googleapiclient.discovery import build

from entities.event import Event
from usecases.ports import EventRepository
from interface_adapters.gateways.google.google_auth import get_credentials
from interface_adapters.gateways.google.google_mappers import to_google_body, from_google_event, to_google_patch_body

class GoogleCalendarEventRepository(EventRepository):
    def __init__(
        self,
        *,
        credentials_file: str = "credentials.json",
        token_file: str = "token.json",
        default_timezone: Optional[str] = None,
        headless: bool = False,
    ) -> None:
        self.creds = get_credentials(
            credentials_file=credentials_file,
            token_file=token_file,
            headless=headless,
        )
        self.service = build("calendar", "v3", credentials=self.creds)
        self.default_timezone = default_timezone

    def add(
        self,
        *,
        calendar_id: str,
        title: str,
        start: datetime,
        end: datetime,
        description: Optional[str],
        location: Optional[str],
        attendees: List[str],
        requested_by_role: Optional[str],
        requested_by_email: Optional[str],
    ) -> Event:
        body = to_google_body(
            title=title,
            start_iso=start.isoformat(),
            end_iso=end.isoformat(),
            description=description,
            location=location,
            attendees=attendees or [],
            timezone=self.default_timezone,
        )
        created = self.service.events().insert(
            calendarId=calendar_id, body=body, sendUpdates="all"
        ).execute()
        return from_google_event(created, calendar_id=calendar_id)

    def list(
        self,
        *,
        calendar_id: str,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        q: Optional[str] = None,
        max_results: int = 100,
    ) -> List[Event]:
        kwargs: Dict[str, Any] = {
            "calendarId": calendar_id,
            "singleEvents": True,
            "orderBy": "startTime",
            "maxResults": max_results,
        }
        if time_min:
            kwargs["timeMin"] = time_min.isoformat()
        if time_max:
            kwargs["timeMax"] = time_max.isoformat()
        if q:
            kwargs["q"] = q

        result = self.service.events().list(**kwargs).execute()
        items = result.get("items", [])
        return [
            from_google_event(it, calendar_id=calendar_id)
            for it in items
            if "dateTime" in it.get("start", {})
        ]

    def get(self, *, calendar_id: str, event_id: str) -> Optional[Event]:
        try:
            item = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()
            if "dateTime" not in item.get("start", {}):
                return None
            return from_google_event(item, calendar_id=calendar_id)
        except Exception:
            return None

    def delete(self, *, calendar_id: str, event_id: str) -> None:
        try:
            self.service.events().delete(calendarId=calendar_id, eventId=event_id, sendUpdates="all").execute()
        except Exception:
            pass

    def update(
        self,
        *,
        calendar_id: str,
        event_id: str,
        title: Optional[str] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> Event:
        body = to_google_patch_body(
            title=title,
            start_iso=start.isoformat() if start else None,
            end_iso=end.isoformat() if end else None,
            description=description,
            location=location,
            attendees=attendees,
            timezone=self.default_timezone,
        )
        updated = self.service.events().patch(
            calendarId=calendar_id,
            eventId=event_id,
            body=body,
            sendUpdates="all",
        ).execute()
        return from_google_event(updated, calendar_id=calendar_id)