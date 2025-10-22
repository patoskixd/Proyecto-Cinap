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

MCP_COMMAND  = _get("MCP_COMMAND", "node")
MCP_ARGS     = _get("MCP_ARGS", "index.js")
MCP_CWD      = _get("MCP_CWD", ".")

MCP_CAL_COMMAND  = _get("MCP_CAL_COMMAND", "node")
MCP_CAL_ARGS     = _get("MCP_CAL_ARGS", "index.js")
MCP_CAL_CWD      = _get("MCP_CAL_CWD", ".")

API_DEBUG    = _get_bool("API_DEBUG", True)

CORS_ORIGINS = [o.strip() for o in _get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

GOOGLE_CLIENT_ID     = _get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = _get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = _get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

JWT_SECRET  = _get("JWT_SECRET", "change_me")
JWT_ISSUER  = _get("JWT_ISSUER", "cinap.api")
JWT_MINUTES = _get_int("JWT_MINUTES", 60 * 24)
API_DEBUG   = True

DB_HOST = _get("DB_HOST", "localhost")
DB_PORT = _get_int("DB_PORT", 5432)
DB_NAME = _get("DB_NAME", "cinap")
DB_USER = _get("DB_USER", "postgres")
DB_PASSWORD = _get("DB_PASSWORD", "1234")

def DATABASE_URL() -> str:
    return f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

FRONTEND_ORIGIN = _get("FRONTEND_ORIGIN", "http://localhost:3000")

TEACHER_ROLE_ID = _get("TEACHER_ROLE_ID", "00000000-0000-0000-0000-000000000001")

USE_OLLAMA = os.getenv("USE_OLLAMA", "0") in ("1", "true", "True")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
OLLAMA_TEMP = float(os.getenv("OLLAMA_TEMP"))
OLLAMA_TOP_P = float(os.getenv("OLLAMA_TOP_P"))

VLLM_BASE_URL = _get("VLLM_BASE_URL")
VLLM_API_KEY  = _get("VLLM_API_KEY", "dummy")
LLM_MODEL     = _get("LLM_MODEL", "Qwen/Qwen3-4B")
LLM_TEMP      = _get_float("LLM_TEMP", 0.2)
LLM_TOP_P     = _get_float("LLM_TOP_P", 0.95)

REDIS_URL = _get("REDIS_URL", "redis://localhost:6379/0")

# Webhook Configuration
WEBHOOK_PUBLIC_URL = _get("WEBHOOK_PUBLIC_URL", "https://459db2f8a763.ngrok-free.app/")

TELEGRAM_BOT_TOKEN = _get("BOT_TOKEN")  
TELEGRAM_BOT_USERNAME = _get("TELEGRAM_BOT_USERNAME")
ASR_BASE_URL   = _get("ASR_BASE_URL", "http://localhost:8001")
ASR_MODEL_NAME = _get("ASR_MODEL_NAME", "clu-ling/whisper-large-v2-spanish")
ASR_API_KEY    = _get("ASR_API_KEY", "EMPTY")
ASR_LANG       = _get("ASR_LANG", "es")