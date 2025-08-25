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

DEFAULT_CALENDAR_ID: str = os.getenv("DEFAULT_CALENDAR_ID", "primary")
SEARCH_BACK_DAYS: int = int(os.getenv("DELETE_SEARCH_BACK_DAYS", "30"))
SEARCH_FWD_DAYS: int = int(os.getenv("DELETE_SEARCH_FWD_DAYS", "365"))

# Helpers

def ok_msg(say: str, **data: Any) -> Dict[str, Any]:
    return {"ok": True, "say": say, **({"data": data} if data else {})}

def err_msg(code: str, message: str, **extra: Any) -> Dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message, **({"extra": extra} if extra else {})}}

def _with_default_calendar_id(value: Optional[str]) -> str:
    return value or DEFAULT_CALENDAR_ID

def _ensure_range(time_min: Optional[datetime], time_max: Optional[datetime]) -> Tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    tmin = time_min or (now - timedelta(days=SEARCH_BACK_DAYS))
    tmax = time_max or (now + timedelta(days=SEARCH_FWD_DAYS))
    return tmin, tmax

def _norm(s: Optional[str]) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return s.casefold().strip()

def _title_matches(query: str, candidate: Optional[str]) -> bool:
    nq, nc = _norm(query), _norm(candidate)
    return bool(nq) and (nq in nc or nc in nq)

def _contains_fragment(fragment: Optional[str], text: Optional[str]) -> bool:
    if not fragment:
        return True
    return _norm(fragment) in _norm(text)

def _as_items(result: Any) -> List[Any]:
    if isinstance(result, list):
        return result
    return getattr(result, "items", []) or []

