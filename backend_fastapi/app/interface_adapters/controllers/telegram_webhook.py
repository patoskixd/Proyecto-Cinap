from __future__ import annotations
import os, time, logging, asyncio, hashlib, re
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
from app.interface_adapters.gateways.telegram.telegram_bot_gateways import TelegramBotGateway
from app.interface_adapters.gateways.db.sqlalchemy_telegram_repo import SqlAlchemyTelegramRepo
from app.observability.metrics import (
    astage, set_meta, new_request, finalize_and_log, setup_json_logger, _get_trace
)
from app.use_cases.telegram.link_account import LinkTelegramAccount
from app.frameworks_drivers.config.settings import (
    ASR_BASE_URL, ASR_MODEL_NAME, ASR_API_KEY, ASR_LANG,
)

from app.observability.metrics import astage, set_meta

log = logging.getLogger("telegram")
log.setLevel(logging.DEBUG)
BOT_TOKEN = os.environ["BOT_TOKEN"]

_BGLOGGER = setup_json_logger("telegram_bg", log_file="logs/telegram_bg.jsonl")


ENABLE_PAUSES = False

_telegram_client = None
_asr_client = None


async def _get_telegram_client():
    """Cliente HTTPx compartido para Telegram API"""
    global _telegram_client
    if _telegram_client is None:
        _telegram_client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=5.0),
            http2=True,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            headers={"User-Agent": "TelegramBot/1.0"}
        )
    return _telegram_client

async def _get_asr_client():
    """Cliente HTTP compartido para ASR"""
    global _asr_client
    if _asr_client is None:
        headers = {"Authorization": f"Bearer {ASR_API_KEY}"} if ASR_API_KEY and ASR_API_KEY.strip().upper() != "EMPTY" else {}
        _asr_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=5.0),
            http2=True,
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            headers=headers
        )
    return _asr_client

async def _warmup_connections():
    """Warm-up de conexiones HTTP/2"""
    try:
        async with astage("telegram.warmup"):
            tg_client = await _get_telegram_client()
            warmup_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"
            resp = await tg_client.get(warmup_url)
            
            if resp.status_code == 200:
                log.info("Telegram API warm-up exitoso")
            
            # Warm-up ASR API si está disponible
            if ASR_BASE_URL:
                asr_client = await _get_asr_client()
                try:
                    # Intentar healthcheck o endpoint básico
                    asr_resp = await asr_client.get(f"{ASR_BASE_URL.rstrip('/')}/v1/models")
                    if asr_resp.status_code < 500:
                        log.info("ASR API warm-up exitoso")
                except Exception:
                    log.info("ASR API warm-up completado endpoint no disponible")
                    
    except Exception as e:
        log.warning(f"Error en warm-up: {e}")

async def _close_shared_clients():
    """Cierra clientes HTTP compartidos"""
    global _telegram_client, _asr_client
    
    if _telegram_client:
        await _telegram_client.aclose()
        _telegram_client = None
    
    if _asr_client:
        await _asr_client.aclose() 
        _asr_client = None
    
    log.info("Clientes HTTP cerrados")

def _chunk(s: str, n: int = 4000):
    """Divide texto en chunks para Telegram"""
    for i in range(0, len(s), n):
        yield s[i:i+n]

def _mdv2_escape(s: str) -> str:
    """Escapa caracteres especiales para MarkdownV2 de Telegram"""
    if not s:
        return s
    

    s = s.replace("\\", "\\\\")
    

    specials = ('_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!')
    for ch in specials:
        s = s.replace(ch, f"\\{ch}")
    
    return s


async def _cache_get_asr_transcription(audio_hash: str, cache=None):
    """Obtiene transcripción desde cache Redis"""
    if not cache:
        return None
    try:
        key = f"asr_transcript:{audio_hash}"
        result = await cache.get(key)
        if result:
            transcript = result.decode('utf-8')
            log.info(f" ASR cache hit: {audio_hash[:8]}... -> '{transcript[:50]}{'...' if len(transcript) > 50 else ''}'")
            return transcript
    except Exception as e:
        log.warning(f"Error obteniendo ASR cache: {e}")
    return None

