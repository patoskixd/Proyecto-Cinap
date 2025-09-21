# app/interface_adapters/controllers/telegram_webhook.py
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.frameworks_drivers.config.db import get_session as get_session_dep
from app.interface_adapters.gateways.telegram.telegram_bot_gateways import TelegramBotGateway
from app.interface_adapters.gateways.db.sqlalchemy_telegram_repo import SqlAlchemyTelegramRepo
from app.use_cases.telegram.link_account import LinkTelegramAccount

def make_telegram_router(*, cache=None, agent_getter=None, get_session_dep=get_session_dep):
    router = APIRouter(prefix="/telegram", tags=["telegram"])
    bot = TelegramBotGateway()

    def _chunk(s: str, n: int = 4000):
        for i in range(0, len(s), n):
            yield s[i:i+n]

    @router.post("/webhook")
    async def webhook(req: Request, session: AsyncSession = Depends(get_session_dep)):
        update = await req.json()
        msg = update.get("message")
        cbq = update.get("callback_query")

        if msg:
            text = (msg.get("text") or "").strip()
            chat_id = int(msg["chat"]["id"])
            from_id = int(msg["from"]["id"])

            from_obj = msg.get("from", {}) or {}
            first = from_obj.get("first_name") or ""
            last  = from_obj.get("last_name") or ""
            display_name = f"{first} {last}".strip() or None
            username = (
                from_obj.get("username")
                or msg.get("chat", {}).get("username")
                or display_name
            )

            repo = SqlAlchemyTelegramRepo(session, cache)

            if text.startswith("/start "):
                token = text.split(maxsplit=1)[1]
                ok = await LinkTelegramAccount(repo).execute(token, from_id, chat_id, username)
                await bot.send_message(
                    chat_id,
                    "✅ Cuenta vinculada. Ya puedes chatear conmigo aquí." if ok
                    else "❗ Token inválido o expirado. Genera uno nuevo desde tu perfil."
                )
                return {"ok": True}

            if text == "/start":
                await bot.send_message(chat_id, "Hola 👋 Si aún no te has vinculado, usa el botón “Vincular Telegram” en tu perfil.")
                return {"ok": True}

            if text.lower() in {"/reset", "reset"}:
                await bot.send_message(chat_id, "🔄 Conversación reiniciada. ¿En qué te ayudo?")
                return {"ok": True}

            agent = agent_getter() if callable(agent_getter) else agent_getter
            if not agent:
                await bot.send_message(chat_id, "⚠️ El asistente no está disponible en este momento.")
                return {"ok": True}

            thread_id = f"tg:{from_id}"
            try:
                reply = await agent.invoke(text, thread_id=thread_id)
                reply = reply or "(sin respuesta)"
            except Exception as e:
                reply = f"❗ Ocurrió un error consultando al asistente.\n{e}"

            for part in _chunk(reply):
                await bot.send_message(chat_id, part)
            return {"ok": True}

        if cbq:
            chat_id = cbq.get("message", {}).get("chat", {}).get("id")
            data = cbq.get("data")
            if chat_id:
                await bot.send_message(int(chat_id), f"Callback: {data}")
            return {"ok": True}

        return {"ok": True}

    return router
