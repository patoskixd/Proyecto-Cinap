import httpx
from urllib.parse import urlencode
from app.use_cases.ports.oauth_port import GoogleOAuthPort

class GoogleOAuthClient(GoogleOAuthPort):
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

    def __init__(self, *, client_id:str, client_secret:str, scope:str, timeout:int=20):
        self.client_id = client_id
        self.client_secret = client_secret
        self.scope = scope
        self.timeout = timeout

    def build_authorize_url(self, *, redirect_uri:str, state:str, access_type:str="offline", prompt:str="consent") -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": self.scope,
            "state": state,
            "access_type": access_type,
            "prompt": prompt,
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code:str, redirect_uri:str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(self.TOKEN_URL, data={
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            })
            r.raise_for_status()
            return r.json()

    async def userinfo(self, access_token:str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(self.USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
            r.raise_for_status()
            return r.json()
