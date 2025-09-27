# app/interface_adapters/controllers/telegram_webhook.py
from __future__ import annotations

import os
import httpx
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.frameworks_drivers.config.db import get_session as get_session_dep
from app.interface_adapters.gateways.telegram.telegram_bot_gateways import TelegramBotGateway
from app.interface_adapters.gateways.db.sqlalchemy_telegram_repo import SqlAlchemyTelegramRepo
from app.use_cases.telegram.link_account import LinkTelegramAccount

# ASR (vLLM OpenAI-compatible) desde settings/.env
from app.frameworks_drivers.config.settings import (
    ASR_BASE_URL,       # ej: http://localhost:8001
    ASR_MODEL_NAME,     # ej: clu-ling/whisper-large-v2-spanish
    ASR_API_KEY,        # "EMPTY" si no usas clave
    ASR_LANG,           # "es"
)

BOT_TOKEN = os.environ["BOT_TOKEN"]  # ya lo tienes en tu .env


def make_telegram_router(*, cache=None, agent_getter=None, get_session_dep=get_session_dep):
    """
    - /start <token>  -> vincula Telegram con el usuario app (token de POST /telegram/link)
    - Texto           -> se envía al agente (MCP) en thread_id=f"tg:{from_id}"
    - Voz/Audio       -> se descarga, se transcribe (ASR :8001) y la transcripción se envía al agente
    """
    router = APIRouter(prefix="/telegram", tags=["telegram"])
    bot = TelegramBotGateway()

    # ----------------------------- utils ----------------------------------
    def _chunk(s: str, n: int = 4000):
        # Telegram admite ~4096 chars; dejamos margen
        for i in range(0, len(s), n):
            yield s[i:i + n]

    async def tg_get_file_path(file_id: str) -> str | None:
        # https://api.telegram.org/bot<token>/getFile?file_id=...
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(url, params={"file_id": file_id})
            if r.status_code != 200:
                return None
            j = r.json()
            return j.get("result", {}).get("file_path")

    async def tg_download_file(file_path: str) -> bytes | None:
        # https://api.telegram.org/file/bot<token>/<file_path>
        url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        async with httpx.AsyncClient(timeout=180) as c:
            r = await c.get(url)
            if r.status_code != 200:
                return None
            return r.content

    async def asr_transcribe(audio_bytes: bytes, filename: str = "audio.ogg") -> str | None:
        """
        Envía el audio al endpoint OpenAI-compatible /v1/audio/transcriptions del ASR.
        Devuelve el texto o None si falla.
        """
        transcribe_url = f"{ASR_BASE_URL.rstrip('/')}/v1/audio/transcriptions"
        headers = {}
        if ASR_API_KEY and ASR_API_KEY.strip().upper() != "EMPTY":
            headers["Authorization"] = f"Bearer {ASR_API_KEY}"

        files = {
            "file": (filename, audio_bytes, "application/octet-stream"),
        }
        data = {
            "model": ASR_MODEL_NAME,
            "language": ASR_LANG,
            # "temperature": "0.0",
        }

        async with httpx.AsyncClient(timeout=180) as c:
            r = await c.post(transcribe_url, headers=headers, data=data, files=files)

        if r.status_code != 200:
            # Puedes loguear r.text si necesitas depurar
            return None

        try:
            j = r.json()
        except Exception:
            return None

        # OpenAI-compatible suele devolver {"text": "..."}
        return j.get("text") or j.get("transcript") or j.get("result")

    # ----------------------------- webhook --------------------------------
    @router.post("/webhook")
    async def webhook(req: Request, session: AsyncSession = Depends(get_session_dep)):
        update = await req.json()
        msg = update.get("message")
        cbq = update.get("callback_query")

        # ---------------------------- MESSAGE ------------------------------
        if msg:
            text = (msg.get("text") or "").strip()
            chat_id = int(msg["chat"]["id"])
            from_id = int(msg["from"]["id"])
            username = msg["from"].get("username")  # guardamos si viene

            repo = SqlAlchemyTelegramRepo(session, cache)

            # 1) Vinculación /start <token>
            if text.startswith("/start "):
                token = text.split(maxsplit=1)[1]
                ok = await LinkTelegramAccount(repo).execute(token, from_id, chat_id, username)
                await bot.send_message(
                    chat_id,
                    "✅ Cuenta vinculada. Ya puedes chatear conmigo aquí."
                    if ok else
                    "❗ Token inválido o expirado. Genera uno nuevo desde tu perfil."
                )
                return {"ok": True}

            if text == "/start":
                await bot.send_message(
                    chat_id,
                    "Hola 👋 Si aún no te has vinculado, usa el botón “Vincular Telegram” en tu perfil de la web."
                )
                return {"ok": True}

            if text.lower() in {"/reset", "reset"}:
                await bot.send_message(chat_id, "🔄 Conversación reiniciada. ¿En qué te ayudo?")
                return {"ok": True}

            # 2) Voz/Audio -> transcribir -> enviar transcripción al agente
            voice = msg.get("voice")
            audio = msg.get("audio")
            document = msg.get("document")  # por si envían un audio adjunto como documento

            if voice or audio or (document and str(document.get("mime_type", "")).startswith("audio/")):
                file_id = (voice or audio or document).get("file_id")

                file_path = await tg_get_file_path(file_id)
                if not file_path:
                    await bot.send_message(chat_id, "No pude obtener el archivo de voz 😕")
                    return {"ok": True}

                audio_bytes = await tg_download_file(file_path)
                if not audio_bytes:
                    await bot.send_message(chat_id, "No pude descargar el audio 😕")
                    return {"ok": True}

                transcript = await asr_transcribe(audio_bytes, filename=os.path.basename(file_path))
                if not transcript:
                    await bot.send_message(chat_id, "No pude transcribir el audio 😕")
                    return {"ok": True}

                # Enviar la transcripción al agente
                agent = agent_getter() if callable(agent_getter) else agent_getter
                if not agent:
                    await bot.send_message(chat_id, f"🗣️ {transcript}\n\n⚠️ El asistente no está disponible ahora.")
                    return {"ok": True}

                thread_id = f"tg:{from_id}"
                try:
                    # >>> IMPORTANTÍSIMO: invocamos con la TRANSCRIPCIÓN
                    reply = await agent.invoke(transcript, thread_id=thread_id)
                    reply = reply or "(sin respuesta)"
                except Exception as e:
                    msg_err = str(e)
                    if "maximum context length" in msg_err or "context length" in msg_err:
                        # contexto muy largo -> hilo fresco y reintento
                        fresh_thread_id = f"tg:{from_id}:{int(__import__('time').time())}"
                        try:
                            reply = await agent.invoke(transcript, thread_id=fresh_thread_id)
                            reply = ("(iniciamos una nueva conversación porque la anterior era muy larga)\n\n"
                                     + (reply or "(sin respuesta)"))
                        except Exception as e2:
                            reply = f"❗ No pude responder (el contexto era muy largo y el reintento falló).\n{e2}"
                    else:
                        reply = f"❗ Ocurrió un error consultando al asistente.\n{e}"

                # primero mostramos la transcripción (opcional)
                await bot.send_message(chat_id, f"🗣️ {transcript}")
                # luego la respuesta del agente (en trozos si hace falta)
                for part in _chunk(reply):
                    await bot.send_message(chat_id, part)
                return {"ok": True}

            # 3) Texto normal -> agente
            agent = agent_getter() if callable(agent_getter) else agent_getter
            if not agent:
                await bot.send_message(chat_id, "⚠️ El asistente no está disponible en este momento.")
                return {"ok": True}

            thread_id = f"tg:{from_id}"
            try:
                reply = await agent.invoke(text, thread_id=thread_id)
                reply = reply or "(sin respuesta)"
            except Exception as e:
                msg_err = str(e)
                if "maximum context length" in msg_err or "context length" in msg_err:
                    fresh_thread_id = f"tg:{from_id}:{int(__import__('time').time())}"
                    try:
                        reply = await agent.invoke(text, thread_id=fresh_thread_id)
                        reply = ("(iniciamos una nueva conversación porque la anterior era muy larga)\n\n"
                                 + (reply or "(sin respuesta)"))
                    except Exception as e2:
                        reply = f"❗ No pude responder (el contexto era muy largo y el reintento falló).\n{e2}"
                else:
                    reply = f"❗ Ocurrió un error consultando al asistente.\n{e}"

            for part in _chunk(reply):
                await bot.send_message(chat_id, part)
            return {"ok": True}

        # ------------------------- CALLBACK QUERY ---------------------------
        if cbq:
            chat_id = cbq.get("message", {}).get("chat", {}).get("id")
            data = cbq.get("data")
            if chat_id:
                await bot.send_message(int(chat_id), f"Callback: {data}")
            return {"ok": True}

        return {"ok": True}

    return router