def _event_brief(ev) -> Dict[str, Any]:
    """Representación para listas/candidatos."""
    return {
        "id": ev.id,
        "title": ev.title,
        "start": ev.start if getattr(ev, "start", None) else None,
        "end": ev.end if getattr(ev, "end", None) else None,
        "description": getattr(ev, "description", None),
    }

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

    @mcp.tool(description=
    "CREA un evento nuevo (NO edita existentes). \
    Campos requeridos: title, start, end. Opcionales: calendar_id (defecto 'primary'), description, location, attendees[]. \
    Fechas en ISO 8601 con zona horaria.")
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
        payload["calendar_id"] = _with_default_calendar_id(payload.get("calendar_id"))
        resp = create_uc.execute(CreateEventRequest(**payload))
        presented = present_event(resp)
        say = f"Evento creado: “{presented.title}” el {presented.start}–{presented.end}."
        return ok_msg(say, event=presented)

    @mcp.tool(description=
    "LISTA eventos en un rango. \
    Requeridos: start_from, end_to. Opcional: calendar_id (defecto 'primary')." \
    "Ej: {\"start_from\":\"2025-09-01T00:00:00-04:00\",\"end_to\":\"2025-09-07T23:59:59-04:00\"}.")
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

        cal_id = _with_default_calendar_id(input.calendar_id)
        resp = list_uc.execute(ListEventsRequest(calendar_id=cal_id, time_min=input.start_from, time_max=input.end_to))
        presented = present_list(resp)
        say = f"{len(presented)} evento(s) encontrados."
        return ok_msg(say, items=presented)

    @mcp.tool(description=
    "OBTIENE un evento por ID. \
    Requerido: event_id. Opcional: calendar_id (defecto 'primary').")
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

        calendar_id = _with_default_calendar_id(input.calendar_id)
        resp = get_uc.execute(calendar_id=calendar_id, event_id=input.event_id)
        return present_event(resp) if resp else None

    @mcp.tool(description=
    "ELIMINA un evento por ID. \
    Requerido: event_id. Opcional: calendar_id (defecto 'primary').")
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

        calendar_id = _with_default_calendar_id(input.calendar_id)
        delete_uc.execute(calendar_id=calendar_id, event_id=input.event_id)
        return ok_msg(f"Evento eliminado (id: {input.event_id}).")

    @mcp.tool(description=
    "BUSCA un evento por título y devuelve candidato único o ambigüedad. "
    "Requerido: title. Opcionales: start_from/end_to (si faltan, se usa un rango por defecto), calendar_id. "
    "Ejemplo: {\"title\":\"Reunión de asesoría\"}"
    )
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

        cal_id = _with_default_calendar_id(input.calendar_id)
        sf, st = _ensure_range(input.start_from, input.end_to)

        resp = list_uc.execute(ListEventsRequest(calendar_id=cal_id, time_min=sf, time_max=st))
        events = _as_items(resp)

        candidates = [_event_brief(ev) for ev in events if _title_matches(input.title, ev.title)]

        if not candidates:
            return err_msg("EVENT_NOT_FOUND", "No hay coincidencias.")
        if len(candidates) > 1:
            return err_msg("AMBIGUOUS_MATCH", "Múltiples coincidencias.", candidates=candidates)

        say = f"Evento encontrado: “{candidates[0]['title']}”."
        return ok_msg(say, candidate=candidates[0])

    @mcp.tool(description=
    "ACTUALIZA (reprograma/mueve/pospone) un evento existente. \
    Identificación por:\n\
    A) event_id (directo), o\n\
    B) title + ventana (start_from/end_to). Si falta la ventana, se usa un rango por defecto. \
    Patch: cualquiera de {title, start, end, attendees[], location, description}.")
    def event_update(
        input: Optional[EventUpdateFlexibleIn] = None,
        selector_event_id: Optional[str] = None,
        selector_calendar_id: Optional[str] = None,

        selector_title: Optional[str] = None,
        selector_start_from: Optional[datetime] = None,
        selector_end_to: Optional[datetime] = None,

        patch_title: Optional[str] = None,
        patch_start: Optional[datetime] = None,
        patch_end: Optional[datetime] = None,
        patch_attendees: Optional[List[str]] = None,
        patch_location: Optional[str] = None,
        patch_description: Optional[str] = None,
    ) -> Optional[EventOut] | Dict[str, Any]:
        if input is None:
            try:
                if selector_event_id:
                    selector = UpdateSelectorById(event_id=selector_event_id, calendar_id=selector_calendar_id)
                else:
                    selector = UpdateSelectorByTitle(
                        title=selector_title,
                        start_from=selector_start_from,
                        end_to=selector_end_to,
                        calendar_id=selector_calendar_id,
                    )
                patch = UpdatePatch(
                    title=patch_title, start=patch_start, end=patch_end,
                    attendees=patch_attendees, location=patch_location, description=patch_description,
                )
                input = EventUpdateFlexibleIn(selector=selector, patch=patch)
            except Exception as e:
                return err_msg("VALIDATION", f"Argumentos inválidos: {e}")

        sel = input.selector
        calendar_id = _with_default_calendar_id(getattr(sel, "calendar_id", None))

        if getattr(sel, "event_id", None):
            event_id = sel.event_id
        else:
            sfrom = getattr(sel, "start_from", None)
            sto   = getattr(sel, "end_to", None)
            if sfrom is None or sto is None:
                sfrom, sto = _ensure_range(sfrom, sto)

            resp = list_uc.execute(ListEventsRequest(calendar_id=calendar_id, time_min=sfrom, time_max=sto))
            events = _as_items(resp)
            matched = [ev for ev in events if _title_matches(sel.title, ev.title)]
            if not matched:
                return err_msg("EVENT_NOT_FOUND", "No se encontró el evento en el rango.")
            if len(matched) > 1:
                return err_msg("AMBIGUOUS_MATCH", "Más de un evento coincide.", candidates=[_event_brief(ev) for ev in matched])
            event_id = matched[0].id

        patch_dict = input.patch.model_dump(exclude_none=True)
        resp = update_uc.execute(UpdateEventRequest(
            calendar_id=calendar_id,
            event_id=event_id,
            title=patch_dict.get("title"),
            start=patch_dict.get("start"),
            end=patch_dict.get("end"),
            attendees=patch_dict.get("attendees"),
            location=patch_dict.get("location"),
            description=patch_dict.get("description"),
        ))
        if not resp:
            return err_msg("UPDATE_FAILED", "No fue posible actualizar el evento.")
        presented = present_event(resp)
        say = f"Evento actualizado: “{presented.title}”."
        return ok_msg(say, event=presented)

    @mcp.tool(description=
    "ELIMINA un evento por TÍTULO. \
    Requerido: title. Opcionales para desambiguar: start_from/end_to (si faltan, se usa un rango por defecto), description_contains, calendar_id. \
    Si hay múltiples coincidencias, devuelve candidatos en lugar de eliminar.")
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

        calendar_id = _with_default_calendar_id(input.calendar_id)
        sf, st = _ensure_range(input.start_from, input.end_to)

        resp = list_uc.execute(ListEventsRequest(calendar_id=calendar_id, time_min=sf, time_max=st))
        events = _as_items(resp)
        candidates = [
            _event_brief(ev)
            for ev in events
            if _title_matches(input.title, ev.title)
            and _contains_fragment(input.description_contains, getattr(ev, "description", None))
        ]
        if not candidates:
            return err_msg("EVENT_NOT_FOUND", "No hay coincidencias con ese título/rango/descripcion.")
        if len(candidates) > 1:
            return err_msg("AMBIGUOUS_MATCH", "Hay múltiples eventos que coinciden.", candidates=candidates)

        target_id = candidates[0]["id"]
        delete_uc.execute(calendar_id=calendar_id, event_id=target_id)
        return ok_msg(f"Evento eliminado: “{candidates[0]['title']}”.", deleted_event_id=target_id, calendar_id=calendar_id)

    return mcp