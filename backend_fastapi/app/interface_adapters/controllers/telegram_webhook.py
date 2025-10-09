from __future__ import annotations
# =========================
#  Imports
# =========================
import json, os, time, logging, asyncio, hashlib, re, subprocess, shlex, tempfile, shutil
try:
    import dateparser
except Exception:
    dateparser = None

from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

try:
    import audioop
except ImportError:
    audioop = None

try:
    import ffmpeg
except ImportError:
    ffmpeg = None

from app.frameworks_drivers.config.db import get_session as get_session_dep
from app.interface_adapters.gateways.db.sqlalchemy_telegram_repo import SqlAlchemyTelegramRepo
from app.observability.metrics import (
    astage, set_meta, new_request, finalize_and_log, setup_json_logger, _get_trace
)
from app.use_cases.telegram.link_account import LinkTelegramAccount
from app.frameworks_drivers.config.settings import (
    ASR_BASE_URL, ASR_MODEL_NAME, ASR_API_KEY, ASR_LANG,
)


# =========================
#  Logging & Globals
# =========================
log = logging.getLogger("telegram")
log.setLevel(logging.DEBUG)

BOT_TOKEN = os.environ["BOT_TOKEN"]
_BGLOGGER = setup_json_logger("telegram_bg", log_file="logs/telegram_bg.jsonl")

_telegram_client = None
_asr_client = None

# =========================
#  Performance Tweaks
# =========================
ENABLE_PAUSES = False
ASR_TIMEOUT = 30                 # objetivo agresivo
WAV_AR = 16000                   # 16kHz mono PCM

TELEGRAM_TIMEOUT_AGGRESSIVE = 4.0
TELEGRAM_DOWNLOAD_TIMEOUT = 2.0
ASR_CONNECT_TIMEOUT = 1.0
MCP_TIMEOUT_AGGRESSIVE = 1.5
PENDING_ACTION_TTL = 20  # 10 minutos para confirmar/cancelar


# =========================
#  Dominio (CINAP/UCT): Reglas
#  (relajado: no se bloquea nada si STRICT_DOMAIN_ENFORCEMENT=False)
# =========================
STRICT_DOMAIN_MESSAGE = "Lo siento, solo puedo ayudarte con temas del sistema de asesorías y agendamiento del CINAP."
STRICT_DOMAIN_ENFORCEMENT = False  # <<--- Cambia a True si quieres volver a aplicar el guard estricto

DOMAIN_KEYWORDS = {
    "cinap", "uct",
    "asesoría", "asesoria", "tutoría", "tutoria",
    "calendario", "calendar", "agenda", "agendar", "cita", "reunión", "reunion",
    "profesor", "docente", "advisor", "teacher",
    "curso", "clase", "materia", "asignatura", "disponibilidad", "horario"
}
ACK_KEYWORDS = {
    "hola", "hi", "hello", "buenas", "buenos días", "buenas tardes", "buenas noches",
    "gracias", "thanks", "thank you",
    "ok", "vale", "perfecto", "listo", "entiendo", "sí", "si"
}
# =========================
#  Confirm/Cancel helpers (texto)
# =========================
CONFIRM_WORDS = {"confirmar","confirmo","confirm","sí","si","ok","vale","listo","de acuerdo"}
CANCEL_WORDS  = {"cancelar","cancela","anular","rechazar","descartar","no"}

def _is_confirmation_text(t: str) -> bool:
    if not t: return False
    tl = (t or "").lower().strip()
    return tl in CONFIRM_WORDS

def _is_cancellation_text(t: str) -> bool:
    if not t: return False
    tl = (t or "").lower().strip()
    return tl in CANCEL_WORDS


def _is_ack(s: str) -> bool:
    if not s:
        return False
    t = (s or "").lower()
    return any(k in t for k in ACK_KEYWORDS) and len(t.split()) <= 6

def _is_domain_related(s: str) -> bool:
    if not s or not isinstance(s, str):
        return False
    t = (s or "").lower()
    return any(k in t for k in DOMAIN_KEYWORDS)

def _enforce_domain_reply(user_text: str, reply_text: str) -> str:
    """
    RELAJADO:
    - Si STRICT_DOMAIN_ENFORCEMENT es False, NO se aplica ninguna restricción.
    - Si es True, se aplican las reglas originales.
    """
    if not STRICT_DOMAIN_ENFORCEMENT:
        return reply_text

    # ---- Modo estricto (opcional) ----
    if not _is_domain_related(user_text):
        return STRICT_DOMAIN_MESSAGE
    if _is_ack(reply_text):
        return reply_text
    if not _is_domain_related(reply_text):
        return STRICT_DOMAIN_MESSAGE
    return reply_text

# =========================
#  ASR Keywords & Regex
# =========================
CALENDAR_KEYWORDS = [
    "asesoría", "asesoria", "agendar", "cita", "reunión", "appointment",
    "calendario", "calendar", "meeting", "schedule", "programar"
]
ACADEMIC_KEYWORDS = [
    "UCT", "CINAP", "universidad", "profesor", "teacher", "advisor",
    "estudiante", "student", "clase", "course", "materia", "subject"
]
ALL_KEYWORDS = CALENDAR_KEYWORDS + ACADEMIC_KEYWORDS

GLOSARIO_REGEX = [
    (
        re.compile(
            r"\b(u\.?\s*c\.?\s*t\.?|u\s*ce\s*te|ucte|ucete|u\s*c\s*t|aus-?t|universidad\s+católica(?:\s+de\s+temuco)?)\b",
            re.IGNORECASE,
        ),
        "UCT",
    ),
    (
        re.compile(
            r"\b(cina?p|cina|ci\s*nap|si\s*nap|c\s*i\s*nap|"
            r"ch[ií]n\s*up|chi\s*nap|che\s*nap|chinap|sino pop|chin up|"
            r"centro\s+de\s+innovaci[óo]n(?:\s+en\s+aprendizaje)?(?:\s+docencia)?(?:\s+y\s+tecnolog[íi]a\s+educativa)?)\b",
            re.IGNORECASE
        ),
        "CINAP",
    ),
]

# =========================
#  HTTP Clients
# =========================
async def _get_telegram_client():
    global _telegram_client
    if _telegram_client is None:
        _telegram_client = httpx.AsyncClient(
            timeout=httpx.Timeout(TELEGRAM_TIMEOUT_AGGRESSIVE, connect=1.0),
            http2=True,
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            headers={"User-Agent": "TelegramBot/1.0", "Connection": "keep-alive"}
        )
    return _telegram_client

async def _get_asr_client():
    global _asr_client
    if _asr_client is None or _asr_client.is_closed:
        headers = {}
        if ASR_API_KEY and ASR_API_KEY.strip().upper() != "EMPTY":
            headers["Authorization"] = f"Bearer {ASR_API_KEY}"
        _asr_client = httpx.AsyncClient(
            timeout=httpx.Timeout(ASR_TIMEOUT + 2, connect=ASR_CONNECT_TIMEOUT),
            http2=False,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            headers={**headers, "Connection": "keep-alive"},
            trust_env=True
        )
    return _asr_client

async def _warmup_connections():
    try:
        async with astage("telegram.warmup"):
            tg_client = await _get_telegram_client()
            warmup_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
            resp = await tg_client.get(warmup_url)
            if resp.status_code == 200:
                log.info("Telegram API warm-up exitoso")

            if ASR_BASE_URL:
                asr_client = await _get_asr_client()
                try:
                    asr_resp = await asr_client.get(f"{ASR_BASE_URL.rstrip('/')}/v1/models")
                    if asr_resp.status_code < 500:
                        log.info("ASR API warm-up exitoso")
                except Exception:
                    log.info("ASR API warm-up completado (endpoint no disponible)")
    except Exception as e:
        log.warning(f"Error en warm-up: {e}")

async def _close_shared_clients():
    global _telegram_client, _asr_client
    if _telegram_client:
        await _telegram_client.aclose()
        _telegram_client = None
    if _asr_client:
        await _asr_client.aclose()
        _asr_client = None
    log.info("Clientes HTTP cerrados")

# =========================
#  Utils (Telegram & Texto)
# =========================
def _chunk(s: str, n: int = 4000):
    for i in range(0, len(s), n):
        yield s[i:i+n]

def _fix_mojibake(s: str) -> str:
    if not s or not isinstance(s, str):
        return s
    if 'Â' in s or 'Ã' in s or 'â' in s:
        try:
            return s.encode('latin-1').decode('utf-8')
        except Exception:
            return s
    return s

