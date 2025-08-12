from mcp.server.fastmcp import FastMCP
from interface_adapters.gateways.in_memory_event_repo import InMemoryEventRepository
from usecases.interactors import CreateEvent, ListEvents, GetEvent, DeleteEvent
from usecases.models import CreateEventRequest
from interface_adapters.presenters.event_presenter import EventOut, present_event, present_list
from interface_adapters.controllers.mcp_tools import EventCreateIn, EventIdIn

def build_mcp() -> FastMCP:
    mcp = FastMCP("event-mcp")

    repo = InMemoryEventRepository()
    create_uc = CreateEvent(repo)
    list_uc = ListEvents(repo)
    get_uc = GetEvent(repo)
    delete_uc = DeleteEvent(repo)

    @mcp.tool()
    def event_list() -> list[EventOut]:
        """Lista todos los eventos."""
        resp = list_uc.execute()
        return present_list(resp)

    @mcp.tool()
    def event_create(input: EventCreateIn) -> EventOut:
        """Crea un evento."""
        event = CreateEventRequest(title=input.title, start=input.start, end=input.end)
        resp = create_uc.execute(event)
        return present_event(resp)

    @mcp.tool()
    def event_get(input: EventIdIn) -> EventOut | None:
        """Obtiene un evento por id."""
        resp = get_uc.execute(input.id)
        if resp is None:
            return None
        return present_event(resp)

    @mcp.tool()
    def event_delete(input: EventIdIn) -> str:
        """Borra un evento por id."""
        delete_uc.execute(input.id)
        return "Hecho"

    return mcp