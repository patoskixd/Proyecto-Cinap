from typing import Any, Dict, Optional, List
from entities.event import Event
from dateutil import parser as dtparser

def to_google_body(
    *,
    title: str,
    start_iso: str,
    end_iso: str,
    description: Optional[str],
    location: Optional[str],
    attendees: List[str],
    timezone: Optional[str] = None,
) -> Dict[str, Any]:
    body: Dict[str, Any] = {
        "summary": title,
        "start": {"dateTime": start_iso},
        "end": {"dateTime": end_iso},
    }
    if description:
        body["description"] = description
    if location:
        body["location"] = location
    if attendees:
        body["attendees"] = [{"email": e} for e in attendees]
    if timezone:
        body["start"]["timeZone"] = timezone
        body["end"]["timeZone"] = timezone
    return body

def from_google_event(item: Dict[str, Any], *, calendar_id: str) -> Event:
    start_dt = dtparser.isoparse(item["start"]["dateTime"])
    end_dt   = dtparser.isoparse(item["end"]["dateTime"])
    emails = [a.get("email") for a in item.get("attendees", []) if a.get("email")]
    return Event(
        id=item["id"],
        calendar_id=calendar_id,
        title=item.get("summary", ""),
        start=start_dt,
        end=end_dt,
        description=item.get("description"),
        location=item.get("location"),
        attendees=emails,
        requested_by_role=None,
        requested_by_email=None,
    )

def to_google_patch_body(
    *,
    title: Optional[str] = None,
    start_iso: Optional[str] = None,
    end_iso: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    timezone: Optional[str] = None,
) -> Dict[str, Any]:
    body: Dict[str, Any] = {}
    if title is not None:
        body["summary"] = title
    if start_iso is not None:
        body.setdefault("start", {})["dateTime"] = start_iso
        if timezone:
            body["start"]["timeZone"] = timezone
    if end_iso is not None:
        body.setdefault("end", {})["dateTime"] = end_iso
        if timezone:
            body["end"]["timeZone"] = timezone
    if description is not None:
        body["description"] = description
    if location is not None:
        body["location"] = location
    if attendees is not None:
        body["attendees"] = [{"email": e} for e in attendees]
    return body