async def _cache_set_asr_transcription(audio_hash: str, transcript: str, cache=None):
    """Guarda transcripción en cache Redis"""
    if not cache or not transcript:
        return
    try:
        key = f"asr_transcript:{audio_hash}"
        await cache.set(key, transcript.encode('utf-8'), ttl_seconds=86400)  
        log.info(f"ASR cached en Redis: {audio_hash[:8]}... bytes={len(transcript.encode('utf-8'))}")
    except Exception as e:
        log.warning(f"Error guardando ASR en cache: {e}")

async def tg_get_file_path(file_id: str, file_unique_id: str, cache=None):
    """Obtiene file_path usando cache dual"""
    if not file_id:
        return None
    
    if cache:
        try:
            cache_key_primary = f"tg_file_path:{file_id}"
            cached_path = await cache.get(cache_key_primary)
            
            if not cached_path and file_unique_id:

                cache_key_secondary = f"tg_file_path_unique:{file_unique_id}"
                cached_path = await cache.get(cache_key_secondary)
                
                if cached_path:
                    await cache.set(cache_key_primary, cached_path, ttl_seconds=21600)  # 6h
            
            if cached_path:
                path = cached_path.decode('utf-8')
                log.info(f"File path cache hit: {file_id[:8]}... -> {path}")
                return path
                
        except Exception as e:
            log.warning(f"Error accediendo cache file_path: {e}")
    
    try:
        client = await _get_telegram_client()
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
        
        r = await client.post(url, json={"file_id": file_id})
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("result"):
                file_path = data["result"].get("file_path")
                if file_path and cache:
                    try:
                        path_bytes = file_path.encode('utf-8')
                        await cache.set(f"tg_file_path:{file_id}", path_bytes, ttl_seconds=21600)  # 6h
                        
                        if file_unique_id:
                            await cache.set(f"tg_file_path_unique:{file_unique_id}", path_bytes, ttl_seconds=86400)  # 24h
                        
                        log.info(f" File path cached: {file_id[:8]}... -> {file_path}")
                    except Exception as e:
                        log.warning(f"Error cacheando file_path: {e}")
                
                return file_path
        
        log.warning(f"Error obteniendo file_path: {r.status_code} - {r.text[:100]}")
        return None
        
    except Exception as e:
        log.error(f"Error en tg_get_file_path: {e}")
        return None

async def tg_download_file(file_path: str):
    """Descarga archivo desde Telegram"""
    if not file_path:
        return None
    
    try:
        client = await _get_telegram_client()
        download_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        
        r = await client.get(download_url)
        if r.status_code == 200:
            audio_bytes = r.content
            log.info(f" Audio descargado: {len(audio_bytes)} bytes desde {file_path}")
            return audio_bytes
        else:
            log.warning(f"Error descarga: {r.status_code}")
            return None
            
    except Exception as e:
        log.error(f"Error descargando: {e}")
        return None

def _validate_audio_metadata(audio_obj: dict) -> str:
    """FILTRO 1: Validación básica de metadatos - OPTIMIZADO para rechazar audio vacío más rápido"""
    try:
        duration = audio_obj.get("duration", 0)
        file_size = audio_obj.get("file_size", 0)
        
        # Rechazar audios muy cortos inmediatamente
        if duration and duration < 0.8:  # Menos de 0.8 segundos
            return "too_short"
        
        # Rechazar archivos muy pequeños (probable que estén vacíos)
        if file_size and file_size < 800:  # Menos de 800 bytes
            return "too_short"
        
        # Detectar patrones sospechosos: archivos grandes pero muy cortos (probable silencio)
        if duration and file_size:
            # Si el ratio bytes/segundo es muy alto, puede ser silencio comprimido
            bytes_per_second = file_size / duration
            if bytes_per_second > 50000:  # Más de 50KB por segundo es sospechoso
                return "suspicious_silence"
        
        # Rechazar audios que se sabe que son problemáticos
        if duration and duration > 60:  # Más de 1 minuto, rechazar inmediatamente
            return "too_long"
            
        return "good"
        
    except Exception:
        return "good"

