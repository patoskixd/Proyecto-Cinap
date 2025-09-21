import os, httpx
from typing import Optional, Dict, Any, List, Tuple
from app.use_cases.ports.telegram_port import TelegramPort

class TelegramBotGateway(TelegramPort):
    def __init__(self, bot_token: str | None = None, timeout: int = 15):
        token = bot_token or os.environ["BOT_TOKEN"]
        self.base = f"https://api.telegram.org/bot{token}"
        self.timeout = timeout

    async def send_message(self, chat_id: int, text: str,
                           reply_markup: Optional[Dict[str, Any]] = None):
        payload = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            await c.post(f"{self.base}/sendMessage", json=payload)

    def inline_kb(self, rows: List[Tuple[str, str]]) -> Dict[str, Any]:
        return {"inline_keyboard": [[{"text": t, "callback_data": d}] for t, d in rows]}