def _mdv2_escape(s: str) -> str:
    if not s:
        return s
    s = _fix_mojibake(s)
    s = s.replace("\\", "\\\\")
    specials = ('_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!')
    for ch in specials:
        s = s.replace(ch, f"\\{ch}")
    return s

# =========================
#  Cache helpers (Redis-like)
# =========================
async def _cache_get_asr_transcription(audio_hash: str, cache=None):
    if not cache:
        return None
    try:
        key = f"asr_transcript:{audio_hash}"
        result = await cache.get(key)
        if result:
            transcript = result.decode('utf-8')
            log.info(f"ASR cache hit: {audio_hash[:8]}... -> '{(transcript[:50] + ('...' if len(transcript)>50 else ''))}'")
            return transcript
    except Exception as e:
        log.warning(f"Error obteniendo ASR cache: {e}")
    return None

async def _cache_set_asr_transcription(audio_hash: str, transcript: str, cache=None):
    if not cache or not transcript:
        return
    try:
        key = f"asr_transcript:{audio_hash}"
        await cache.set(key, transcript.encode('utf-8'), ttl_seconds=86400)
        log.info(f"ASR cached en Redis: {audio_hash[:8]}... bytes={len(transcript.encode('utf-8'))}")
    except Exception as e:
        log.warning(f"Error guardando ASR en cache: {e}")
# =========================
#  Pending Action helpers (Redis-like)
# =========================
async def _get_pending_action(chat_id: int, cache=None):
    if not cache: return None
    try:
        raw = await cache.get(f"tg_pending:{chat_id}")
        return json.loads(raw.decode("utf-8")) if raw else None
    except Exception as e:
        log.warning(f"Error leyendo pending_action: {e}")
        return None

async def _set_pending_action(chat_id: int, payload: dict, cache=None):
    if not cache or not payload: return
    try:
        await cache.set(
            f"tg_pending:{chat_id}",
            json.dumps(payload).encode("utf-8"),
            ttl_seconds=PENDING_ACTION_TTL
        )
        log.info(f"Pending action guardado para chat {chat_id}")
    except Exception as e:
        log.warning(f"Error guardando pending_action: {e}")

async def _clear_pending_action(chat_id: int, cache=None):
    if not cache: return
    try:
        # Si no tienes DELETE, pisa con TTL bajísimo
        await cache.set(f"tg_pending:{chat_id}", b"", ttl_seconds=1)
    except Exception as e:
        log.warning(f"Error limpiando pending_action: {e}")

# =========================
#  Telegram File Ops
# =========================
async def tg_get_file_path(file_id: str, file_unique_id: str, cache=None):
    if not file_id:
        return None

    if cache:
        try:
            if file_unique_id:
                cached_path = await cache.get(f"tg_file_path_unique:{file_unique_id}")
                if cached_path:
                    path = cached_path.decode('utf-8')
                    log.info(f"File path cache hit (unique): {file_unique_id[:8]}... -> {path}")
                    return path
            cached_path = await cache.get(f"tg_file_path:{file_id}")
            if cached_path:
                path = cached_path.decode('utf-8')
                log.info(f"File path cache hit: {file_id[:8]}... -> {path}")
                return path
        except Exception as e:
            log.warning(f"Error accediendo cache file_path: {e}")

    try:
        client = await _get_telegram_client()
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
        r = await client.post(url, json={"file_id": file_id}, timeout=TELEGRAM_TIMEOUT_AGGRESSIVE)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("result"):
                file_path = data["result"].get("file_path")
                if file_path:
                    log.info(f"⚡ File path obtenido: {file_id[:8]}... -> {file_path}")
                    if cache:
                        asyncio.create_task(_cache_file_path_async(cache, file_id, file_unique_id, file_path))
                    return file_path
        log.warning(f"Error obteniendo file_path: {r.status_code} - {r.text[:100]}")
        return None
    except Exception as e:
        log.error(f"Error en tg_get_file_path: {e}")
        return None

async def _cache_file_path_async(cache, file_id: str, file_unique_id: str, file_path: str):
    try:
        path_bytes = file_path.encode("utf-8")
        tasks = [cache.set(f"tg_file_path:{file_id}", path_bytes, ttl_seconds=21600)]  # 6h
        if file_unique_id:
            tasks.append(cache.set(f"tg_file_path_unique:{file_unique_id}", path_bytes, ttl_seconds=86400))  # 24h
        await asyncio.gather(*tasks, return_exceptions=True)
        log.info(f"File path cached: {file_id[:8]}... -> {file_path}")
    except Exception as e:
        log.warning(f"Error cacheando file_path: {e}")

async def tg_download_file(file_path: str):
    if not file_path:
        return None
    try:
        client = await _get_telegram_client()
        download_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        r = await client.get(download_url, timeout=TELEGRAM_DOWNLOAD_TIMEOUT)
        if r.status_code == 200:
            audio_bytes = r.content
            log.info(f"Audio descargado: {len(audio_bytes)} bytes desde {file_path}")
            return audio_bytes
        else:
            log.warning(f"Error descarga: {r.status_code}")
            return None
    except Exception as e:
        log.error(f"Error descargando: {e}")
        return None

# =========================
#  Audio validation & helpers
# =========================
def _validate_audio_metadata(audio_obj: dict) -> str:
    try:
        duration = audio_obj.get("duration", 0)
        file_size = audio_obj.get("file_size", 0)
        if duration and duration < 0.3:
            return "too_short"
        if file_size and file_size < 300:
            return "too_short"
        if duration and file_size:
            bps = file_size / duration
            if bps > 100000:
                return "suspicious_silence"
        if duration and duration > 60:
            return "too_long"
        return "good"
    except Exception:
        return "good"

def _analyze_audio_quality_basic(audio_bytes: bytes) -> str:
    try:
        if not audio_bytes or len(audio_bytes) < 100:
            return "empty"
        if len(audio_bytes) < 1000:
            return "too_short"
        sample_size = min(1024, len(audio_bytes))
        sample = audio_bytes[:sample_size]
        zero_count = sample.count(0)
        zero_ratio = zero_count / sample_size
        if zero_ratio > 0.95:
            return "empty"
        unique_bytes = len(set(sample))
        if unique_bytes < 8:
            return "empty"
        return "good"
    except Exception:
        return "good"

def _convert_to_wav_for_analysis(audio_bytes: bytes) -> bytes:
    try:
        return _audio_format_legacy(audio_bytes)
    except Exception:
        if audio_bytes.startswith(b'RIFF') and b'WAVE' in audio_bytes[:20]:
            return audio_bytes
        raise Exception("No se puede convertir audio para análisis")

def _validate_audio_energy(audio_bytes: bytes) -> str:
    try:
        basic = _analyze_audio_quality_basic(audio_bytes)
        if basic in ("empty", "too_short"):
            return basic
        if audio_bytes.startswith(b'OggS') and len(audio_bytes) < 2500:
            return "too_short"
        if audioop is None:
            return "good"
        if not audio_bytes or len(audio_bytes) < 1000:
            return "too_short"
        try:
            wav_bytes = _convert_to_wav_for_analysis(audio_bytes)
            if not wav_bytes or len(wav_bytes) < 1000:
                return "empty"
        except Exception:
            return _analyze_audio_quality_basic(audio_bytes)

        audio_data = wav_bytes[44:] if len(wav_bytes) > 44 else wav_bytes
        if len(audio_data) < 320:
            return "too_short"

        frame_size = 480 * 2
        silence_frames = 0
        low_energy_frames = 0
        total_frames = 0
        max_rms = 0

        step = frame_size
        if len(audio_data) > 500000:
            step = frame_size * 3
        elif len(audio_data) > 200000:
            step = frame_size * 2

        for i in range(0, len(audio_data) - frame_size, step):
            frame = audio_data[i:i + frame_size]
            if len(frame) >= frame_size:
                try:
                    rms = audioop.rms(frame, 2)
                    max_rms = max(max_rms, rms)
                    if rms < 50:
                        silence_frames += 1
                    elif rms < 200:
                        low_energy_frames += 1
                    total_frames += 1
                    if total_frames >= 10:
                        early_silence_ratio = silence_frames / total_frames
                        if early_silence_ratio > 0.95 and max_rms < 80:
                            return "empty"
                except Exception:
                    continue

        if total_frames == 0:
            return "too_short"

        silence_ratio = silence_frames / total_frames
        low_energy_ratio = (silence_frames + low_energy_frames) / total_frames
        estimated_duration = total_frames * 0.03

        if max_rms < 50:
            return "empty"

        if estimated_duration > 5.0:
            if silence_ratio > 0.90:
                return "empty"
            if low_energy_ratio > 0.95:
                return "empty"
            if max_rms < 200:
                return "empty"
        else:
            if silence_ratio > 0.95:
                return "empty"
            if low_energy_ratio > 0.98:
                return "empty"

        return "good"
    except Exception:
        return _analyze_audio_quality_basic(audio_bytes)

