from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
import os, httpx, json
from mcp.server.fastmcp import FastMCP
from dateutil import parser as dtparser

from interface_adapters.gateways.google.google_auth import GoogleOAuthAdapter
from interface_adapters.gateways.google.google_event_repo import GoogleCalendarEventRepository

from interface_adapters.presenters.event_presenter import EventOut, present_event, present_list
from interface_adapters.controllers.mcp_tools import (
    EventCreateIn, ListEventsIn, EventKeyIn,
    EventUpdateFlexibleIn, FindEventIn, DeleteIn,
    UpdateSelectorByTitle
)

from usecases.interactors import CreateEvent, ListEvents, GetEvent, DeleteEvent, UpdateEvent
from usecases.models import CreateEventRequest, ListEventsRequest, UpdateEventRequest

from interface_adapters.services.tool_envelopes import ok_msg, err_msg
from interface_adapters.services.tool_helpers import with_default_calendar_id, ensure_range, as_items, event_brief
from interface_adapters.services.tool_text import title_matches, contains_fragment
from interface_adapters.services.patch_relative import apply_relative_patch
from frameworks_and_drivers.mcp.tool_descriptions import (
    EVENT_CREATE_DESC, EVENT_LIST_DESC, EVENT_FIND_DESC, EVENT_UPDATE_DESC,
    EVENT_GET_DESC, EVENT_DELETE_DESC
)

