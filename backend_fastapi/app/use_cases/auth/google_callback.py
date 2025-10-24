from dataclasses import dataclass
from typing import Optional
from app.use_cases.ports.auth_repos import UserRepo
from app.use_cases.ports.asesor_repos import AsesorPerfilRepo
from app.use_cases.ports.oauth_port import GoogleOAuthPort
from app.use_cases.ports.token_port import JwtPort
from app.use_cases.ports.clock_port import ClockPort
from app.use_cases.auth.ensure_docente_profile import EnsureDocenteProfileUseCase
from app.interface_adapters.orm.models_auth import RolModel
from app.interface_adapters.gateways.db.sqlalchemy_asesor_repo import SqlAlchemyAsesorRepo
import sqlalchemy as sa
import logging

logger = logging.getLogger(__name__)
@dataclass
class GoogleCallbackResult:
    jwt: str
    max_age: int

class GoogleCallbackUseCase:
    def __init__(self, *, user_repo:UserRepo, oauth:GoogleOAuthPort,
                 jwt:JwtPort, clock:ClockPort, redirect_uri:str, jwt_minutes:int,
                 ensure_docente_profile_uc: EnsureDocenteProfileUseCase | None = None,
                 session = None,
                 auto_configure_webhook = None):  
        self.user_repo = user_repo
        self.oauth = oauth
        self.jwt = jwt
        self.clock = clock
        self.redirect_uri = redirect_uri
        self.jwt_minutes = jwt_minutes
        self.ensure_docente_profile_uc = ensure_docente_profile_uc
        self.session = session
        self.auto_configure_webhook = auto_configure_webhook

    async def execute(self, *, code:str) -> GoogleCallbackResult:
        tokens = await self.oauth.exchange_code(code, self.redirect_uri)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        info = await self.oauth.userinfo(access_token)
        sub = info.get("sub")
        email = info.get("email")
        name = info.get("name") or (email.split("@")[0] if email else "")

        user = await self.user_repo.upsert_user_with_identity(
            email=email, name=name, sub=sub, refresh_token=refresh_token
        )
        role_name = await self.user_repo.get_role_name(user.id) or "Profesor"

        # Verificar si tiene un perfil de asesor 
        is_existing_asesor = False
        if self.session:
            # Crear repositorio de asesor dinámicamente
            asesor_repo = await self._get_asesor_repo()
            if asesor_repo:
                # Verificar si el usuario tiene perfil de asesor
                asesor_perfil = await asesor_repo.find_by_usuario_id(user.id)
                if asesor_perfil:
                    is_existing_asesor = True
                    role_name = "Asesor"  # Forzar el rol a Asesor
                    
                    # Asegurar que el usuario tenga el rol correcto en la BD
                    await asesor_repo.ensure_user_is_asesor(user.id)

        # Solo crear perfil docente si NO es un asesor pre-registrado
        if self.ensure_docente_profile_uc and not is_existing_asesor and role_name == "Profesor":
            await self.ensure_docente_profile_uc.execute(user_id=user.id)

        # Auto-configurar webhook para asesores cuando inician sesión
        if is_existing_asesor and self.auto_configure_webhook:
            try:
                await self.auto_configure_webhook.ensure_webhook_configured(
                    user.id,
                    access_token,
                    role="asesor",
                )
                logger.info(f"Webhook auto-configurado para asesor {user.id}")
            except Exception as e:
                logger.warning(f"No se pudo auto-configurar webhook para asesor {user.id}: {e}")
                # No fallar el login por esto

        token = self.jwt.issue(user_id=user.id, email=user.email, name=user.name, role_name=role_name)
        max_age = 60 * int(self.jwt_minutes)
        return GoogleCallbackResult(jwt=token, max_age=max_age)

    async def _get_asesor_repo(self) -> Optional[AsesorPerfilRepo]:
        """Crea un repositorio de asesor dinámicamente si existe el rol"""
        if not self.session:
            return None
        
        try:
            # Buscar el rol de Asesor
            rol_result = await self.session.execute(
                sa.select(RolModel).where(RolModel.nombre == "Asesor")
            )
            asesor_role = rol_result.scalar_one_or_none()
            if asesor_role:
                return SqlAlchemyAsesorRepo(self.session, self.user_repo, asesor_role.id)
            return None
        except Exception:
            # Si hay algún error, simplemente retornar None
            return None
