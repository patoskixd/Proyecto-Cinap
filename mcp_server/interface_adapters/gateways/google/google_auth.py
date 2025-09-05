import os
from pathlib import Path
from typing import Optional, Sequence

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv()

SCOPES: list[str] = [
    "https://www.googleapis.com/auth/calendar.events",
]

DEFAULT_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
DEFAULT_TOKEN_FILE = os.getenv("GOOGLE_TOKEN_FILE", "token.json")
DEFAULT_TZ = os.getenv("DEFAULT_TZ", "America/Santiago")

def _resolve(path_str: str) -> Path:
    p = Path(path_str)
    if not p.is_absolute():
        p = Path.cwd() / p
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

def _credentials_file_exists(credentials_path: Path) -> None:
    if not credentials_path.exists():
        raise FileNotFoundError(
            f"No se encontrÃ³ el archivo de credenciales OAuth en: {credentials_path}\n"
        )

def _scopes_changed(existing: Credentials, desired_scopes: Sequence[str]) -> bool:
    try:
        current = set(existing.scopes or [])
    except Exception:
        current = set()
    return not set(desired_scopes).issubset(current)

def get_credentials(
    *,
    credentials_file: str = DEFAULT_CREDENTIALS_FILE,
    token_file: str = DEFAULT_TOKEN_FILE,
    scopes: Sequence[str] = SCOPES,
    headless: bool = False,
) -> Credentials:
    cred_path = _resolve(credentials_file)
    token_path = _resolve(token_file)
    _credentials_file_exists(cred_path)

    creds: Optional[Credentials] = None

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), list(scopes))

        if _scopes_changed(creds, scopes):
            try:
                token_path.unlink(missing_ok=True)
            except Exception:
                pass
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None

        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(cred_path), scopes=list(scopes)
            )
            if headless:
                creds = flow.run_local_server(
                    port=0,
                    open_browser=(not headless),
                    prompt='consent',
                    access_type='offline'
                )
            else:
                creds = flow.run_local_server(port=0)

        token_path.write_text(creds.to_json(), encoding="utf-8")

    return creds

def get_calendar_service(
    *,
    credentials_file: str = DEFAULT_CREDENTIALS_FILE,
    token_file: str = DEFAULT_TOKEN_FILE,
    scopes: Sequence[str] = SCOPES,
    headless: bool = False,
):
    creds = get_credentials(
        credentials_file=credentials_file,
        token_file=token_file,
        scopes=scopes,
        headless=headless,
    )
    return build("calendar", "v3", credentials=creds)