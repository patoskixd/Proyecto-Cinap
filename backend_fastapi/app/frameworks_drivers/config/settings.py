import os
from dotenv import load_dotenv

load_dotenv()

def _get(name: str, default: str | None = None) -> str:
    v = os.getenv(name)
    return v if v is not None else (default if default is not None else "")

def _get_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "y", "on"}

def _get_int(name: str, default: int) -> int:
    v = os.getenv(name)
    try:
        return int(v) if v is not None else default
    except ValueError:
        return default

def _get_float(name: str, default: float) -> float:
    v = os.getenv(name)
    try:
        return float(v) if v is not None else default
    except ValueError:
        return default

# ==== LLM / MCP (tus existentes) ====
OLLAMA_URL   = _get("OLLAMA_URL", "http://localhost:11434")
MODEL        = _get("MODEL", "llama3")
LLM_TIMEOUT  = _get_float("LLM_TIMEOUT", 60.0)

MCP_COMMAND  = _get("MCP_COMMAND", "node")
MCP_ARGS     = _get("MCP_ARGS", "index.js")
MCP_CWD      = _get("MCP_CWD", ".")

API_DEBUG    = _get_bool("API_DEBUG", True)

# Lista separada por comas; se limpia espacios y vacíos
CORS_ORIGINS = [o.strip() for o in _get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

# ==== Google OAuth (authorization code flow) ====
GOOGLE_CLIENT_ID     = _get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = _get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = _get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

# ==== JWT propio ====
JWT_SECRET  = _get("JWT_SECRET", "change_me")
JWT_ISSUER  = _get("JWT_ISSUER", "cinap.api")
JWT_MINUTES = _get_int("JWT_MINUTES", 60 * 24)
API_DEBUG   = True

# ==== Base de datos (para cuando conectes) ====
DB_HOST = _get("DB_HOST", "localhost")
DB_PORT = _get_int("DB_PORT", 5432)
DB_NAME = _get("DB_NAME", "cinap")
DB_USER = _get("DB_USER", "postgres")
DB_PASSWORD = _get("DB_PASSWORD", "1234")

def DATABASE_URL() -> str:
    return f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ==== Frontend origin ====
FRONTEND_ORIGIN = _get("FRONTEND_ORIGIN", "http://localhost:3000")

TEACHER_ROLE_ID = _get("TEACHER_ROLE_ID", "00000000-0000-0000-0000-000000000001")