import os, httpx
from typing import Optional, Dict, Any, List, Tuple
from app.use_cases.ports.telegram_port import TelegramPort

class TelegramBotGateway(TelegramPort):
    def __init__(self, bot_token: str | None = None, timeout: int = 5):  
        token = bot_token or os.environ["BOT_TOKEN"]
        self.base = f"https://api.telegram.org/bot{token}"
        self.timeout = timeout
        self._client = None

    async def _get_client(self):
        """Cliente HTTPx compartido y optimizado para velocidad"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout, connect=2.0),  # Reducir connect timeout a 2s
                http2=True,  # HTTP/2 para mejor rendimiento
                limits=httpx.Limits(max_connections=20, max_keepalive_connections=15),  # Más conexiones
                headers={"User-Agent": "TelegramBot/1.0"},
                # Configuraciones adicionales para velocidad
                transport=httpx.HTTPTransport(
                    retries=1,  # Solo 1 retry en lugar del default
                    verify=True  # Mantener SSL pero optimizado
                )
            )
        return self._client

    async def send_message(self, chat_id: int, text: str,
                           reply_markup: Optional[Dict[str, Any]] = None,
                           disable_web_page_preview: bool = False,
                           allow_sending_without_reply: bool = False):
        payload = {
            "chat_id": chat_id, 
            "text": text, 
            "parse_mode": "Markdown",
            "disable_web_page_preview": disable_web_page_preview,
            "allow_sending_without_reply": allow_sending_without_reply
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        client = await self._get_client()
        response = await client.post(f"{self.base}/sendMessage", json=payload)
        if response.status_code == 200:
            return response.json().get("result")  
        return None

    async def edit_message(self, chat_id: int, message_id: int, text: str,
                          reply_markup: Optional[Dict[str, Any]] = None,
                          disable_web_page_preview: bool = False):
        """Edita un mensaje existente (más rápido que enviar nuevo mensaje)"""
        payload = {
            "chat_id": chat_id, 
            "message_id": message_id, 
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": disable_web_page_preview
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            client = await self._get_client()
            response = await client.post(f"{self.base}/editMessageText", json=payload)
            return response.status_code == 200
        except Exception:
            return False

    def inline_kb(self, rows: List[Tuple[str, str]]) -> Dict[str, Any]:
        return {"inline_keyboard": [[{"text": t, "callback_data": d}] for t, d in rows]}

    async def close(self):
        """Cierra el cliente HTTP"""
        if self._client:
            await self._client.aclose()
            self._client = None