def _validate_audio_energy(audio_bytes: bytes) -> str:
    """FILTRO 2: Análisis energético usando audioop.rms"""
    try:
        # Fast path: muy barato
        basic = _analyze_audio_quality_basic(audio_bytes)
        if basic in ("empty", "too_short"):
            return basic

        # Early exit por OGG muy pequeño
        if audio_bytes.startswith(b'OggS') and len(audio_bytes) < 2500:
            return "too_short"
        
        if audioop is None:
            return "good"  # ya pasó lo básico
        
        if not audio_bytes or len(audio_bytes) < 1000:
            return "too_short"
        
        # Convertir a WAV para análisis
        try:
            wav_bytes = _convert_to_wav_for_analysis(audio_bytes)
            if not wav_bytes or len(wav_bytes) < 1000:
                return "empty"
        except Exception:
            return _analyze_audio_quality_basic(audio_bytes)
        
        # Saltar header WAV (44 bytes)
        audio_data = wav_bytes[44:] if len(wav_bytes) > 44 else wav_bytes
        
        if len(audio_data) < 320:
            return "too_short"
        
        # Analizar energía en ventanas de 30ms - OPTIMIZADO con sampling para audios largos
        frame_size = 480 * 2  # 2 bytes por sample (16-bit)
        silence_frames = 0
        low_energy_frames = 0
        total_frames = 0
        max_rms = 0
        
        # Para audios muy largos, hacer sampling para acelerar la validación
        step = frame_size
        if len(audio_data) > 500000:  # Si el audio es muy largo (>500KB)
            step = frame_size * 3  # Muestrear cada 3 frames
        elif len(audio_data) > 200000:  # Audio mediano (>200KB)
            step = frame_size * 2  # Muestrear cada 2 frames
        
        for i in range(0, len(audio_data) - frame_size, step):
            frame = audio_data[i:i + frame_size]
            if len(frame) >= frame_size:
                try:
                    rms = audioop.rms(frame, 2)  # 2 = 16-bit samples
                    max_rms = max(max_rms, rms)
                    
                    if rms < 50:
                        silence_frames += 1
                    elif rms < 200:
                        low_energy_frames += 1
                    
                    total_frames += 1
                    
                    #  Early exit si detectamos silencio absoluto en las primeras muestras
                    if total_frames >= 10:  # Después de 10 frames (~300ms)
                        early_silence_ratio = silence_frames / total_frames
                        if early_silence_ratio > 0.95 and max_rms < 80:  # 95% silencio y muy bajo volumen
                            return "empty"  # Salir temprano
                            
                except Exception:
                    continue
        
        if total_frames == 0:
            return "too_short"
        
        # Calcular ratios
        silence_ratio = silence_frames / total_frames
        low_energy_ratio = (silence_frames + low_energy_frames) / total_frames
        
        # Criterios basados en duración estimada - para detectar vacíos más rápido
        estimated_duration = total_frames * 0.03  # 30ms por frame
        
        # Detectar audios completamente vacíos más rápido
        if max_rms < 150:  # Pico máximo extremadamente bajo 
            return "empty"
        
        if estimated_duration > 3.0:  # Audios largos (>3 segundos)
            if silence_ratio > 0.75:  # 75% silencio absoluto 
                return "empty"
            if low_energy_ratio > 0.85:  # 85% energía muy baja 
                return "empty"
            if max_rms < 500:  # Pico máximo bajo 
                return "empty"
        else:  # Audios cortos 
            if silence_ratio > 0.80:  
                return "empty"
            if low_energy_ratio > 0.90: 
                return "empty"
        
        return "good"
        
    except Exception:
        return _analyze_audio_quality_basic(audio_bytes)

def _convert_to_wav_for_analysis(audio_bytes: bytes) -> bytes:
    """Convierte audio a WAV para análisis energético"""
    try:
        return _audio_format(audio_bytes)
    except Exception:
        # Si ya es WAV, devolverlo
        if audio_bytes.startswith(b'RIFF') and b'WAVE' in audio_bytes[:20]:
            return audio_bytes
        raise Exception("No se puede convertir audio para análisis")

def _analyze_audio_quality_basic(audio_bytes: bytes) -> str:
    """Análisis básico de audio sin dependencias"""
    try:
        if not audio_bytes or len(audio_bytes) < 100:
            return "empty"
        
        if len(audio_bytes) < 1000:
            return "too_short"
        
        # Análisis de entropía en muestra
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

