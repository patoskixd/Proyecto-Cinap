from dataclasses import dataclass
from typing import List, Optional
from .user import User

@dataclass(frozen=True)
class AsesorPerfil:
    id: str
    usuario_id: str
    activo: bool
    usuario: User | None = None

@dataclass(frozen=True) 
class ServicioAsignado:
    id: str
    asesor_id: str
    servicio_id: str

@dataclass(frozen=True)
class RegisterAdvisorRequest:
    """Datos necesarios para registrar un nuevo asesor"""
    name: str
    email: str
    service_ids: List[str]  
    
@dataclass(frozen=True)
class ServiceInfo:
    """Información completa de un servicio"""
    id: str
    name: str
    category_id: str
    category_name: str

@dataclass(frozen=True)
class AdvisorInfo:
    """Información completa de un asesor registrado"""
    id: str
    usuario_id: str
    name: str
    email: str
    activo: bool
    services: List[ServiceInfo | str]  
    categories: List[str] | None = None  
    created_at: str | None = None