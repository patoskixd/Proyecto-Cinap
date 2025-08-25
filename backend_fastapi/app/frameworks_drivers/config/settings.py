import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL = os.getenv("MODEL")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT"))

MCP_COMMAND = os.getenv("MCP_COMMAND")
MCP_ARGS = os.getenv("MCP_ARGS")
MCP_CWD = os.getenv("MCP_CWD")

API_DEBUG = os.getenv("API_DEBUG").lower() in {"1", "true", "yes"}
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS").split(",")]