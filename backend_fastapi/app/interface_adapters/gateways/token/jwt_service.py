import jwt
from app.use_cases.ports.token_port import JwtPort

class PyJWTService(JwtPort):
    def __init__(self, *, secret:str, issuer:str, minutes:int):
        self.secret = secret
        self.issuer = issuer
        self.minutes = minutes

    def issue(self, *, user_id:str, email:str, name:str, role_name:str) -> str:
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id, "email": email, "name": name, "role": role_name,
            "iss": self.issuer, "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=int(self.minutes))).timestamp()),
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")

    def decode(self, token:str) -> dict:
        return jwt.decode(token, self.secret, algorithms=["HS256"], options={"verify_aud": False})