# =========================
#  ASR & Text Normalization
# =========================
def _clean_transcript_text(transcript: str) -> str:
    if not transcript:
        return transcript
    transcript = _fix_mojibake(transcript)
    try:
        emoji_re = re.compile(
            "[" "\U0001F600-\U0001F64F" "\U0001F300-\U0001F5FF" "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF" "\U00002700-\U000027BF" "\U000024C2-\U0001F251"
            "\U0001F900-\U0001F9FF" "\u200D" "\uFE0F" "]+", flags=re.UNICODE,
        )
    except re.error:
        emoji_re = re.compile(r'[\U0001F300-\U0001F5FF]+', flags=re.UNICODE)
    try:
        transcript = emoji_re.sub('', transcript)
    except Exception:
        transcript = re.sub(r'[\uFE0F\u200D]', '', transcript)
    transcript = transcript.replace('\\', '')
    transcript = transcript.replace("|", "")
    transcript = transcript.replace("ï¿½", "")
    transcript = transcript.replace("\x00", "")
    transcript = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', transcript)
    transcript = re.sub(r'\s+', ' ', transcript)
    transcript = transcript.strip().strip('|').strip('\\').strip()
    return transcript

def _build_asr_initial_prompt(keywords: list = None) -> str:
    if not keywords:
        keywords = ALL_KEYWORDS
    critical = []
    if "UCT" in keywords: critical.append("UCT")
    if "CINAP" in keywords: critical.append("CINAP")
    if "asesoría" in keywords or "asesoria" in keywords:
        critical.extend(["asesoría", "asesoria", "agendar"])
    items = ", ".join(dict.fromkeys(critical))
    examples = []
    if "UCT" in critical:
        examples += ['"u ce te" -> UCT', '"u c t" -> UCT', '"Universidad Católica de Temuco" -> UCT']
    if "CINAP" in critical:
        examples += [
            '"si nap" -> CINAP', '"ci nap" -> CINAP', '"centro de innovación en aprendizaje" -> CINAP',
            '"chin up" -> CINAP', '"che nap" -> CINAP',
            '"centro de innovación en docencia y tecnología educativa" -> CINAP',
            '"centro de innovación en docencia" -> CINAP',
            '"centro de innovación y tecnología educativa" -> CINAP',
            '"sino pop" -> CINAP', '"china p" -> CINAP', '"chin up" -> CINAP'
        ]
    ex = (" Ejemplos: " + "; ".join(examples)) if examples else ""
    return f"Usa estrictamente estas siglas en mayúsculas cuando suenen similares: {items}.{ex}"

def _prenormalizar_fonetico(texto: str) -> str:
    if not texto: return texto
    t = texto
    t = re.sub(r"\bu\s*ce?\s*te\b", "UCT", t, flags=re.IGNORECASE)
    t = re.sub(r"\bu\s*[\.\s]*c\s*[\.\s]*t\b", "UCT", t, flags=re.IGNORECASE)
    t = re.sub(r"\bucte?\b", "UCT", t, flags=re.IGNORECASE)
    t = re.sub(r"\bsi\s*nap\b", "CINAP", t, flags=re.IGNORECASE)
    t = re.sub(r"\bci\s*nap\b", "CINAP", t, flags=re.IGNORECASE)
    t = re.sub(r"\bcina?p\b", "CINAP", t, flags=re.IGNORECASE)
    t = re.sub(r"\bsinap\b", "CINAP", t, flags=re.IGNORECASE)
    t = re.sub(r"\bchinap\b", "CINAP", t, flags=re.IGNORECASE)
    t = re.sub(r"\bsyrup\b", "CINAP", t, flags=re.IGNORECASE)

    t = re.sub(r"\buniversidad\s+cat[oó]lica(?:\s+de\s+temuco)?\b", "UCT", t, flags=re.IGNORECASE)
    t = re.sub(
        r"\bcentro\s+de\s+innovaci[oó]n(?:\s+en\s+aprendizaje)?(?:\s+docencia)?(?:\s+y\s+tecnolog[ií]a\s+educativa)?\b",
        "CINAP", t, flags=re.IGNORECASE)
    return t

def _normalizar_siglas(texto: str) -> str:
    if not texto:
        return texto
    for pattern, replacement in GLOSARIO_REGEX:
        texto = pattern.sub(replacement, texto)
    return texto

# =========================
#  Slot-filling simple (fecha/hora)
# =========================
HOUR_RE = re.compile(r"\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b", re.I)
WHO_RE  = re.compile(r"\bcon\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)*)", re.U)

def parse_when(text: str, tz="America/Santiago"):
    if dateparser is None:
        return None
    try:
        return dateparser.parse(
            text, languages=["es", "en"],
            settings={"TIMEZONE": tz, "PREFER_DATES_FROM": "future"}
        )
    except Exception:
        return None

def extract_event_slots(text: str):
    dt = parse_when(text)
    hour = HOUR_RE.search(text or "")
    who  = WHO_RE.search(text or "")
    return {
        "date": (dt.date().isoformat() if dt else None) if dt else None,
        "time": (hour.group(1) if hour else (dt.strftime("%H:%M") if dt else None)) if (hour or dt) else None,
        "attendee": (who.group(1) if who else None),
        "title": "Reunión"
    }

def slots_complete_for_create_event(slots: dict) -> bool:
    return bool(slots.get("date") and slots.get("time"))

# =========================
#  ASR Calls
# =========================
class ASRResult:
    def __init__(self, text: str, confidence: float = 0.0, language: str = "es",
                 segments: list = None, processing_time: float = 0.0):
        self.text = text
        self.confidence = confidence
        self.language = language
        self.segments = segments or []
        self.processing_time = processing_time

async def asr_transcribe_filelike_optimized(filename: str, file_bytes: bytes, mime: str) -> tuple[int, str]:
    url = f"{ASR_BASE_URL.rstrip('/')}/v1/audio/transcriptions"
    client = await _get_asr_client()
    files = {"file": (filename, file_bytes, mime)}
    data = {"model": ASR_MODEL_NAME, "language": ASR_LANG, "temperature": "0.0"}
    try:
        async with astage("telegram.asr"):
            r = await client.post(url, data=data, files=files)
        status = r.status_code
        try:
            js = r.json()
            text = js.get("text") if isinstance(js, dict) else None
            if not text:
                text = r.text
            return status, text
        except Exception:
            return status, r.text
    except Exception as e:
        return 500, str(e)

