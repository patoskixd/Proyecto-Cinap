from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
import os
from mcp.server.fastmcp import FastMCP
import unicodedata

from interface_adapters.gateways.google.google_event_repo import GoogleCalendarEventRepository

# from interface_adapters.gateways.in_memory_event_repo import InMemoryEventRepository

from interface_adapters.presenters.event_presenter import EventOut, present_event, present_list
from interface_adapters.controllers.mcp_tools import (
    EventCreateIn, ListEventsIn, EventKeyIn,
    EventUpdateFlexibleIn, FindEventIn, DeleteByTitleIn,
    UpdatePatch, UpdateSelectorById, UpdateSelectorByTitle
)

from usecases.interactors import CreateEvent, ListEvents, GetEvent, DeleteEvent, UpdateEvent
from usecases.models import CreateEventRequest, ListEventsRequest, UpdateEventRequest

from interface_adapters.services.tool_envelopes import ok_msg, err_msg
from interface_adapters.services.tool_helpers import with_default_calendar_id, ensure_range, as_items, event_brief
from interface_adapters.services.tool_text import title_matches, contains_fragment
from interface_adapters.services.patch_relative import apply_relative_patch
from frameworks_and_drivers.mcp.tool_descriptions import (
    EVENT_CREATE_DESC, EVENT_LIST_DESC, EVENT_FIND_DESC, EVENT_UPDATE_DESC,
    EVENT_DELETE_BY_TITLE_DESC, EVENT_GET_DESC, EVENT_DELETE_DESC
)

def build_mcp() -> FastMCP:
    mcp = FastMCP("event-mcp")
    
    repo = GoogleCalendarEventRepository(
        credentials_file=os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json"),
        token_file=os.getenv("GOOGLE_TOKEN_FILE", "token.json"),
        default_timezone=os.getenv("DEFAULT_TZ", "America/Santiago"),
        headless=os.getenv("GOOGLE_HEADLESS", "0"),
    )

    # repo = InMemoryEventRepository()

    create_uc = CreateEvent(repo)
    list_uc   = ListEvents(repo)
    get_uc    = GetEvent(repo)
    delete_uc = DeleteEvent(repo)
    update_uc = UpdateEvent(repo)

    @mcp.tool(description=EVENT_CREATE_DESC)
    def event_create(
        input: Optional[EventCreateIn] = None,
        title: Optional[str] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        attendees: Optional[List[str]] = None,
        location: Optional[str] = None,
        description: Optional[str] = None,
        calendar_id: Optional[str] = None,
    ) -> EventOut | Dict[str, Any]:
        if input is None:
            try:
                input = EventCreateIn(
                    title=title, start=start, end=end,
                    attendees=attendees, location=location, description=description,
                    calendar_id=calendar_id,
                )
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        payload = input.model_dump()
        payload["calendar_id"] = with_default_calendar_id(payload.get("calendar_id"))
        resp = create_uc.execute(CreateEventRequest(**payload))
        presented = present_event(resp)
        say = f"Evento creado: “{presented.title}” el {presented.start}–{presented.end}."
        return ok_msg(say, event=presented)

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

    @mcp.tool(description=EVENT_DELETE_DESC)
    def event_delete(
        input: Optional[EventKeyIn] = None,
        calendar_id: Optional[str] = None,
        event_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if input is None:
            try:
                input = EventKeyIn(calendar_id=calendar_id, event_id=event_id)
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        calendar_id = with_default_calendar_id(input.calendar_id)
        delete_uc.execute(calendar_id=calendar_id, event_id=input.event_id)
        return ok_msg(f"Evento eliminado (id: {input.event_id}).")

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

    @mcp.tool(description=EVENT_DELETE_BY_TITLE_DESC)
    def event_delete_by_title(
        input: Optional[DeleteByTitleIn] = None,
        title: Optional[str] = None,
        calendar_id: Optional[str] = None,
        start_from: Optional[datetime] = None,
        end_to: Optional[datetime] = None,
        description_contains: Optional[str] = None,
    ) -> Dict[str, Any]:
        if input is None:
            try:
                input = DeleteByTitleIn(
                    title=title,
                    calendar_id=calendar_id,
                    start_from=start_from,
                    end_to=end_to,
                    description_contains=description_contains,
                )
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        calendar_id = with_default_calendar_id(input.calendar_id)
        sf, st = ensure_range(input.start_from, input.end_to)

        resp = list_uc.execute(ListEventsRequest(calendar_id=calendar_id, time_min=sf, time_max=st))
        events = as_items(resp)
        candidates = [
            event_brief(ev)
            for ev in events
            if title_matches(input.title, ev.title)
            and contains_fragment(input.description_contains, getattr(ev, "description", None))
        ]
        if not candidates:
            return err_msg("EVENT_NOT_FOUND", "No hay coincidencias con ese título/rango/descripcion.")
        if len(candidates) > 1:
            return err_msg("AMBIGUOUS_MATCH", "Hay múltiples eventos que coinciden.", candidates=candidates)

        target_id = candidates[0]["id"]
        delete_uc.execute(calendar_id=calendar_id, event_id=target_id)
        return ok_msg(f"Evento eliminado: “{candidates[0]['title']}”.", deleted_event_id=target_id, calendar_id=calendar_id)

    return mcp