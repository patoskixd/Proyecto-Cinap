from dataclasses import dataclass
from .user import User

@dataclass
class TeacherPage:
    items: list["TeacherInfo"]
    page: int
    per_page: int
    total: int
    pages: int

@dataclass(frozen=True)
class DocentePerfil:
    id: str
    usuario_id: str
    activo: bool
    usuario: User | None = None


@dataclass
class TeacherInfo:
    id: str
    usuario_id: str
    name: str
    email: str
    activo: bool
