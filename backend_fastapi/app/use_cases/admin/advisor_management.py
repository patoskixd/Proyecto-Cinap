from dataclasses import dataclass
from typing import List, Optional
from app.use_cases.ports.asesor_repos import AsesorPerfilRepo
from app.domain.auth.asesor_perfil import RegisterAdvisorRequest, AdvisorInfo

@dataclass
class RegisterAdvisorUseCase:
    """Use case para registrar un nuevo asesor desde el panel de administración"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self, request: RegisterAdvisorRequest) -> AdvisorInfo:
        return await self.asesor_repo.register_advisor(request)

@dataclass
class ListAdvisorsUseCase:
    """Use case para listar todos los asesores"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self) -> List[AdvisorInfo]:
        """Retorna la lista de todos los asesores registrados"""
        return await self.asesor_repo.list_advisors()

@dataclass
class GetAdvisorUseCase:
    """Use case para obtener un asesor específico"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self, advisor_id: str) -> Optional[AdvisorInfo]:
        """Retorna los datos de un asesor específico"""
        return await self.asesor_repo.get_advisor_by_id(advisor_id)

@dataclass
class UpdateAdvisorServicesUseCase:
    """Use case para actualizar los servicios de un asesor"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self, advisor_id: str, service_ids: List[str]) -> AdvisorInfo:
        """Actualiza los servicios asignados a un asesor"""
        return await self.asesor_repo.update_advisor_services(advisor_id, service_ids)

@dataclass
class UpdateAdvisorUseCase:
    """Use case para actualizar información básica y servicios de un asesor"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self, advisor_id: str, name: str = None, email: str = None, service_ids: List[str] = None, active: bool = None) -> AdvisorInfo:
        """Actualiza la información de un asesor"""
        return await self.asesor_repo.update_advisor(advisor_id, name, email, service_ids, active)

@dataclass
class DeleteAdvisorUseCase:
    """Use case para eliminar un asesor"""
    asesor_repo: AsesorPerfilRepo

    async def execute(self, advisor_id: str) -> None:
        """Elimina un asesor del sistema"""
        await self.asesor_repo.delete_advisor(advisor_id)