def _clean_transcript_text(transcript: str) -> str:
    """Limpia el texto transcrito removiendo caracteres problemáticos y escapes - VERSIÓN ULTRA AGRESIVA"""
    if not transcript:
        return transcript
    
    import re
    
    # PASO 1: Remover TODOS los backslashes primero
    transcript = transcript.replace('\\', '')
    
    # PASO 2: Remover caracteres problemáticos del ASR
    transcript = transcript.replace("|", "")  # Remover pipes
    transcript = transcript.replace("�", "")  # Remover caracteres de reemplazo
    transcript = transcript.replace("\x00", "")  # Remover null bytes
    
    # PASO 3: Remover caracteres de control y no imprimibles
    transcript = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', transcript)
    
    # PASO 4: Limpiar espacios múltiples
    transcript = re.sub(r'\s+', ' ', transcript)
    
    # PASO 5: Limpiar inicio y final agresivamente
    transcript = transcript.strip()
    transcript = transcript.strip('|')
    transcript = transcript.strip('\\')
    transcript = transcript.strip()
    
    return transcript

def _validate_transcript_authenticity(transcript: str) -> bool:
    """FILTRO 3: Validación post-ASR - detecta alucinaciones"""
    if not transcript or not isinstance(transcript, str):
        return False
    
    cleaned = transcript.strip().lower()
    if len(cleaned) < 2:
        return False
    
    # Patrones de alucinaciones comunes
    hallucination_phrases = [
        "el primer disco de la banda",
        "trabajo familia ciudad catedral", 
        "ciudad de la ciudad de la",
        "se ha realizado en la ciudad",
        "gracias por su atención",
        "muchas gracias por la atención",
        "suscríbete al canal",
        "like si te gustó",
        "subtítulos realizados por",
        "traducción automática",
        "música instrumental",
        "música de fondo",
        "sonido ambiente",
        "ruido de fondo",
        "audio en inglés",
        "powered by",
        "created by",
        "developed by",
        "el primer paso en la historia de la serie fue el de la serie",
        "el primer paso de la serie fue el de la película el último día de la vida",
        "la serie de la serie",
        "fue el de la serie",
        "el paso de la historia",
        "paso en la historia de la serie"
    ]
    
    for phrase in hallucination_phrases:
        if phrase in cleaned:
            return False
    
    # Repeticiones excesivas
    words = cleaned.split()
    if len(words) >= 3:
        if len(set(words)) <= 2:  # Muy pocas palabras únicas
            return False
        
        # Detectar repetición de palabra dominante
        word_counts = {}
        for word in words:
            if len(word) > 2:
                word_counts[word] = word_counts.get(word, 0) + 1
        
        if word_counts:
            max_count = max(word_counts.values())
            if max_count >= len(words) * 0.6:  # 60% de las palabras son la misma
                return False
    
    # Detectar patrones circulares redundantes
    circular_patterns = [
        r"(.+) fue el de \1",  # "la serie fue el de la serie"
        r"(.+) de \1 de",      # "la serie de la serie de"
        r"el (.+) de la \1",   # "el paso de la historia"
        r"(.+) en la (.+) de la \1"  # "paso en la historia de la serie"
    ]
    
    for pattern in circular_patterns:
        if re.search(pattern, cleaned):
            return False
    
    # Audio extremadamente corto con transcripción larga
    if len(cleaned) > 100 and len(words) > 15:
        return False
    
    # Validaciones adicionales para frases sin sentido
    # Detectar demasiados artículos/preposiciones
    small_words = ['el', 'la', 'de', 'en', 'fue', 'por', 'con', 'del', 'al']
    small_word_count = sum(1 for word in words if word in small_words)
    if len(words) > 3 and small_word_count >= len(words) * 0.7: 
        return False
    
    # Detectar frases que terminan igual que empiezan
    if len(words) >= 6:
        first_two = ' '.join(words[:2])
        last_two = ' '.join(words[-2:])
        if first_two == last_two:
            return False
    
    return True

