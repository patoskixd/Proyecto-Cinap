from typing import Protocol, Optional, Iterable, TypedDict

class PendingConfirmationDTO(TypedDict):
    id: str
    category: str             
    categoryLabel: str
    serviceTitle: str
    teacher: str
    teacherEmail: str
    dateISO: str
    time: str
    location: str
    room: str
    createdAtISO: str
    status: str               

class AdvisorConfirmationsRepo(Protocol):
    async def resolve_asesor_id(self, usuario_id: str) -> Optional[str]: ...
    async def get_pending_for(self, asesor_id: str) -> list[PendingConfirmationDTO]: ...
