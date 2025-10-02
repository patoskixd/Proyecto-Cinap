from dataclasses import dataclass
from app.use_cases.ports.auth_repos import UserRepo
from app.use_cases.ports.oauth_port import GoogleOAuthPort
from app.use_cases.ports.token_port import JwtPort
from app.use_cases.ports.clock_port import ClockPort

@dataclass
class GoogleCallbackResult:
    jwt: str
    max_age: int

class GoogleCallbackUseCase:
    def __init__(self, *, user_repo:UserRepo, oauth:GoogleOAuthPort,
                 jwt:JwtPort, clock:ClockPort, redirect_uri:str, jwt_minutes:int):
        self.user_repo = user_repo
        self.oauth = oauth
        self.jwt = jwt
        self.clock = clock
        self.redirect_uri = redirect_uri
        self.jwt_minutes = jwt_minutes

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
        role_name = await self.user_repo.get_role_name(user.id) or "Docente"

        token = self.jwt.issue(user_id=user.id, email=user.email, name=user.name, role_name=role_name)
        max_age = 60 * int(self.jwt_minutes)
        return GoogleCallbackResult(jwt=token, max_age=max_age)
