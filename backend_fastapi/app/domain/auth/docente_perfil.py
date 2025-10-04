from dataclasses import dataclass
from .user import User

@dataclass(frozen=True)
class DocentePerfil:
    id: str
    usuario_id: str
    activo: bool
    usuario: User | None = None