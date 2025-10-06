from typing import Protocol, Optional, Dict, Any, List, Tuple

class TelegramPort(Protocol):
    async def send_message(self, chat_id: int, text: str, 
                          reply_markup: Optional[Dict[str, Any]] = None,
                          disable_web_page_preview: bool = False,
                          allow_sending_without_reply: bool = False) -> None: ...
    async def edit_message(self, chat_id: int, message_id: int, text: str,
                          reply_markup: Optional[Dict[str, Any]] = None,
                          disable_web_page_preview: bool = False) -> bool: ...
    def inline_kb(self, rows: List[Tuple[str, str]]) -> Dict[str, Any]: ...
