import httpx, os

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

class GoogleOAuthAdapter:
    def __init__(self, *, client_id: str | None = None, client_secret: str | None = None, timeout: int = 20):
        self.client_id = client_id or os.getenv("GOOGLE_CLIENT_ID", "")
        self.client_secret = client_secret or os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.timeout = timeout

    def exchange_refresh(self, refresh_token: str) -> str:
        if not self.client_id or not self.client_secret:
            raise RuntimeError("Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET")
        with httpx.Client(timeout=self.timeout) as client:
            r = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            r.raise_for_status()
            return r.json()["access_token"]