# === CONVERSIÓN DE AUDIO ===
def _audio_format(audio_bytes: bytes) -> bytes:
    """Convierte el formato de audio para ASR"""
    import tempfile
    
    try:
        if ffmpeg is None:
            raise ImportError("ffmpeg no disponible")
        
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as src_tmp:
            src_tmp.write(audio_bytes)
            src_path = src_tmp.name
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as dst_tmp:
            dst_path = dst_tmp.name
        
        try:
            # Conversión: 16kHz mono WAV
            t = time.perf_counter()
            (
                ffmpeg
                .input(src_path)
                .output(dst_path, format='wav', acodec='pcm_s16le', ac=1, ar=16000)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            
            with open(dst_path, "rb") as f:
                converted_bytes = f.read()
            
            log.info(f"ffmpeg_convert_ms={round((time.perf_counter()-t)*1000,1)} in={len(audio_bytes)} out={len(converted_bytes)}")
            log.info(f"🎵 Audio convertido: {len(audio_bytes)} -> {len(converted_bytes)} bytes")
            return converted_bytes
            
        finally:
            # Limpiar archivos temporales
            for path in [src_path, dst_path]:
                try:
                    os.remove(path)
                except Exception:
                    pass
                    
    except ImportError:
        log.info("ffmpeg-python no disponible, usando audio original")
        return audio_bytes
    except Exception as e:
        log.warning(f"Error convirtiendo audio: {e}")
        return audio_bytes

async def _asr_fallback_wav(audio_bytes: bytes, filename: str, client, transcribe_url: str, base_data: dict) -> str | None:
    """Fallback a formato WAV"""
    try:
        wav_bytes = _audio_format(audio_bytes)
        
        files = {"file": (filename.replace('.ogg', '.wav'), wav_bytes, "audio/wav")}
        data = {**base_data}
        
        async with astage("telegram.asr_wav_fallback"):
            r = await client.post(transcribe_url, data=data, files=files)
        
        if r.status_code != 200:
            log.warning(f"ASR WAV fallback falló: {r.status_code}")
            return None
            
        try:
            j = r.json()
            transcript = j.get("text") or j.get("transcript") or j.get("result")
            if transcript:
                transcript = _clean_transcript_text(transcript)
            return transcript
        except Exception:
            return None
            
    except Exception as e:
        log.warning(f"Fallback WAV error: {e}")
        return None

async def asr_transcribe(audio_bytes: bytes, filename: str = "audio.ogg", cache=None) -> str | None:
    """Transcripción con cache Redis optimizada"""
    # PASO 1: Cache Redis con hash exacto
    audio_hash = hashlib.md5(audio_bytes).hexdigest()
    
    cached_transcript = await _cache_get_asr_transcription(audio_hash, cache)
    if cached_transcript:
        # Limpiar también el texto del caché en caso de que tenga escapes
        return _clean_transcript_text(cached_transcript)
    
    transcribe_url = f"{ASR_BASE_URL.rstrip('/')}/v1/audio/transcriptions"
    
    # PASO 2: Pre-procesar audio si es necesario
    try:
        if len(audio_bytes) > 1024 * 1024:  # >1MB
            log.info("Audio grande detectado, convirtiendo formato...")
            audio_bytes = _audio_format(audio_bytes)
    except Exception as e:
        log.warning(f"Error convirtiendo formato de audio: {e}")
    
    # PASO 3: Usar cliente HTTP reutilizable
    client = await _get_asr_client()
    
    # PASO 4: Preparar datos con MIME correcto
    mime = "audio/ogg"
    if audio_bytes[:4] == b"RIFF" and b"WAVE" in audio_bytes[:16]:
        mime = "audio/wav"
        
    files = {"file": (filename, audio_bytes, mime)}
    data = {
        "model": ASR_MODEL_NAME,
        "language": ASR_LANG,
        "temperature": "0.0",
        "response_format": "json",
    }

    try:
        # PASO 5: Request con fallback WAV
        async with astage("telegram.asr"):
            r = await client.post(transcribe_url, data=data, files=files)

        # Fallback WAV si es necesario
        if r.status_code >= 400:
            log.info(f"ASR falló con formato original ({r.status_code}), probando WAV...")
            return await _asr_fallback_wav(audio_bytes, filename, client, transcribe_url, data)

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
            return None
        
        # LIMPIAR TEXTO: Remover escapes y caracteres problemáticos
        transcript = _clean_transcript_text(transcript)
        
        # PASO 6: Cache resultado
        if transcript:
            await _cache_set_asr_transcription(audio_hash, transcript, cache)
        
        return transcript

    except Exception as e:
        log.warning(f"Error en transcripción: {e}")
        return None

def _needs_mcp_tools(text: str) -> bool:
    """Detecta si el texto necesita herramientas MCP"""
    text_lower = text.lower().strip()
    
    # Palabras clave de alta prioridad
    high_priority_keywords = [
        "crear evento", "agendar cita", "programar reunión", "nueva cita",
        "agregar evento", "crear reunión", "agendar evento"
    ]
    
    # Palabras clave de prioridad media
    medium_priority_keywords = [
        "calendario", "evento", "cita", "reunión", "agendar", "programar",
        "fecha", "horario", "agenda", "appointment"
    ]
    
    # Exclusiones
    exclusion_keywords = [
        "qué es", "explica", "define", "cuéntame", "dime sobre",
        "información sobre", "cómo funciona", "preguntar"
    ]
    
    # Verificar exclusiones primero
    for exclusion in exclusion_keywords:
        if exclusion in text_lower:
            return False
    
    # Verificar alta prioridad
    for keyword in high_priority_keywords:
        if keyword in text_lower:
            return True
            
    # Verificar prioridad media solo si sugiere acción
    action_indicators = ["quiero", "necesito", "voy a", "tengo que", "debo"]
    has_action = any(action in text_lower for action in action_indicators)
    
    if has_action:
        for keyword in medium_priority_keywords:
            if keyword in text_lower:
                return True
    
    return False

def make_telegram_router(*, cache=None, agent_getter=None, get_session_dep=get_session_dep):
    """Router optimizado para Telegram con funciones globales"""
    router = APIRouter(prefix="/telegram", tags=["telegram"])
    
    # Bot optimizado que usa el cliente compartido
    class OptimizedTelegramBot:
        def __init__(self):
            self.base = f"https://api.telegram.org/bot{BOT_TOKEN}"

        async def send_message(self, chat_id: int, text: str, 
                             disable_web_page_preview: bool = False,
                             allow_sending_without_reply: bool = False):
            client = await _get_telegram_client()
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
                    return response.json().get("result")  # Retorna solo el result, no todo el JSON
                else:
                    # Log del error para debugging
                    log.error(f" Telegram API error: status={response.status_code}, response={response.text[:200]}")
                    return None
            except Exception as e:
                log.error(f" HTTPx exception: {e}")
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

    # Función helper para envío directo (optimizado para velocidad)
    async def _send_direct_message(chat_id: int, text: str) -> None:
        """Envía mensaje directo sin intentar editar (máxima velocidad)"""
        await bot.send_message(chat_id, text, disable_web_page_preview=True, allow_sending_without_reply=True)


    async def _is_duplicate_update(update_id: int) -> bool:
        """Verifica si ya procesamos este update_id"""
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
        """Marca update_id como procesado"""
        if not cache or not update_id:
            return
        try:
            key = f"tg_update:{update_id}"
            await cache.set(key, b"1", ttl_seconds=3600)  # 1 hora
            log.debug(f" Update {update_id} marcado como procesado")
        except Exception as e:
            log.warning(f"Error marcando update: {e}")

    async def _process_audio_background(chat_id: int, file_id: str, file_unique_id: str, audio_obj: dict):
        """Procesamiento completo de audio en background"""
        log.info(f"🎙️ INICIO background task: chat_id={chat_id}, file_id={file_id[:8] if file_id else 'None'}...")
        rid = new_request()
        set_meta(source="telegram.bg", chat_id=chat_id, file_id=file_id, file_unique_id=file_unique_id)
        t0 = time.perf_counter()
        try:
            # Obtener agente
            if not agent_getter:
                log.error("No hay agent_getter configurado")
                return
            
            agent = agent_getter()
            if not agent:
                log.error("No se pudo obtener agente")
                return

            # Procesamiento directo sin mensajes intermedios (máxima velocidad)
            msg_id = None

            # 1. Validación de metadatos OPTIMIZADA
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

            # 2. Obtener file_path
            async with astage("telegram.get_file_path"):
                t = time.perf_counter()
                file_path = await tg_get_file_path(file_id, file_unique_id, cache)
                log.info(f"tg_getFile_ms={round((time.perf_counter()-t)*1000,1)} cache={'hit' if file_path else 'miss'}")
            if not file_path:
                log.error(f"No se pudo obtener file_path para audio {file_id[:8] if file_id else 'None'}")
                await _send_direct_message(chat_id, " Error obteniendo archivo de audio")
                return

            # 3. Descargar
            async with astage("telegram.download"):
                t = time.perf_counter()
                audio_bytes = await tg_download_file(file_path)
                log.info(f"tg_download_ms={round((time.perf_counter()-t)*1000,1)} bytes={len(audio_bytes) if audio_bytes else 0}")
            if not audio_bytes:
                await _send_direct_message(chat_id, " Error descargando audio")
                return

            # 4. Validación energética
            energy_result = _validate_audio_energy(audio_bytes)
            if energy_result != "good":
                if energy_result == "empty":
                    error_msg = " Audio vacío o muy silencioso\\. Intenta de nuevo\\."
                elif energy_result == "too_short":
                    error_msg = " Audio demasiado corto\\. Mínimo 1 segundo\\."
                else:
                    error_msg = " Audio no válido\\."
                
                log.info(f" Audio rechazado por energía: {energy_result} - {len(audio_bytes)} bytes")
                await _send_direct_message(chat_id, error_msg)
                return

            # 5. ASR (directo sin mensaje de progreso)
            
            async with astage("telegram.asr"):
                t = time.perf_counter()
                transcript = await asr_transcribe(audio_bytes, filename=os.path.basename(file_path), cache=cache)
                log.info(f"asr_total_ms={round((time.perf_counter()-t)*1000,1)} ok={bool(transcript)}")
            if not transcript:
                log.info(f" ASR no retornó transcripción para audio de {len(audio_bytes)} bytes")
                await _send_direct_message(chat_id, "🎤 Audio vacío o no detecté mensaje\\. Intenta hablar más claro\\.")
                return

            # 6. Validación de alucinaciones
            if not _validate_transcript_authenticity(transcript):
                log.info(f" Transcripción rechazada por alucinación: '{transcript[:50]}...'")
                await _send_direct_message(chat_id, "🎤 Audio no claro o con ruido\\. Intenta de nuevo\\.")
                return

            # 7. Procesamiento con agente (directo)
            safe_transcript = _mdv2_escape(transcript)

            async with astage("telegram.agent"):
                reply = await agent.invoke(transcript, thread_id=f"tg:{chat_id}")
                reply = reply or " No tengo una respuesta para eso."
                safe_reply = _mdv2_escape(reply)

            # 8. Respuesta final (solo envío directo, sin edición)
            response_text = f"🗣️ _{safe_transcript}_\n\n💬 {safe_reply}"
            
            if len(response_text) > 4000:
                # Mensaje de transcripción primero
                async with astage("telegram.tg_send"):
                    await bot.send_message(
                        chat_id, 
                        f"🗣️ _{safe_transcript}_",
                        disable_web_page_preview=True,
                        allow_sending_without_reply=True
                    )
                # Luego chunks de la respuesta
                for part in _chunk(safe_reply, 3900):  # ya escapado
                    async with astage("telegram.tg_send"):
                        await bot.send_message(
                            chat_id, 
                            f"💬 {part}",
                            disable_web_page_preview=True,
                            allow_sending_without_reply=True
                        )
            else:
                # Respuesta completa de una vez
                async with astage("telegram.tg_send"):
                    await bot.send_message(
                        chat_id, 
                        response_text,
                        disable_web_page_preview=True,
                        allow_sending_without_reply=True
                    )

        except Exception as e:
            log.error(f"Error en procesamiento background: {e}")
            try:
                await bot.send_message(chat_id, " Error procesando audio")
            except Exception:
                pass
        finally:
            total_ms = round((time.perf_counter()-t0)*1000, 1)
            log.info(f"telegram_bg_total_ms={total_ms}")
            base = {
                "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime()),
                "kind": "telegram_background",
                "chat_id": chat_id,
            }
            finalize_and_log(_BGLOGGER, base)

    # === WEBHOOK PRINCIPAL ===
    @router.post("/webhook")
    async def webhook(req: Request, session: AsyncSession = Depends(get_session_dep)):
        async with astage("telegram.total"):
            update = await req.json()
            update_id = update.get("update_id")

            # IDEMPOTENCIA
            if await _is_duplicate_update(update_id):
                log.info(f" Update {update_id} ya procesado - skipping")
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

                    # 1) Comando /start
                    if text.startswith("/start"):
                        parts = text.split(maxsplit=1)
                        if len(parts) > 1:
                            token = parts[1]
                            try:
                                link_account = LinkTelegramAccount(
                                    telegram_repo=SqlAlchemyTelegramRepo(session),
                                    bot=bot
                                )
                                success = await link_account(
                                    token=token,
                                    telegram_user_id=msg["from"]["id"],
                                    chat_id=chat_id
                                )
                                
                                if success:
                                    async with astage("telegram.tg_send"):
                                        await bot.send_message(chat_id, "✅ Cuenta vinculada exitosamente!")
                                else:
                                    async with astage("telegram.tg_send"):
                                        await bot.send_message(chat_id, "❌ Token inválido o expirado")
                            except Exception as e:
                                log.error(f"Error vinculando cuenta: {e}")
                                async with astage("telegram.tg_send"):
                                    await bot.send_message(chat_id, "❌ Error interno")
                        else:
                            async with astage("telegram.tg_send"):
                                await bot.send_message(chat_id, "Envía: /start <token_de_vinculacion>")
                        return {"ok": True}

                    # 2) Audio/Voice - Procesamiento en background
                    elif voice or audio:
                        audio_obj = voice or audio
                        file_id = audio_obj.get("file_id")
                        file_unique_id = audio_obj.get("file_unique_id")
                        
                        if chat_id and file_id:
                            # Procesar en background sin bloquear
                            log.info(f" Iniciando background task para audio: chat_id={chat_id}, file_id={file_id[:8]}...")
                            asyncio.create_task(_process_audio_background(chat_id, file_id, file_unique_id, audio_obj))
                        else:
                            log.warning(f" Audio sin chat_id o file_id: chat_id={chat_id}, file_id={file_id}")
                        
                        return {"ok": True}

                    # 3) Texto normal
                    elif text and chat_id:
                        if not agent_getter:
                            async with astage("telegram.tg_send_fast"):
                                await bot.send_message(chat_id, "❌ Servicio no disponible")
                            return {"ok": True}
                        
                        agent = agent_getter()
                        if not agent:
                            async with astage("telegram.tg_send_fast"):
                                await bot.send_message(chat_id, "❌ No se pudo obtener agente")
                            return {"ok": True}
                        
                        try:
                            async with astage("telegram.agent_fast"):
                                reply = await agent.invoke(text, thread_id=f"tg:{chat_id}")
                                reply = reply or " No tengo una respuesta para eso."
                                safe_reply_fast = _mdv2_escape(reply)
                            
                            if len(safe_reply_fast) > 4000:
                                for part in _chunk(safe_reply_fast, 3900):  # ya escapado
                                    async with astage("telegram.tg_send_fast"):
                                        await bot.send_message(
                                            chat_id, 
                                            part,
                                            disable_web_page_preview=True,
                                            allow_sending_without_reply=True
                                        )
                            else:
                                async with astage("telegram.tg_send_fast"):
                                    await bot.send_message(
                                        chat_id, 
                                        safe_reply_fast,
                                        disable_web_page_preview=True,
                                        allow_sending_without_reply=True
                                    )
                        
                        except Exception as e:
                            log.error(f"Error procesando texto: {e}")
                            async with astage("telegram.tg_send_fast"):
                                await bot.send_message(chat_id, "❌ Error procesando mensaje")
                
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
            
            finally:
                # Marcar update como procesado
                await _mark_update_processed(update_id)
        
        return {"ok": True}

    # Funciones para exportar
    router.close_clients = _close_shared_clients
    router.warmup_connections = _warmup_connections
    
    return router