async def _audio_format_optimized(audio_bytes: bytes, target_ar: int = 16000) -> bytes:
    if shutil.which('ffmpeg') is None:
        log.info("ffmpeg no encontrado en PATH, omitiendo conversión optimizada")
        return audio_bytes
    cmd = f'ffmpeg -hide_banner -loglevel error -i pipe:0 -f wav -acodec pcm_s16le -ac 1 -ar {target_ar} pipe:1'
    try:
        proc = await asyncio.create_subprocess_exec(
            *shlex.split(cmd),
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, stderr = await proc.communicate(input=audio_bytes)
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg error: {stderr.decode(errors='ignore')}")
        log.info(f"Audio convertido: {len(audio_bytes)} -> {len(stdout)} bytes")
        return stdout
    except Exception as e:
        log.debug(f"Conversión optimizada falló: {e}")
        if isinstance(e, FileNotFoundError) or "not found" in str(e).lower() or "no se puede encontrar" in str(e).lower():
            log.info("ffmpeg no encontrado o inaccesible, usando audio original sin conversión")
            return audio_bytes
        return _audio_format_legacy(audio_bytes)

def _audio_format_legacy(audio_bytes: bytes) -> bytes:
    try:
        if ffmpeg is None:
            raise ImportError("ffmpeg no disponible")
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as src_tmp:
            src_tmp.write(audio_bytes)
            src_path = src_tmp.name
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as dst_tmp:
            dst_path = dst_tmp.name
        try:
            t = time.perf_counter()
            (
                ffmpeg
                .input(src_path)
                .output(dst_path, format='wav', acodec='pcm_s16le', ac=1, ar=WAV_AR)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            with open(dst_path, "rb") as f:
                converted_bytes = f.read()
            log.info(f"ffmpeg_convert_ms={round((time.perf_counter()-t)*1000,1)} in={len(audio_bytes)} out={len(converted_bytes)}")
            return converted_bytes
        except FileNotFoundError:
            log.info("ffmpeg binario no encontrado al usar ffmpeg-python, usando audio original")
            return audio_bytes
        except OSError as e:
            log.info(f"ffmpeg no disponible (OSError): {e}; usando audio original")
            return audio_bytes
        finally:
            for path in [src_path, dst_path]:
                try: os.remove(path)
                except Exception: pass
    except ImportError:
        log.info("ffmpeg-python no disponible, usando audio original")
        return audio_bytes
    except Exception as e:
        log.warning(f"Error convirtiendo audio: {e}")
        return audio_bytes

async def _asr_fallback_wav_optimized(audio_bytes: bytes, filename: str) -> str | None:
    try:
        wav_bytes = await _audio_format_optimized(audio_bytes)
        status, text = await asr_transcribe_filelike_optimized(
            filename.replace('.ogg', '.wav'), wav_bytes, "audio/wav"
        )
        if 200 <= status < 300:
            return _clean_transcript_text(text)
        else:
            log.warning(f"ASR WAV fallback falló: {status}")
            return None
    except Exception as e:
        log.warning(f"Fallback WAV error: {e}")
        return None

async def asr_transcribe(audio_bytes: bytes, filename: str = "audio.ogg", cache=None) -> ASRResult | None:
    start_time = time.time()
    audio_hash = hashlib.md5(audio_bytes).hexdigest()

    cached_result = await _cache_get_asr_transcription(audio_hash, cache)
    if cached_result:
        text = _clean_transcript_text(cached_result)
        text = _prenormalizar_fonetico(text)
        text = _normalizar_siglas(text)
        return ASRResult(text=text, confidence=0.9, processing_time=time.time() - start_time)

    transcribe_url = f"{ASR_BASE_URL.rstrip('/')}/v1/audio/transcriptions"
    original_size = len(audio_bytes)
    log.info(f"Audio original: {original_size} bytes")
    try:
        if len(audio_bytes) > 1024 * 1024:
            log.info("Audio grande detectado, enviando directo al ASR (sin conversión previa)")
        else:
            log.info("Audio no requiere conversión por tamaño")
    except Exception as e:
        log.warning(f"Error evaluando formato de audio: {e}")

    client = await _get_asr_client()
    mime = "audio/ogg"
    if audio_bytes[:4] == b"RIFF" and b"WAVE" in audio_bytes[:16]:
        mime = "audio/wav"

    files = {"file": (filename, audio_bytes, mime)}
    data = {
        "model": ASR_MODEL_NAME,
        "language": ASR_LANG,
        "temperature": "0.0",
        "response_format": "verbose_json",
        "timestamp_granularities": ["segment"],
    }
    initial_prompt = _build_asr_initial_prompt()
    if initial_prompt:
        data["prompt"] = initial_prompt
        data["initial_prompt"] = initial_prompt

    try:
        async with astage("telegram.asr"):
            r = await client.post(transcribe_url, data=data, files=files)

        if r.status_code >= 400:
            log.info(f"ASR falló con formato original ({r.status_code}), probando WAV...")
            fallback_text = await _asr_fallback_wav_optimized(audio_bytes, filename)
            if fallback_text:
                return ASRResult(text=fallback_text, confidence=0.7, processing_time=time.time() - start_time)
            return None

        if r.status_code != 200:
            log.warning("ASR %s: %s", r.status_code, r.text[:200])
            return None

        try:
            j = r.json()
        except Exception:
            log.warning("Error parseando respuesta ASR JSON")
            return None

        transcript = j.get("text") or j.get("transcript") or j.get("result")
        if not transcript:
            log.warning(f"ASR no retornó texto. JSON completo: {j}")
            return None

        confidence = 0.8
        language = j.get("language", ASR_LANG)
        segments = j.get("segments", [])
        if segments:
            confidences = [seg.get("avg_logprob", 0) for seg in segments if seg.get("avg_logprob")]
            if confidences:
                confidence = min(max(sum(confidences) / len(confidences) + 1.0, 0.0), 1.0)

        transcript_original = transcript
        transcript = _clean_transcript_text(transcript)
        transcript = _prenormalizar_fonetico(transcript)
        transcript_before_normalization = transcript
        transcript = _normalizar_siglas(transcript)

        if transcript != transcript_original:
            log.info(f"DESPUÉS LIMPIEZA: '{transcript}' (antes: '{transcript_original}')")
        if transcript != transcript_before_normalization:
            log.info(f"DESPUÉS NORMALIZACIÓN: '{transcript}' (antes: '{transcript_before_normalization}')")

        if transcript:
            await _cache_set_asr_transcription(audio_hash, transcript, cache)

        result = ASRResult(
            text=transcript,
            confidence=confidence,
            language=language,
            segments=segments,
            processing_time=time.time() - start_time
        )
        return result
    except Exception as e:
        log.warning(f"Error en transcripción: {e}")
        return None

async def transcribe_optimized(audio_bytes: bytes, cache=None) -> ASRResult | None:
    return await asr_transcribe(audio_bytes, "audio.ogg", cache)

# =========================
#  Intent Classification
# =========================
class IntentClassification:
    def __init__(self, intent_type: str, confidence: float,
                 extracted_params: dict = None, requires_llm: bool = False):
        self.intent_type = intent_type
        self.confidence = confidence
        self.extracted_params = extracted_params or {}
        self.requires_llm = requires_llm

def classify_user_intent(asr_result: ASRResult) -> IntentClassification:
    text = asr_result.text.lower().strip()
    confidence_boost = min(asr_result.confidence * 0.2, 0.1)

    greeting_patterns = ["hola", "hi", "hello", "buenas", "buenos días", "buenas tardes", "buenas noches", "saludos", "qué tal", "cómo estás"]
    if any(p in text for p in greeting_patterns) and len(text.split()) <= 3:
        return IntentClassification("greeting", 0.9 + confidence_boost, requires_llm=False)

    calendar_simple_patterns = [
        (r"agendar.*(\d{1,2}).*(\d{1,2})", {"action": "schedule"}),
        (r"cancelar.*cita", {"action": "cancel"}),
        (r"ver.*agenda", {"action": "view"}),
        (r"disponibilidad.*(\w+)", {"action": "availability"}),
        (r"horario.*libre", {"action": "free_slots"}),
    ]
    for pattern, params in calendar_simple_patterns:
        if re.search(pattern, text):
            return IntentClassification("calendar_simple", 0.8 + confidence_boost, extracted_params=params, requires_llm=False)

    professor_patterns = [
        (r"profesor.*de.*(\w+)", {"subject": "extracted"}),
        (r"asesor.*(\w+)", {"type": "advisor"}),
        (r"docente.*matem[áa]tica", {"subject": "matematicas"}),
        (r"teacher.*english", {"subject": "ingles"}),
    ]
    for pattern, params in professor_patterns:
        match = re.search(pattern, text)
        if match:
            return IntentClassification("professor_simple", 0.7 + confidence_boost, extracted_params=params, requires_llm=False)

    complex_indicators = ["quiero", "necesito", "me gustaría", "podrías", "puedes", "ayúdame", "explicar", "cómo", "cuál", "cuándo", "dónde", "por favor", "favor", "consulta sobre"]
    academic_context = ["profesor", "asesor", "cita", "agenda", "horario", "materia", "asignatura", "tutoría", "asesoría", "clase"]

    has_complex = any(i in text for i in complex_indicators)
    has_academic = any(c in text for c in academic_context)

    if has_complex and has_academic:
        return IntentClassification("complex", 0.6 + confidence_boost, requires_llm=True)

    if has_academic:
        return IntentClassification("calendar_simple", 0.5 + confidence_boost, requires_llm=False)

    return IntentClassification("unknown", 0.3, requires_llm=True)

# =========================
#  MCP Tools Mapping
# =========================
INTENT_TO_TOOL = {
    "calendar_simple:view":          "list_upcoming_events",
    "calendar_simple:availability":  "list_professor_availability",
    "calendar_simple:schedule":      "create_calendar_event",
    "professor_simple":              "search_professors",
}
async def _maybe_store_pending_from_mcp(result, chat_id: int, cache=None):
    """
    Intenta detectar una respuesta de MCP que indique 'preview/pending' y guarda tool+args.
    Adapta las claves según lo que devuelva tu servidor MCP.
    """
    try:
        if not cache or not isinstance(result, dict):
            return
        payload = None

        # Formatos típicos (ajusta a tu payload real)
        if result.get("pending_action"):
            payload = result["pending_action"]
        elif result.get("status") in ("preview", "pending") and (result.get("tool") or result.get("args")):
            payload = {"tool": result.get("tool") or "create_calendar_event", "args": result.get("args", {})}
        elif result.get("requires_confirmation") and result.get("args"):
            payload = {"tool": result.get("tool") or "create_calendar_event", "args": result["args"]}

        if payload and payload.get("tool") and payload.get("args") is not None:
            await _set_pending_action(chat_id, payload, cache)
            log.info(f"[MCP] Pending action almacenado: tool={payload['tool']}")
    except Exception as e:
        log.warning(f"_maybe_store_pending_from_mcp failed: {e}")




def _needs_mcp_tools(text: str) -> bool:
    text_lower = text.lower().strip()
    quick_exclusions = [
        "hola", "hi", "buenas", "gracias", "ok", "vale", "perfecto",
        "qué tal", "cómo estás", "buenos días", "buenas tardes",
        "qué es", "explica", "define", "cuéntame", "dime sobre",
        "información sobre", "cómo funciona", "help", "ayuda"
    ]
    for exclusion in quick_exclusions:
        if exclusion in text_lower:
            return False

    high_certainty_keywords = [
        "crear evento", "agendar cita", "programar reunión", "nueva cita",
        "agregar evento", "crear reunión", "agendar evento", "listame",
        "lista mis", "mis eventos", "eventos próximos", "calendario",
        "reservar", "cancelar cita", "modificar evento"
    ]
    for kw in high_certainty_keywords:
        if kw in text_lower:
            return True

    action_indicators = ["quiero", "necesito", "voy a", "tengo que", "debo", "me puedes", "puedes"]
    calendar_words = ["evento", "cita", "reunión", "fecha", "horario", "agenda"]
    has_action = any(a in text_lower for a in action_indicators)
    has_calendar = any(w in text_lower for w in calendar_words)
    return has_action and has_calendar

# =========================
#  Routing (MCP & LLM) + Domain Guard (relajado)
# =========================
async def route_to_mcp_direct(intent: IntentClassification, asr_result: ASRResult,
                             chat_id: int, mcp_client_getter, cache=None) -> str | None:
    try:
        mcp = mcp_client_getter() if mcp_client_getter else None
        if not mcp:
            return None

        tool = None
        args = {}
        if intent.intent_type == "calendar_simple":
            action = intent.extracted_params.get("action")
            if action == "view":
                tool = INTENT_TO_TOOL["calendar_simple:view"]
                args = {"window": "next_7_days"}
            elif action == "availability":
                tool = INTENT_TO_TOOL["calendar_simple:availability"]
                args = {"range": "this_week"}
            elif action == "schedule":
                tool = INTENT_TO_TOOL["calendar_simple:schedule"]
                slots = extract_event_slots(asr_result.text)
                args = {
                    "title": slots.get("title"),
                    "date": slots.get("date"),
                    "time": slots.get("time"),
                    "attendee": slots.get("attendee"),
                }
                if not slots_complete_for_create_event(args):
                    return None
            else:
                return None
        elif intent.intent_type == "professor_simple":
            tool = INTENT_TO_TOOL.get("professor_simple")
            args = intent.extracted_params or {}
        else:
            return None

        idem = f"tg:{chat_id}:{int(time.time()*1000)}"
        args["idempotency_key"] = idem

        try:
            async with astage("telegram.mcp_direct"):
                result = await asyncio.wait_for(
                    mcp.call_tool(tool, args, thread_id=f"tg:{chat_id}"),
                    timeout=MCP_TIMEOUT_AGGRESSIVE
                )
        except asyncio.TimeoutError:
            return None
        
        await _maybe_store_pending_from_mcp(result, chat_id, cache)

        if isinstance(result, dict):
            return result.get("message") or result.get("text") or str(result)
        return str(result)
    except Exception as e:
        log.warning(f" MCP Direct FAILED: {e}")
        return None

async def route_to_llm_plus_mcp(asr_result: ASRResult, chat_id: int, agent_getter) -> str | None:
    try:
        agent = agent_getter()
        if not agent:
            return None

        if STRICT_DOMAIN_ENFORCEMENT:
            DOMAIN_PROMPT = """
            Eres el asistente institucional del Centro de Innovación en Aprendizaje,
            Docencia y Tecnología Educativa (CINAP) de la Universidad Católica de Temuco (UCT).

            Solo puedes responder sobre:
            - Asesorías, docentes, agendamiento, horarios, cancelaciones y servicios del CINAP.
            - Funcionamiento del sistema de agendamiento académico de la UCT.
            - Categorías y servicios del portal del CINAP.

            Si la pregunta está fuera de este dominio, responde exactamente:
            "Lo siento, solo puedo ayudarte con temas del sistema de asesorías y agendamiento del CINAP."
            """.strip()
        else:
            # Prompt suave: NO bloquea nada, solo sugiere priorizar temas UCT/CINAP cuando aplique.
            DOMAIN_PROMPT = """
            Eres un asistente útil y conciso para usuarios de la Universidad Católica de Temuco (UCT) y del CINAP.
            Responde de forma clara y directa. Si el usuario pregunta sobre UCT/CINAP/agenda académica, prioriza detalles prácticos.
            Si la consulta es general y no relacionada, respóndela normalmente. No es necesario rechazar preguntas fuera de dominio.
            """.strip()

        if hasattr(agent, "update_system_prompt"):
            agent.update_system_prompt(DOMAIN_PROMPT)
        elif hasattr(agent, "set_system_prompt"):
            agent.set_system_prompt(DOMAIN_PROMPT)
        elif hasattr(agent, "system_prompt"):
            try:
                agent.system_prompt = DOMAIN_PROMPT
            except Exception:
                pass
        elif hasattr(agent, "add_system_message"):
            try:
                agent.add_system_message(DOMAIN_PROMPT)
            except Exception:
                pass

        async with astage("telegram.llm_plus_mcp"):
            log.info(f"LLM invocation: chat_id={chat_id} text_len={len(asr_result.text) if asr_result and asr_result.text else 0}")
            result = await agent.invoke(asr_result.text, thread_id=f"tg:{chat_id}")

        response = result if isinstance(result, str) else str(result)

        # En modo relajado no se fuerza dominio; _enforce_domain_reply será no-op si STRICT_DOMAIN_ENFORCEMENT=False
        response = _enforce_domain_reply(asr_result.text or "", response or "")
        log.info(f"LLM+MCP SUCCESS (len={len(response)} chars)")
        return response
    except Exception as e:
        log.warning(f"LLM+MCP FAILED: {e}")
        return None

# Emojis
EMOJI_VOICE = "🗣️"
EMOJI_BOT = "🤖"
EMOJI_BRAIN = "🧠"
EMOJI_TARGET = "🎯"
EMOJI_WARNING = "⚠️"
EMOJI_WAVE = "👋"
EMOJI_BUILDING = "🏛️"
EMOJI_LOCATION = "📍"
EMOJI_SMILE = "😊"
EMOJI_CHECK = "✅"

async def intelligent_routing_system(asr_result: ASRResult, chat_id: int, agent_getter, mcp_client_getter, cache) -> str:
    async with astage("telegram.intent_classification"):
        intent = classify_user_intent(asr_result)

    try:
        log.info(
            "Routing decision inputs: chat_id=%s intent=%s confidence=%.2f requires_llm=%s text_preview=%s",
            chat_id, intent.intent_type, intent.confidence, intent.requires_llm,
            (asr_result.text[:120] + '...') if asr_result and asr_result.text and len(asr_result.text) > 120 else (asr_result.text if asr_result and asr_result.text else '')
        )
    except Exception:
        log.info("Routing decision inputs: (could not stringify intent or text)")

    log.info(f"Intent: {intent.intent_type} (conf: {intent.confidence:.2f}, llm: {intent.requires_llm})")

    try:
        _rid = None
        try:
            _rid = _get_trace().get("request_id")
        except Exception:
            _rid = None
        logging.getLogger("timings").info({
            "event": "routing_decision",
            "request_id": _rid,
            "chat_id": chat_id,
            "intent": intent.intent_type,
            "confidence": round(float(intent.confidence or 0.0), 2),
            "requires_llm": bool(intent.requires_llm),
        })
    except Exception:
        pass

    # 1) Saludo directo
    if intent.intent_type == "greeting":
        greetings = [
            "¡Hola! Soy tu asistente de CINAP. ¿En qué puedo ayudarte hoy?",
            "¡Hola! ¿Necesitas ayuda con tu agenda académica?",
            "¡Buenas! Estoy aquí para ayudarte con citas y profesores."
        ]
        import random
        return random.choice(greetings)

    response = None

    # 2) MCP directo si es simple
    if not intent.requires_llm and intent.confidence > 0.6:
        log.info("Routing: MCP_DIRECT")
        set_meta(router_choice="mcp_direct", intent=intent.intent_type, chat_id=chat_id)
        try:
            logging.getLogger("timings").info({
                "event": "routing_choice",
                "request_id": _get_trace().get("request_id"),
                "chat_id": chat_id,
                "choice": "mcp_direct",
                "intent": intent.intent_type,
                "confidence": round(float(intent.confidence or 0.0), 2),
            })
        except Exception:
            pass

        response = await route_to_mcp_direct(intent, asr_result, chat_id, mcp_client_getter, cache)
        if not response:
            log.info("MCP direct sin respuesta; fallback a LLM+MCP")
            set_meta(router_choice="fallback_llm", intent=intent.intent_type, chat_id=chat_id)
            try:
                logging.getLogger("timings").info({
                    "event": "routing_choice",
                    "request_id": _get_trace().get("request_id"),
                    "chat_id": chat_id,
                    "choice": "fallback_llm",
                    "intent": intent.intent_type,
                    "confidence": round(float(intent.confidence or 0.0), 2),
                })
            except Exception:
                pass
            response = await route_to_llm_plus_mcp(asr_result, chat_id, agent_getter)
    else:
        # 3) LLM+MCP completo
        log.info("Routing: LLM+MCP")
        set_meta(router_choice="llm", intent=intent.intent_type, chat_id=chat_id)
        try:
            logging.getLogger("timings").info({
                "event": "routing_choice",
                "request_id": _get_trace().get("request_id"),
                "chat_id": chat_id,
                "choice": "llm",
                "intent": intent.intent_type,
                "confidence": round(float(intent.confidence or 0.0), 2),
            })
        except Exception:
            pass
        response = await route_to_llm_plus_mcp(asr_result, chat_id, agent_getter)

    if not response:
        response = "Lo siento, tuve un problema técnico. ¿Podrías repetir tu consulta?"
        log.info("Final response fallback used (no response from MCP/LLM)")

    # En modo relajado no se fuerza dominio (no-op si STRICT_DOMAIN_ENFORCEMENT=False)
    response = _enforce_domain_reply(asr_result.text or "", response or "")
    return response

# =========================
#  Telegram Router
# =========================
def make_telegram_router(*, cache=None, agent_getter=None, mcp_client_getter=None, get_session_dep=get_session_dep):
    router = APIRouter(prefix="/telegram", tags=["telegram"])

    class OptimizedTelegramBot:
        def __init__(self):
            self.base = f"https://api.telegram.org/bot{BOT_TOKEN}"

        async def send_message(self, chat_id: int, text: str,
                               disable_web_page_preview: bool = False,
                               allow_sending_without_reply: bool = False):
            client = await _get_telegram_client()
            try:
                text = _fix_mojibake(text)
            except Exception:
                pass
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "MarkdownV2",
                "disable_web_page_preview": disable_web_page_preview,
                "allow_sending_without_reply": allow_sending_without_reply
            }
            try:
                response = await client.post(f"{self.base}/sendMessage", json=payload)
                if response.status_code == 200:
                    return response.json().get("result")
                else:
                    log.error(f"Telegram API error: status={response.status_code}, response={response.text[:200]}")
                    return None
            except Exception as e:
                log.error(f"HTTPx exception: {e}")
                return None

        async def edit_message(self, chat_id: int, message_id: int, text: str,
                               disable_web_page_preview: bool = False):
            client = await _get_telegram_client()
            payload = {
                "chat_id": chat_id,
                "message_id": message_id,
                "text": text,
                "parse_mode": "MarkdownV2",
                "disable_web_page_preview": disable_web_page_preview
            }
            try:
                response = await client.post(f"{self.base}/editMessageText", json=payload)
                return response.status_code == 200
            except Exception:
                return False

    bot = OptimizedTelegramBot()

    async def _send_direct_message(chat_id: int, text: str) -> None:
        await bot.send_message(chat_id, text, disable_web_page_preview=True, allow_sending_without_reply=True)

    async def _is_duplicate_update(update_id: int) -> bool:
        if not cache or not update_id:
            return False
        try:
            key = f"tg_update:{update_id}"
            exists = await cache.get(key)
            return exists is not None
        except Exception as e:
            log.warning(f"Error verificando duplicado: {e}")
            return False

    async def _mark_update_processed(update_id: int) -> None:
        if not cache or not update_id:
            return
        try:
            key = f"tg_update:{update_id}"
            await cache.set(key, b"1", ttl_seconds=3600)
            log.debug(f"Update {update_id} marcado como procesado")
        except Exception as e:
            log.warning(f"Error marcando update: {e}")

    # =========================
    #  Background: Audio Flow (sin guard estricto)
    # =========================
    async def _process_audio_background(chat_id: int, file_id: str, file_unique_id: str, audio_obj: dict):
        log.info(f"ULTRA-FAST background task: chat_id={chat_id}, file_id={file_id[:8] if file_id else 'None'}...")
        rid = new_request()
        set_meta(source="telegram.bg", chat_id=chat_id, file_id=file_id, file_unique_id=file_unique_id, route="inline_tool")
        t0 = time.perf_counter()
        try:
            if not agent_getter:
                log.error("No hay agent_getter configurado")
                return
            agent = agent_getter()
            if not agent:
                log.error("No se pudo obtener agente")
                return

            # 1) Validación metadatos
            metadata_result = _validate_audio_metadata(audio_obj)
            if metadata_result != "good":
                if metadata_result == "too_short":
                    error_msg = " Audio demasiado corto\\."
                elif metadata_result == "too_long":
                    error_msg = " Audio demasiado largo \\(máx\\. 1 minuto\\)\\."
                elif metadata_result == "suspicious_silence":
                    error_msg = " Audio parece estar vacío o muy silencioso\\."
                else:
                    error_msg = " Audio inválido\\."
                await _send_direct_message(chat_id, error_msg)
                return

            # 2) getFile → 3) descarga
            async with astage("telegram.get_file_path"):
                file_id_hash = hashlib.md5(file_id.encode()).hexdigest()[:8] if file_id else "unknown"
                file_path = await tg_get_file_path(file_id, file_unique_id, cache)
            if not file_path:
                log.error(f"No se pudo obtener file_path para audio {file_id_hash}")
                await _send_direct_message(chat_id, " Error obteniendo archivo de audio")
                return

            async with astage("telegram.download"):
                audio_bytes = await tg_download_file(file_path)
            if not audio_bytes:
                await _send_direct_message(chat_id, " Error descargando audio")
                return

            # 4) Validación energética + ASR
            energy_result = _validate_audio_energy(audio_bytes)
            audio_hash = hashlib.md5(audio_bytes).hexdigest()
            if energy_result != "good":
                if energy_result == "empty":
                    error_msg = " Audio vacío o muy silencioso\\. Intenta de nuevo\\."
                elif energy_result == "too_short":
                    error_msg = " Audio demasiado corto\\. Mínimo 1 segundo\\."
                else:
                    error_msg = " Audio no válido\\."
                log.info(f"Audio rechazado por energía: {energy_result} - {len(audio_bytes)} bytes")
                await _send_direct_message(chat_id, error_msg)
                return

            cached_transcript = await _cache_get_asr_transcription(audio_hash, cache)
            if cached_transcript:
                transcript = _clean_transcript_text(cached_transcript)
                transcript = _prenormalizar_fonetico(transcript)
                transcript = _normalizar_siglas(transcript)
                asr_result = ASRResult(text=transcript, confidence=0.9, language=ASR_LANG, segments=[], processing_time=0.01)
            else:
                try:
                    asr_result = await asyncio.wait_for(transcribe_optimized(audio_bytes, cache), timeout=ASR_TIMEOUT)
                    transcript = asr_result.text if asr_result else None
                except asyncio.TimeoutError:
                    log.warning(f"ASR timeout after {ASR_TIMEOUT}s for {len(audio_bytes)} bytes")
                    asr_result = None
                    transcript = None

            if not transcript or not asr_result:
                await _send_direct_message(chat_id, " Audio vacío o no detecté mensaje\\. Intenta hablar más claro\\.")
                return

            # 5) Autenticidad
            if not _validate_transcript_authenticity(transcript):
                await _send_direct_message(chat_id, " Audio no claro o con ruido\\. Intenta de nuevo\\.")
                return

            # 5.1) (ANTES había guard de dominio; ahora solo registramos)
            if not _is_domain_related(transcript) and not _is_ack(transcript):
                log.info("Transcripción fuera de dominio (permitido por configuración relajada)")

            # === Respuestas rápidas por keywords (UCT / CINAP)
            tlow = (transcript or "").lower()
            for a, b in [
                ("chin up", "cinap"), ("chi nap", "cinap"), ("che nap", "cinap"),
                ("chinap", "cinap"), ("china p", "cinap"), ("seen app", "cinap"),
                ("c nap", "cinap"), ("cnap", "cinap"), ("sin up", "cinap"),
                ("sinop", "cinap"), ("sin ope", "cinap"), ("sin open", "cinap"),
                ("syrup", "cinap"),
                ("sinope", "cinap"), ("sinap", "cinap"), ("sin app", "cinap"), ("sin ap", "cinap"),
                ("u c t", "uct"), ("u c t.", "uct"), ("u c t,", "uct"),
                ("you c t", "uct"), ("you see t", "uct"), ("you s t", "uct"),
                ("ucat", "uct"), ("u cat", "uct"), ("u. cat", "uct"),
                ("usete", "uct"), ("temuco.", "temuco"), ("temuco,", "temuco"),
                ("temuco)", "temuco"), ("temuco(", "temuco"),
                ("catolica", "católica"),
                ("universidad catolica", "universidad católica"),
                ("universidad católica de temuco", "uct"), ("universidad catolica de temuco", "uct"),
            ]:
                tlow = tlow.replace(a, b)

            if ("uct" in tlow) or ("universidad católica" in tlow) or ("católica temuco" in tlow):
                uct_response = _mdv2_escape(
                    " UCT - Universidad Católica de Temuco \n\n"
                    "La Universidad Católica de Temuco es una institución de educación superior tradicional privada, "
                    "reconocida por su excelencia académica y compromiso con el desarrollo regional."
                )
                safe_transcript = _mdv2_escape(transcript)
                response_text = f" _{safe_transcript}_\n\n{uct_response}"
                async with astage("telegram.tg_send_fast"):
                    await _send_direct_message(chat_id, response_text)
                return

            if ("cinap" in tlow) or ("centro de innovación" in tlow) or ("centro innovación aprendizaje" in tlow) \
               or ("centro de docencia" in tlow) or ("centro de apoyo docente" in tlow):
                cinap_response = _mdv2_escape(
                    " CINAP - Centro de Innovación en Aprendizaje, Docencia y Tecnología Educativa \n\n"
                    "El CINAP acompaña pedagógicamente a los docentes de la UCT, fortaleciendo la enseñanza mediante "
                    "asesorías en formación docente, educación digital, innovación en la docencia, investigación aplicada "
                    "y experimentación pedagógica en entornos de laboratorio."
                )
                safe_transcript = _mdv2_escape(transcript)
                response_text = f" _{safe_transcript}_\n\n{cinap_response}"
                async with astage("telegram.tg_send_fast"):
                    await _send_direct_message(chat_id, response_text)
                return

            # Detección temprana de eventos calendario
            calendar_intent = _detect_calendar_event_intent(transcript)
            if calendar_intent.get("is_calendar_event", False):
                log.info(f"CALENDAR EVENT DETECTED: {calendar_intent}")
                calendar_response = (
                    f"{EMOJI_TARGET} ¡Detecté que quieres agendar una asesoría!\n\n"
                )
                if calendar_intent.get("time_mentions"):
                    calendar_response += f" Horario mencionado: {', '.join(calendar_intent['time_mentions'])}\n"
                if calendar_intent.get("person_mentions"):
                    calendar_response += f" Profesor mencionado: {', '.join(calendar_intent['person_mentions'])}\n"
                calendar_response += (
                    f"\n Para agendar tu asesoría:\n"
                    f"1. Usa el sistema web en tu perfil\n"
                    f"2. O dime más detalles (materia, horario preferido, etc.)\n\n"
                    f"¿Te ayudo a buscar disponibilidad de profesores?"
                )
                safe_transcript = _mdv2_escape(transcript)
                safe_calendar_response = _mdv2_escape(calendar_response)
                response_text = f" _{safe_transcript}_\n\n{safe_calendar_response}"
                async with astage("telegram.tg_send"):
                    await _send_direct_message(chat_id, response_text)
                return

            # 6) Routing inteligente
            async with astage("telegram.intelligent_routing"):
                response = await intelligent_routing_system(asr_result, chat_id, agent_getter, mcp_client_getter, cache)

            safe_transcript = _mdv2_escape(transcript)
            safe_response = _mdv2_escape(response)
            response_text = f" _{safe_transcript}_\n\n {safe_response}"
            async with astage("telegram.tg_send"):
                await _send_direct_message(chat_id, response_text)
            return
        except Exception as e:
            log.error(f"Error procesando audio: {e}")
            await _send_direct_message(chat_id, " Error interno\\. Contacta soporte\\.")

    # =========================
    #  Webhook principal
    # =========================
    @router.post("/webhook")
    async def webhook(req: Request, session: AsyncSession = Depends(get_session_dep)):
        async with astage("telegram.total"):
            update = await req.json()
            update_id = update.get("update_id")

            if await _is_duplicate_update(update_id):
                log.info(f"Update {update_id} ya procesado - skipping")
                return {"ok": True}

            msg = update.get("message")
            cbq = update.get("callback_query")
            set_meta(source="telegram", update_id=update_id)

            try:
                if msg:
                    chat_id = msg.get("chat", {}).get("id")
                    text = (msg.get("text") or "").strip()
                    voice = msg.get("voice")
                    audio = msg.get("audio")
                    document = msg.get("document")

                    if chat_id:
                        set_meta(
                            chat_id=chat_id,
                            telegram_user_id=msg.get("from", {}).get("id"),
                            telegram_username=msg.get("from", {}).get("first_name", "Unknown")
                        )

                    # /start
                    if text.startswith("/start"):
                        parts = text.split(maxsplit=1)
                        if len(parts) > 1:
                            token = parts[1]
                            try:
                                link_account = LinkTelegramAccount(
                                    repo=SqlAlchemyTelegramRepo(session, cache)
                                )
                                success = await link_account.execute(
                                    token=token,
                                    telegram_user_id=msg["from"]["id"],
                                    chat_id=chat_id,
                                    username=msg["from"].get("username") or msg["from"].get("first_name")
                                )
                                if success:
                                    await bot.send_message(chat_id, _mdv2_escape("✅ Cuenta vinculada exitosamente!"))
                                else:
                                    await bot.send_message(chat_id, _mdv2_escape("⚠️ Token inválido o expirado"))
                            except Exception as e:
                                log.error(f"Error vinculando cuenta: {e}")
                                await bot.send_message(chat_id, _mdv2_escape("⚠️ Error interno"))
                        else:
                            await bot.send_message(chat_id, _mdv2_escape("Enviando: /start <token_de_vinculacion>"))
                        return {"ok": True}

                    # Audio / Voice → background
                    elif voice or audio:
                        audio_obj = voice or audio
                        file_id = audio_obj.get("file_id")
                        file_unique_id = audio_obj.get("file_unique_id")
                        if chat_id and file_id:
                            log.info(f"Iniciando background task audio: chat_id={chat_id}, file_id={file_id[:8]}...")
                            asyncio.create_task(_process_audio_background(chat_id, file_id, file_unique_id, audio_obj))
                        else:
                            log.warning(f"Audio sin chat_id o file_id: chat_id={chat_id}, file_id={file_id}")
                        return {"ok": True}

                    # Texto normal
                    elif text and chat_id:
                        text_lower = text.lower().strip()
                        words = text_lower.split()
                        # ⛔️ PRIORIDAD: si hay acción pendiente y el usuario dice confirmar/cancelar, ir directo a MCP
                        pending = await _get_pending_action(chat_id, cache)
                        if pending and (_is_confirmation_text(text_lower) or _is_cancellation_text(text_lower)):
                            mcp = mcp_client_getter() if mcp_client_getter else None
                            if not mcp:
                                await bot.send_message(chat_id, _mdv2_escape(" No puedo confirmar ahora mismo. Intenta de nuevo."))
                                return {"ok": True}

                            tool = pending.get("tool") or "create_calendar_event"
                            args = pending.get("args") or {}
                            args["confirm"] = _is_confirmation_text(text_lower)
                            args["idempotency_key"] = f"tg:{chat_id}:{int(time.time()*1000)}"

                            try:
                                result = await asyncio.wait_for(
                                    mcp.call_tool(tool, args, thread_id=f"tg:{chat_id}"),
                                    timeout=MCP_TIMEOUT_AGGRESSIVE
                                )
                                await _clear_pending_action(chat_id, cache)
                                text_result = result.get("message") if isinstance(result, dict) else str(result)
                                await bot.send_message(chat_id, _mdv2_escape(text_result or " Hecho."))
                            except asyncio.TimeoutError:
                                await bot.send_message(chat_id, _mdv2_escape(" No pude confirmar a tiempo. Intenta de nuevo."))
                            return {"ok": True}
                        # Respuestas instantáneas (sub-1s)
                        if len(words) <= 5:
                            if any(k in text_lower for k in ["hola", "hi", "buenas", "buenos días", "buenas tardes", "hello", "saludos"]):
                                quick_response = _mdv2_escape("¡Hola! Soy tu asistente de CINAP. ¿En qué puedo ayudarte hoy?")
                                await bot.send_message(chat_id, quick_response, disable_web_page_preview=True, allow_sending_without_reply=True)
                                return {"ok": True}
                            if any(k in text_lower for k in ["uct", "universidad católica", "católica temuco"]):
                                uct_response = _mdv2_escape(
                                    " UCT - Universidad Católica de Temuco \n\n"
                                    "La Universidad Católica de Temuco es una institución de educación superior tradicional privada, "
                                    "reconocida por su excelencia académica y compromiso con el desarrollo regional."
                                )
                                await bot.send_message(chat_id, uct_response, disable_web_page_preview=True, allow_sending_without_reply=True)
                                return {"ok": True}
                            if any(k in text_lower for k in ["cinap", "centro de innovación", "centro innovación aprendizaje", "centro de docencia", "centro de apoyo docente"]):
                                cinap_response = _mdv2_escape(
                                    " CINAP - Centro de Innovación en Aprendizaje, Docencia y Tecnología Educativa \n\n"
                                    "El CINAP acompaña pedagógicamente a los docentes de la UCT, fortaleciendo la enseñanza mediante "
                                    "asesorías en formación docente, educación digital, innovación en la docencia, investigación aplicada "
                                    "y experimentación pedagógica en entornos de laboratorio."
                                )
                                await bot.send_message(chat_id, cinap_response, disable_web_page_preview=True, allow_sending_without_reply=True)
                                return {"ok": True}
                            if any(k in text_lower for k in ["gracias", "thanks", "thank you", "muchas gracias"]):
                                thanks_response = _mdv2_escape("¡De nada! Estoy aquí para ayudarte. ¿Necesitas algo más?")
                                await bot.send_message(chat_id, thanks_response, disable_web_page_preview=True, allow_sending_without_reply=True)
                                return {"ok": True}
    

                        # (ANTES: GUARD de dominio estricto. AHORA: permitido)
                        if not _is_domain_related(text) and not _is_ack(text):
                            log.info("Mensaje de texto fuera de dominio (permitido por configuración relajada)")

                        # Agente
                        if not agent_getter:
                            await bot.send_message(chat_id, " Servicio no disponible")
                            return {"ok": True}
                        agent = agent_getter()
                        if not agent:
                            await bot.send_message(chat_id, " No se pudo obtener agente")
                            return {"ok": True}

                        try:
                            needs_mcp = _needs_mcp_tools(text)
                            timeout = 45 if needs_mcp else 20
                            async with astage("telegram.agent_fast"):
                                try:
                                    reply = await asyncio.wait_for(
                                        agent.invoke(text, thread_id=f"tg:{chat_id}"),
                                        timeout=timeout
                                    )
                                    reply = reply or " No tengo una respuesta para eso."
                                except asyncio.TimeoutError:
                                    log.warning(f"Agent timeout ({timeout}s) para texto: '{text[:30]}...'")
                                    reply = " La consulta está tomando más tiempo del esperado\\. Intenta con una pregunta más específica\\."
                                except Exception as e:
                                    log.error(f"Error en agent.invoke: {e}")
                                    if "maximum context length" in str(e):
                                        reply = " Tu consulta es muy larga o tienes mucho historial\\. Intenta con una pregunta más breve o empieza una nueva conversación\\."
                                    else:
                                        reply = " Error procesando tu consulta\\. Intenta de nuevo\\."

                            # En modo relajado no se fuerza dominio; _enforce_domain_reply será no-op
                            final_reply = _enforce_domain_reply(text, reply)
                            safe_reply_fast = _mdv2_escape(final_reply)

                            if len(safe_reply_fast) > 4000:
                                for part in _chunk(safe_reply_fast, 3900):
                                    await bot.send_message(
                                        chat_id, part,
                                        disable_web_page_preview=True, allow_sending_without_reply=True
                                    )
                            else:
                                await bot.send_message(
                                    chat_id, safe_reply_fast,
                                    disable_web_page_preview=True, allow_sending_without_reply=True
                                )
                        except Exception as e:
                            log.error(f"Error procesando texto: {e}")
                            await bot.send_message(chat_id, "⚠️ Error procesando mensaje")
                    return {"ok": True}

                # Callback Query
                if cbq:
                    chat_id = cbq.get("message", {}).get("chat", {}).get("id")
                    data = cbq.get("data")
                    if chat_id:
                        await bot.send_message(int(chat_id), f"Callback: {data}")
                    return {"ok": True}

                return {"ok": True}
            finally:
                await _mark_update_processed(update_id)
        return {"ok": True}

    router.close_clients = _close_shared_clients
    router.warmup_connections = _warmup_connections
    return router

# =========================
#  Extra: Intent detectors used above
# =========================
def _detect_calendar_event_intent(text: str) -> dict:
    if not text or not isinstance(text, str):
        return {"is_calendar_event": False}
    text_lower = text.lower().strip()
    calendar_patterns = [
        r'\b(agendar|programar|crear)\s+(una?\s+)?(cita|asesor[íi]a|reuni[óo]n|meeting|appointment)\b',
        r'\b(quiero|necesito|puedo)\s+(agendar|programar|una?\s+cita|una?\s+asesor[íi]a)\b',
        r'\b(asesor[íi]a|cita|reuni[óo]n|meeting)\s+(con|para|de)\b',
        r'\b(agenda|calendar|calendario)\b.*\b(evento|cita|asesor[íi]a)\b',
        r'\b(disponibilidad|horario)\s+(para|de)\s+(profesor|teacher|advisor)\b'
    ]
    detected_intent = None
    for i, pattern in enumerate(calendar_patterns):
        if re.search(pattern, text_lower):
            detected_intent = f"calendar_pattern_{i+1}"
            break
    if detected_intent:
        time_mentions = re.findall(r'\b(\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm)|mañana|tarde|hoy|mañana)\b', text_lower)
        person_mentions = re.findall(r'\bcon\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)*)', text, re.U)
        return {
            "is_calendar_event": True,
            "intent_type": detected_intent,
            "original_text": text,
            "time_mentions": time_mentions,
            "person_mentions": person_mentions,
            "confidence": 0.9 if len(time_mentions) > 0 or len(person_mentions) > 0 else 0.7
        }
    return {"is_calendar_event": False}

def _validate_transcript_authenticity(transcript: str) -> bool:
    if not transcript or not isinstance(transcript, str):
        return False
    cleaned = transcript.strip().lower()
    if len(cleaned) < 2:
        return False
    hallucination_phrases = [
        "el primer disco de la banda", "trabajo familia ciudad catedral", "ciudad de la ciudad de la",
        "se ha realizado en la ciudad", "gracias por su atención", "muchas gracias por la atención",
        "suscríbete al canal", "like si te gustó", "subtítulos realizados por", "traducción automática",
        "música instrumental", "música de fondo", "sonido ambiente", "ruido de fondo", "audio en inglés",
        "powered by", "created by", "developed by",
        "el primer paso en la historia de la serie fue el de la serie",
        "el primer paso de la serie fue el de la película el último día de la vida",
        "la serie de la serie", "fue el de la serie", "el paso de la historia", "paso en la historia de la serie"
    ]
    for phrase in hallucination_phrases:
        if phrase in cleaned:
            return False
    words = cleaned.split()
    if len(words) >= 3:
        if len(set(words)) <= 2:
            return False
        word_counts = {}
        for w in words:
            if len(w) > 2:
                word_counts[w] = word_counts.get(w, 0) + 1
        if word_counts and max(word_counts.values()) >= len(words) * 0.6:
            return False

    circular_patterns = [
        r"(.+) fue el de \1", r"(.+) de \1 de", r"el (.+) de la \1", r"(.+) en la (.+) de la \1"
    ]
    for pattern in circular_patterns:
        if re.search(pattern, cleaned):
            return False

    if len(cleaned) > 100 and len(words) > 15:
        return False

    small_words = ['el', 'la', 'de', 'en', 'fue', 'por', 'con', 'del', 'al']
    small_word_count = sum(1 for w in words if w in small_words)
    if len(words) > 3 and small_word_count >= len(words) * 0.7:
        return False

    if len(words) >= 6:
        first_two = ' '.join(words[:2])
        last_two = ' '.join(words[-2:])
        if first_two == last_two:
            return False
    return True