def build_mcp() -> FastMCP:
    mcp = FastMCP("event-mcp")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    DEFAULT_TZ = os.getenv("DEFAULT_TZ", "America/Santiago")

    oauth_adapter = GoogleOAuthAdapter()
    repo = GoogleCalendarEventRepository(default_timezone="America/Santiago")
    create_uc = CreateEvent(repo)
    list_uc   = ListEvents(repo)
    get_uc    = GetEvent(repo)
    delete_uc = DeleteEvent(repo)
    update_uc = UpdateEvent(repo)

    def _rfc3339(dt: datetime) -> Dict[str, Any]:
        if dt.tzinfo is None:
            from dateutil import tz as dt_tz
            dt = dt.replace(tzinfo=dt_tz.gettz(DEFAULT_TZ))
        return {"dateTime": dt.isoformat(), "timeZone": DEFAULT_TZ}

    def _exchange_refresh_sync(refresh_token: str) -> str:
        with httpx.Client(timeout=20) as client:
            r = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            r.raise_for_status()
            return r.json()["access_token"]

    @mcp.tool(description="Crea un evento en Google Calendar")
    def event_create(
        title: str,
        start: datetime | str,
        end: datetime | str,
        attendees: Optional[List[str]] = None,
        location: Optional[str] = None,
        description: Optional[str] = None,
        calendar_id: Optional[str] = None,
        send_updates: Optional[str] = "all",
        refresh_token: Optional[str] = None,
        asesoria_id: Optional[str] = None,
        organizer_usuario_id: Optional[str] = None,
    ) -> EventOut | Dict[str, Any]:
        try:
            if isinstance(start, str):
                start = dtparser.isoparse(start)
            if isinstance(end, str):
                end = dtparser.isoparse(end)
            if start >= end:
                return err_msg("VALIDATION", "start debe ser anterior a end")
        except Exception as e:
            return err_msg("VALIDATION", f"Fechas inválidas: {e}")

        norm_atts = []
        seen = set()
        for a in (attendees or []):
            if a and (email := str(a).strip().lower()) and email not in seen:
                seen.add(email)
                norm_atts.append(email)

        if not refresh_token:
            return err_msg("OAUTH_REQUIRED", "Debe enviarse el refresh_token del asesor.")

        try:
            access_token = oauth_adapter.exchange_refresh(refresh_token)
        except Exception as e:
            return err_msg("OAUTH_EXCHANGE", f"No pude refrescar el token del asesor: {e}")

        cal_id = with_default_calendar_id(calendar_id)
        req = CreateEventRequest(
            calendar_id=cal_id,
            title=title,
            start=start,
            end=end,
            oauth_access_token=access_token,
            description=description,
            location=location,
            attendees=norm_atts,
            send_updates=(send_updates or "all"),
        )
        resp = create_uc.execute(req)

        presented = present_event(resp)
        say = f"Evento creado en tu calendario."

        provider_event_id = presented.id
        html_link = presented.html_link

        data = {"event": presented, "calendar_event_id": provider_event_id, "html_link": html_link}

        if asesoria_id and organizer_usuario_id and provider_event_id:
            data["next_hint"] = {
                "next_tool": "calendar_event_upsert",
                "suggested_args": {
                    "input": {
                        "asesoria_id": asesoria_id,
                        "organizer_usuario_id": organizer_usuario_id,
                        "calendar_event_id": provider_event_id,
                        "html_link": html_link,
                    }
                }
            }

        return ok_msg(say, **data)
    
    @mcp.tool(description="Elimina un evento en Google Calendar por su event_id (Google) usando OAuth del asesor.")
    def event_delete_by_id(
        calendar_id: Optional[str] = None,
        event_id: Optional[str] = None,
        refresh_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not event_id:
            return err_msg("VALIDATION", "Debes indicar event_id (Google).")
        if not refresh_token:
            return err_msg("OAUTH_REQUIRED", "Debe enviarse el refresh_token del asesor.")

        try:
            access_token = oauth_adapter.exchange_refresh(refresh_token)
        except Exception as e:
            return err_msg("OAUTH_EXCHANGE", f"No pude refrescar el token del asesor: {e}")

        cal_id = with_default_calendar_id(calendar_id)

        try:
            delete_uc.execute(calendar_id=cal_id, event_id=event_id, oauth_access_token=access_token)
            return ok_msg(
                "Evento eliminado en tu calendario.",
                deleted_event_id=event_id,
                calendar_id=cal_id,
            )
        except Exception as e:
            return err_msg("GOOGLE_DELETE_FAILED", f"No se pudo eliminar en Google: {e}")
        
    @mcp.tool(description="Parchea asistentes de un evento por event_id (marca asistencia del docente).")
    def event_patch_attendees(
        event_id: str,
        attendees_patch: List[Dict[str, Any]],
        calendar_id: Optional[str] = None,
        send_updates: Optional[str] = "all",
        refresh_token: Optional[str] = None,
    ) -> EventOut | Dict[str, Any]:
        if not event_id:
            return err_msg("VALIDATION", "Debes indicar event_id (Google).")
        if not isinstance(attendees_patch, list) or not attendees_patch:
            return err_msg("VALIDATION", "attendees_patch debe ser una lista no vacía.")
        if not refresh_token:
            return err_msg("OAUTH_REQUIRED", "Debe enviarse el refresh_token del usuario que marca asistencia (docente).")
        
        norm_atts: List[Dict[str, Any]] = []
        seen = set()
        for a in attendees_patch:
            if not isinstance(a, dict):
                continue
            email = (a.get("email") or "").strip().lower()
            if not email or email in seen:
                continue
            seen.add(email)
            rs = (a.get("responseStatus") or "").strip() or "accepted"
            norm_atts.append({"email": email, "responseStatus": rs})

        if not norm_atts:
            return err_msg("VALIDATION", "attendees_patch no contiene emails válidos.")

        try:
            access_token = oauth_adapter.exchange_refresh(refresh_token)
        except Exception as e:
            return err_msg("OAUTH_EXCHANGE", f"No pude refrescar el token del usuario: {e}")

        cal_id = with_default_calendar_id(calendar_id)

        try:
            req = UpdateEventRequest(
                calendar_id=cal_id,
                event_id=event_id,
                oauth_access_token=access_token,
                send_updates=(send_updates or "all"),
                absolute_patch={"attendees": norm_atts},
            )
            updated = update_uc.execute(req)
            presented = present_event(updated)
            say = f"Asistencia actualizada en tu calendario."
            return ok_msg(say, event=presented)
        except Exception as e:
            return err_msg("GOOGLE_UPDATE_FAILED", f"No se pudo actualizar el evento: {e}")

    """
    @mcp.tool(description=EVENT_LIST_DESC)
    def event_list(
        input: Optional[ListEventsIn] = None,
        calendar_id: Optional[str] = None,
        start_from: Optional[datetime] = None,
        end_to: Optional[datetime] = None,
    ) -> List[EventOut] | Dict[str, Any]:
        if input is None:
            try:
                input = ListEventsIn(calendar_id=calendar_id, start_from=start_from, end_to=end_to)
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        cal_id = with_default_calendar_id(input.calendar_id)
        resp = list_uc.execute(ListEventsRequest(calendar_id=cal_id, time_min=input.start_from, time_max=input.end_to))
        presented = present_list(resp)
        say = f"{len(presented)} evento(s) encontrados."
        return ok_msg(say, items=presented)

    @mcp.tool(description=EVENT_GET_DESC)
    def event_get(
        input: Optional[EventKeyIn] = None,
        calendar_id: Optional[str] = None,
        event_id: Optional[str] = None,
    ) -> EventOut | None | Dict[str, Any]:
        if input is None:
            try:
                input = EventKeyIn(calendar_id=calendar_id, event_id=event_id)
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        calendar_id = with_default_calendar_id(input.calendar_id)
        resp = get_uc.execute(calendar_id=calendar_id, event_id=input.event_id)
        return present_event(resp) if resp else None

    @mcp.tool(description=EVENT_FIND_DESC)
    def event_find(
        input: Optional[FindEventIn] = None,
        calendar_id: Optional[str] = None,
        title: Optional[str] = None,
        start_from: Optional[datetime] = None,
        end_to: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        if input is None:
            try:
                input = FindEventIn(
                    calendar_id=calendar_id,
                    title=title,
                    start_from=start_from,
                    end_to=end_to,
                )
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        cal_id = with_default_calendar_id(input.calendar_id)
        sf, st = ensure_range(input.start_from, input.end_to)

        resp = list_uc.execute(ListEventsRequest(calendar_id=cal_id, time_min=sf, time_max=st))
        events = as_items(resp)

        candidates = [event_brief(ev) for ev in events if title_matches(input.title, ev.title)]

        if not candidates:
            return err_msg("EVENT_NOT_FOUND", "No hay coincidencias.")
        if len(candidates) > 1:
            return err_msg("AMBIGUOUS_MATCH", "Múltiples coincidencias.", candidates=candidates)

        say = f"Evento encontrado: “{candidates[0]['title']}”."
        return ok_msg(say, candidate=candidates[0])

    @mcp.tool(description=EVENT_UPDATE_DESC)
    def event_update(
        input: Optional[EventUpdateFlexibleIn] = None,
        selector: Optional[Dict[str, Any]] = None,
        patch: Optional[Dict[str, Any]] = None,
        confirm: Optional[bool] = False,
    ) -> Optional[EventOut] | Dict[str, Any]:

        if input is None:
            if not isinstance(selector, dict) or not isinstance(patch, dict):
                return err_msg("VALIDATION", "Debes enviar `selector` y `patch` (o `input`).")

            try:
                if selector.get("event_id"):
                    sel = UpdateSelectorById(
                        event_id=selector.get("event_id"),
                        calendar_id=selector.get("calendar_id"),
                    )
                else:
                    title = (selector.get("title") or "").strip()
                    if not title:
                        return err_msg("VALIDATION", "Debes indicar `selector.event_id` o `selector.title` (no vacío).")
                    sel = UpdateSelectorByTitle(
                        title=title,
                        start_from=selector.get("start_from"),
                        end_to=selector.get("end_to"),
                        calendar_id=selector.get("calendar_id"),
                    )

                pat = UpdatePatch(**patch)
                input = EventUpdateFlexibleIn(selector=sel, patch=pat)
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        sel = input.selector
        pat = input.patch
        calendar_id = with_default_calendar_id(getattr(sel, "calendar_id", None))

        if getattr(sel, "event_id", None):
            event_id = sel.event_id
        else:
            sfrom = getattr(sel, "start_from", None)
            sto   = getattr(sel, "end_to", None)
            if sfrom is None or sto is None:
                sfrom, sto = ensure_range(sfrom, sto)
            resp = list_uc.execute(ListEventsRequest(calendar_id=calendar_id, time_min=sfrom, time_max=sto))
            events = as_items(resp)
            matched = [ev for ev in events if title_matches(sel.title, ev.title)]
            if not matched:
                return err_msg("EVENT_NOT_FOUND", "No se encontró el evento en el rango.")
            if len(matched) > 1:
                return err_msg("AMBIGUOUS_MATCH", "Más de un evento coincide.", candidates=[event_brief(ev) for ev in matched])
            event_id = matched[0].id

        current = get_uc.execute(calendar_id=calendar_id, event_id=event_id)
        if not current:
            return err_msg("EVENT_NOT_FOUND", "No se pudo obtener el evento actual para actualizar.")
        cur_start = getattr(current, "start", None)
        cur_end   = getattr(current, "end", None)
        if not (cur_start and cur_end):
            return err_msg("INVALID_EVENT", "El evento actual no tiene start/end válidos.")

        new_start, new_end = apply_relative_patch(cur_start, cur_end, pat)
        patch_dict = pat.model_dump(exclude_none=True)

        if not confirm:
            preview = {
                "id": getattr(current, "id", event_id),
                "title": getattr(current, "title", None),
                "old_start": cur_start,
                "old_end": cur_end,
                "new_start": new_start,
                "new_end": new_end,
                "duration_before_min": int((cur_end - cur_start).total_seconds() // 60),
                "duration_after_min": int((new_end - new_start).total_seconds() // 60),
                "changes": patch_dict,
            }
            return ok_msg(
                f"¿Confirmas la actualización de la reunión?",
                preview=preview
            )

        resp = update_uc.execute(UpdateEventRequest(
            calendar_id=calendar_id,
            event_id=event_id,
            title=patch_dict.get("title"),
            start=new_start,
            end=new_end,
            attendees=patch_dict.get("attendees"),
            location=patch_dict.get("location"),
            description=patch_dict.get("description"),
        ))
        if not resp:
            return err_msg("UPDATE_FAILED", "No fue posible actualizar el evento.")

        presented = present_event(resp)
        say = f"Evento actualizado: “{presented.title}”."
        return ok_msg(say, event=presented)

    @mcp.tool(description=EVENT_DELETE_DESC)
    def event_delete(
        input: Optional[DeleteIn] = None,
        calendar_id: Optional[str] = None,
        event_id: Optional[str] = None,
        title: Optional[str] = None,
        start_from: Optional[datetime] = None,
        end_to: Optional[datetime] = None,
        description_contains: Optional[str] = None,
        attendee_contains: Optional[str] = None,
        confirm: Optional[bool] = False,
        allow_multiple: Optional[bool] = False,
        limit: Optional[int] = 50,
    ) -> Dict[str, Any]:
        if input is None:
            try:
                input = DeleteIn(
                    calendar_id=calendar_id,
                    event_id=event_id,
                    title=title,
                    start_from=start_from,
                    end_to=end_to,
                    description_contains=description_contains,
                    attendee_contains=attendee_contains,
                )
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        cal_id = with_default_calendar_id(input.calendar_id)
        limit = max(1, min(200, int(limit or 50)))

        if input.event_id:
            current = get_uc.execute(calendar_id=cal_id, event_id=input.event_id)
            if not current:
                return err_msg("EVENT_NOT_FOUND", "No se encontró el evento por ID.")
            brief = event_brief(current)

            if not confirm:
                return ok_msg(
                    f"Vista previa: se eliminaría “{brief.get('title')}”. Envía confirm=True para ejecutar.",
                    preview=brief, calendar_id=cal_id
                )

            delete_uc.execute(calendar_id=cal_id, event_id=input.event_id)
            return ok_msg(
                f"Evento eliminado: “{brief.get('title')}”.",
                deleted=[brief], deleted_event_id=input.event_id, calendar_id=cal_id
            )

        sf, st = ensure_range(input.start_from, input.end_to)

        resp = list_uc.execute(ListEventsRequest(calendar_id=cal_id, time_min=sf, time_max=st))
        events = as_items(resp)

        att_sub = (input.attendee_contains or "").strip().lower()

        def _attendee_hit(ev) -> bool:
            if not att_sub: return True
            try:
                atts = getattr(ev, "attendees", []) or []
                return any(att_sub in (a or "").lower() for a in atts)
            except Exception:
                return False

        matched = [
            ev for ev in events
            if title_matches(input.title or "", getattr(ev, "title", None))
            and contains_fragment(input.description_contains, getattr(ev, "description", None))
            and _attendee_hit(ev)
        ]

        if not matched:
            return err_msg("EVENT_NOT_FOUND", "No hay coincidencias con ese título/rango/filtros.")

        candidates = [event_brief(ev) for ev in matched][:limit]

        if len(candidates) > 1 and not allow_multiple:
            return err_msg(
                "AMBIGUOUS_MATCH",
                "Hay múltiples eventos que coinciden. Vuelve a llamar con allow_multiple=True o elimina por event_id.",
                candidates=candidates
            )

        if not confirm:
            msg = "Se eliminará 1 evento." if len(candidates) == 1 else f"Se eliminarán {len(candidates)} eventos."
            return ok_msg(msg + " ¿Confirmas la eliminación?",
                          preview=candidates, calendar_id=cal_id)

        deleted = []
        for it in candidates:
            try:
                delete_uc.execute(calendar_id=cal_id, event_id=it["id"])
                deleted.append(it)
            except Exception:
                pass

        return ok_msg(
            f"Eliminado(s): {len(deleted)} evento(s).",
            deleted=deleted, calendar_id=cal_id
        )
    """

    return mcp