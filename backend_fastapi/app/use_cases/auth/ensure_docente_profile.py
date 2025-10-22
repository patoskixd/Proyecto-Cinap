from dataclasses import dataclass
from typing import Optional
from app.use_cases.ports.docente_repos import DocentePerfilRepo
from app.use_cases.ports.auth_repos import UserRepo
from app.domain.auth.docente_perfil import DocentePerfil

@dataclass
class EnsureDocenteProfileUseCase:
    docente_repo: DocentePerfilRepo
    user_repo: UserRepo
    profesor_role_name: str = "Profesor"

    async def execute(self, *, user_id: str) -> Optional[DocentePerfil]:

        # Verificar el rol del usuario
        role_name = await self.user_repo.get_role_name(user_id)
        
        if role_name != self.profesor_role_name:
            # No es profesor, no necesita perfil docente
            return None
        
        # Es profesor, asegurar que tenga perfil docente
        return await self.docente_repo.ensure_perfil_exists(user_id)