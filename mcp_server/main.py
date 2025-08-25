from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

from frameworks_and_drivers.server import build_mcp

mcp = build_mcp()