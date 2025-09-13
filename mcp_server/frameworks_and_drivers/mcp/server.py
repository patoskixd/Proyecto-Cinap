from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
import os
from mcp.server.fastmcp import FastMCP
from dateutil import parser as dtparser

from interface_adapters.gateways.google.google_event_repo import GoogleCalendarEventRepository

# from interface_adapters.gateways.in_memory_event_repo import InMemoryEventRepository

from interface_adapters.presenters.event_presenter import EventOut, present_event, present_list
from interface_adapters.controllers.mcp_tools import (
    EventCreateIn, ListEventsIn, EventKeyIn,
    EventUpdateFlexibleIn, FindEventIn, DeleteIn,
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
    EVENT_GET_DESC, EVENT_DELETE_DESC
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
        confirm: Optional[bool] = False,
        allow_duplicates: Optional[bool] = False,
        dedupe_window_minutes: Optional[int] = 10,
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

        try:
            if isinstance(payload["start"], str): payload["start"] = dtparser.isoparse(payload["start"])
            if isinstance(payload["end"], str):   payload["end"]   = dtparser.isoparse(payload["end"])
            if payload["start"] >= payload["end"]:
                return err_msg("VALIDATION", "start debe ser anterior a end")
        except Exception as e:
            return err_msg("VALIDATION", f"Fechas inválidas: {e}")

        norm_atts, seen = [], set()
        for a in payload.get("attendees") or []:
            if not a: continue
            email = str(a).strip().lower()
            if email and email not in seen:
                seen.add(email); norm_atts.append(email)
        payload["attendees"] = norm_atts

        near_from = payload["start"] - timedelta(minutes=int(dedupe_window_minutes or 10))
        near_to   = payload["start"] + timedelta(minutes=int(dedupe_window_minutes or 10))
        resp = list_uc.execute(ListEventsRequest(
            calendar_id=payload["calendar_id"],
            time_min=near_from, time_max=near_to,
            q=None, max_results=50
        ))
        candidates = as_items(resp)
        duplicates = [
            event_brief(ev) for ev in candidates
            if title_matches(payload["title"], getattr(ev, "title", None))
        ]

        if not confirm:
            preview = {
                "title": payload["title"],
                "calendar_id": payload["calendar_id"],
                "start": payload["start"],
                "end": payload["end"],
                "duration_minutes": int((payload["end"] - payload["start"]).total_seconds() // 60),
                "attendees": payload["attendees"],
                "location": payload.get("location"),
                "description": payload.get("description"),
                "possible_duplicates": duplicates,
                "dedupe_window_minutes": dedupe_window_minutes,
            }
            msg = f"¿Confirmas la creación de la reunión?"
            if duplicates and not allow_duplicates:
                msg += " Se detectaron posibles duplicados cercanos."
            return ok_msg(msg, preview=preview)

        if duplicates and not allow_duplicates:
            return err_msg(
                "POSSIBLE_DUPLICATE",
                "Se detectaron posibles duplicados cercanos. Vuelve a llamar con allow_duplicates=True para continuar.",
                candidates=duplicates
            )

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

    return mcp