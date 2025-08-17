from typing import List
import os
from mcp.server.fastmcp import FastMCP

from interface_adapters.gateways.google.google_event_repo import GoogleCalendarEventRepository

# from interface_adapters.gateways.in_memory_event_repo import InMemoryEventRepository

from interface_adapters.presenters.event_presenter import EventOut, present_event, present_list
from interface_adapters.controllers.mcp_tools import EventCreateIn, ListEventsIn, EventKeyIn, EventUpdateIn

from usecases.interactors import CreateEvent, ListEvents, GetEvent, DeleteEvent, UpdateEvent
from usecases.models import CreateEventRequest, ListEventsRequest, UpdateEventRequest

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

    @mcp.tool()
    def event_create(input: EventCreateIn) -> EventOut:
        req = CreateEventRequest(**input.model_dump())
        resp = create_uc.execute(req)
        return present_event(resp)

    @mcp.tool()
    def event_list(input: ListEventsIn) -> List[EventOut]:
        req = ListEventsRequest(**input.model_dump())
        resp = list_uc.execute(req)
        return present_list(resp)

    @mcp.tool()
    def event_get(input: EventKeyIn) -> EventOut | None:
        resp = get_uc.execute(calendar_id=input.calendar_id, event_id=input.event_id)
        return present_event(resp) if resp else None

    @mcp.tool()
    def event_delete(input: EventKeyIn) -> str:
        delete_uc.execute(calendar_id=input.calendar_id, event_id=input.event_id)
        return "Hecho"
    
    @mcp.tool()
    def event_update(input: EventUpdateIn) -> EventOut | None:
        req = UpdateEventRequest(**input.model_dump())
        resp = update_uc.execute(req)
        return present_event(resp) if resp else None

    return mcp