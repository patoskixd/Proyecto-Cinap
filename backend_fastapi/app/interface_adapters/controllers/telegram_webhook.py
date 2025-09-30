# app/interface_adapters/controllers/telegram_webhook.py
from __future__ import annotations
import os, time, logging
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.frameworks_drivers.config.db import get_session as get_session_dep
from app.interface_adapters.gateways.telegram.telegram_bot_gateways import TelegramBotGateway
from app.interface_adapters.gateways.db.sqlalchemy_telegram_repo import SqlAlchemyTelegramRepo
from app.use_cases.telegram.link_account import LinkTelegramAccount
from app.frameworks_drivers.config.settings import (
    ASR_BASE_URL, ASR_MODEL_NAME, ASR_API_KEY, ASR_LANG,
)


from app.observability.metrics import astage, set_meta

log = logging.getLogger("telegram")
BOT_TOKEN = os.environ["BOT_TOKEN"]  


def make_telegram_router(*, cache=None, agent_getter=None, get_session_dep=get_session_dep):
    """
    - /start <token>  -> vincula Telegram con el usuario (token generado en POST /telegram/link)
    - Texto           -> se envía al agente (thread_id=f"tg:{from_id}")
    - Voz/Audio       -> descarga, transcribe (ASR :8001) y envía transcripción al agente
    Medimos: telegram.total, telegram.asr, telegram.agent, telegram.tg_send
    """
    router = APIRouter(prefix="/telegram", tags=["telegram"])
    bot = TelegramBotGateway()

    def _chunk(s: str, n: int = 4000):
        for i in range(0, len(s), n):
            yield s[i:i+n]

    async def tg_get_file_path(file_id: str) -> str | None:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(url, params={"file_id": file_id})
            if r.status_code != 200:
                return None
            j = r.json()
            return j.get("result", {}).get("file_path")

    async def tg_download_file(file_path: str) -> bytes | None:
        url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        async with httpx.AsyncClient(timeout=180) as c:
            r = await c.get(url)
            if r.status_code != 200:
                return None
            return r.content

    async def asr_transcribe(audio_bytes: bytes, filename: str = "audio.ogg") -> str | None:
        transcribe_url = f"{ASR_BASE_URL.rstrip('/')}/v1/audio/transcriptions"
        headers = {}
        if ASR_API_KEY and ASR_API_KEY.strip().upper() != "EMPTY":
            headers["Authorization"] = f"Bearer {ASR_API_KEY}"

        files = {"file": (filename, audio_bytes, "application/octet-stream")}
        data  = {"model": ASR_MODEL_NAME, "language": ASR_LANG}

        # medimos solo la llamada al ASR
        async with astage("telegram.asr"):
            async with httpx.AsyncClient(timeout=180) as c:
                r = await c.post(transcribe_url, headers=headers, data=data, files=files)

        if r.status_code != 200:
            log.warning("ASR %s: %s", r.status_code, r.text[:300])
            return None
        try:
            j = r.json()
        except Exception:
            return None
        return j.get("text") or j.get("transcript") or j.get("result")

    @router.post("/webhook")
    async def webhook(req: Request, session: AsyncSession = Depends(get_session_dep)):
        # Etapa envolvente para sumar todo lo del webhook 
        async with astage("telegram.total"):
            update = await req.json()

            # metadata útil en el registro
            msg = update.get("message")
            cbq = update.get("callback_query")
            set_meta(source="telegram", update_id=update.get("update_id"))

            if msg:
                text     = (msg.get("text") or "").strip()
                chat_id  = int(msg["chat"]["id"])
                from_id  = int(msg["from"]["id"])
                
                # Extraer información del usuario con fallbacks
                user_data = msg["from"]
                username = user_data.get("username")  # Puede ser None si no tiene username
                first_name = user_data.get("first_name", "")
                last_name = user_data.get("last_name", "")
                
                # Si no tiene username, crear un fallback con el nombre
                display_name = username
                if not username and (first_name or last_name):
                    display_name = f"{first_name} {last_name}".strip()
                
                # Debug: imprimir toda la estructura del usuario
                log.info(f"Datos del usuario de Telegram: {user_data}")
                log.info(f"Username: {username}, Nombre: {first_name} {last_name}, Display: {display_name}")

                # más metadata para el log
                set_meta(chat_id=chat_id, telegram_user_id=from_id, telegram_username=display_name)

                repo = SqlAlchemyTelegramRepo(session, cache)

                # 1) Vinculación
                if text.startswith("/start "):
                    token = text.split(maxsplit=1)[1]
                    log.info(f"Iniciando vinculación - Token: {token}, User ID: {from_id}, Display name: {display_name}")
                    ok = await LinkTelegramAccount(repo).execute(token, from_id, chat_id, display_name)
                    log.info(f"Resultado de vinculación: {ok}")
                    # medimos el envío al usuario
                    async with astage("telegram.tg_send"):
                        await bot.send_message(
                            chat_id,
                            "✅ Cuenta vinculada. Ya puedes chatear conmigo aquí." if ok
                            else "❗ Token inválido o expirado. Genera uno nuevo desde tu perfil."
                        )
                    return {"ok": True}

                if text == "/start":
                    async with astage("telegram.tg_send"):
                        await bot.send_message(chat_id, "Hola 👋 Si aún no te has vinculado, usa el botón “Vincular Telegram” en tu perfil.")
                    return {"ok": True}

                if text.lower() in {"/reset", "reset"}:
                    async with astage("telegram.tg_send"):
                        await bot.send_message(chat_id, "🔄 Conversación reiniciada. ¿En qué te ayudo?")
                    return {"ok": True}

                # 2) Voz/Audio
                voice = msg.get("voice")
                audio = msg.get("audio")
                document = msg.get("document")
                if voice or audio or (document and str(document.get("mime_type", "")).startswith("audio/")):
                    file_id = (voice or audio or document).get("file_id")

                    file_path = await tg_get_file_path(file_id)
                    if not file_path:
                        async with astage("telegram.tg_send"):
                            await bot.send_message(chat_id, "No pude obtener el archivo de voz 😕")
                        return {"ok": True}

                    audio_bytes = await tg_download_file(file_path)
                    if not audio_bytes:
                        async with astage("telegram.tg_send"):
                            await bot.send_message(chat_id, "No pude descargar el audio 😕")
                        return {"ok": True}

                    transcript = await asr_transcribe(audio_bytes, filename=os.path.basename(file_path))
                    if not transcript:
                        async with astage("telegram.tg_send"):
                            await bot.send_message(chat_id, "No pude transcribir el audio 😕")
                        return {"ok": True}

                    agent = agent_getter() if callable(agent_getter) else agent_getter
                    if not agent:
                        async with astage("telegram.tg_send"):
                            await bot.send_message(chat_id, f"🗣️ {transcript}\n\n⚠️ El asistente no está disponible ahora.")
                        return {"ok": True}

                    # invocación del agente
                    async with astage("telegram.agent"):
                        reply = await agent.invoke(transcript, thread_id=f"tg:{from_id}")
                        reply = reply or "(sin respuesta)"

                    # feedback al usuario (transcripción + respuesta)
                    async with astage("telegram.tg_send"):
                        await bot.send_message(chat_id, f"🗣️ {transcript}")
                    for part in _chunk(reply):
                        async with astage("telegram.tg_send"):
                            await bot.send_message(chat_id, part)
                    return {"ok": True}

                # 3) Texto normal -> agente
                agent = agent_getter() if callable(agent_getter) else agent_getter
                if not agent:
                    async with astage("telegram.tg_send"):
                        await bot.send_message(chat_id, "⚠️ El asistente no está disponible en este momento.")
                    return {"ok": True}

                async with astage("telegram.agent"):
                    reply = await agent.invoke(text, thread_id=f"tg:{from_id}")
                    reply = reply or "(sin respuesta)"

                for part in _chunk(reply):
                    async with astage("telegram.tg_send"):
                        await bot.send_message(chat_id, part)
                return {"ok": True}

            # 4) Callback Query
            if cbq:
                chat_id = cbq.get("message", {}).get("chat", {}).get("id")
                data = cbq.get("data")
                if chat_id:
                    async with astage("telegram.tg_send"):
                        await bot.send_message(int(chat_id), f"Callback: {data}")
                return {"ok": True}

            return {"ok": True}

    return router
