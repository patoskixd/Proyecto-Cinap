
from __future__ import annotations
import json
import time
import logging
from pathlib import Path
from collections import defaultdict
from statistics import mean, median
from datetime import datetime
from typing import Dict, List, Any, Optional

from .metrics import setup_json_logger

class TelegramAnalyzer:
    """Analizador de métricas de Telegram integrado en observabilidad"""
    
    def __init__(self, log_file: str = "logs/timings.jsonl"):
        self.log_file = Path(log_file)
        self.logger = setup_json_logger("telegram_analyzer", log_file="logs/telegram_analysis.jsonl")
    
    def analyze_recent_performance(self, hours_back: int = 24) -> Dict[str, Any]:
        """Analiza el rendimiento de Telegram de las últimas horas"""
        
        if not self.log_file.exists():
            return {"error": f"Log file not found: {self.log_file}"}
        
        cutoff_time = time.time() - (hours_back * 3600)
        audio_requests = []
        text_requests = []
        
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line.strip())
                    
                    meta = data.get('meta', {})
                    if meta.get('source') != 'telegram':
                        continue
                    
                    ts = data.get('ts_unix', 0)
                    if ts and ts < cutoff_time:
                        continue
                    
                
                    breakdown = data.get('telegram_breakdown_ms', {})
                    total_ms = data.get('total_elapsed_ms', 0)
                    
                    if not breakdown or not total_ms:
                        continue
                    
                    is_audio = any(stage in breakdown for stage in ['asr', 'download', 'get_file_path'])
                    
                    request_info = {
                        'timestamp': ts or time.time(),
                        'total_ms': total_ms,
                        'breakdown': breakdown,
                        'user_id': meta.get('telegram_user_id'),
                        'chat_id': meta.get('chat_id'),
                        'request_id': data.get('request_id')
                    }
                    
                    if is_audio:
                        audio_requests.append(request_info)
                    else:
                        text_requests.append(request_info)
                        
                except (json.JSONDecodeError, KeyError):
                    continue
        
        analysis = self._generate_analysis(audio_requests, text_requests, hours_back)
        
        self.logger.info({
            "analysis_type": "telegram_performance",
            "period_hours": hours_back,
            "timestamp": time.time(),
            **analysis
        })
        
        return analysis
    
    def _generate_analysis(self, audio_requests: List[Dict], text_requests: List[Dict], hours: int) -> Dict[str, Any]:
        """Genera el análisis estadístico de los requests"""
        
        analysis = {
            "period_hours": hours,
            "total_requests": len(audio_requests) + len(text_requests),
            "audio_requests": len(audio_requests),
            "text_requests": len(text_requests)
        }
        
        if audio_requests:
            audio_times = [req['total_ms'] for req in audio_requests]
            analysis["audio_performance"] = {
                "count": len(audio_requests),
                "avg_ms": round(mean(audio_times), 1),
                "median_ms": round(median(audio_times), 1),
                "min_ms": round(min(audio_times), 1),
                "max_ms": round(max(audio_times), 1),
                "avg_seconds": round(mean(audio_times) / 1000, 2)
            }
            
            stage_analysis = defaultdict(list)
            for req in audio_requests:
                for stage, time_ms in req['breakdown'].items():
                    stage_analysis[stage].append(time_ms)
            
            analysis["audio_stage_breakdown"] = {}
            for stage, times in stage_analysis.items():
                analysis["audio_stage_breakdown"][stage] = {
                    "avg_ms": round(mean(times), 1),
                    "max_ms": round(max(times), 1),
                    "min_ms": round(min(times), 1)
                }
        
        if text_requests:
            text_times = [req['total_ms'] for req in text_requests]
            analysis["text_performance"] = {
                "count": len(text_requests),
                "avg_ms": round(mean(text_times), 1),
                "median_ms": round(median(text_times), 1),
                "avg_seconds": round(mean(text_times) / 1000, 2)
            }
        
        analysis["performance_issues"] = self._detect_issues(audio_requests, text_requests)
        
        return analysis
    
    def _detect_issues(self, audio_requests: List[Dict], text_requests: List[Dict]) -> List[str]:
        """Detecta problemas potenciales de performance"""
        issues = []
        optimizations = []
        
        if audio_requests:
            audio_times = [req['total_ms'] for req in audio_requests]
            avg_audio = mean(audio_times)
            if avg_audio > 6000:
                issues.append(f"Audio lento: {avg_audio/1000:.1f}s promedio (meta: <3s)")
            elif avg_audio < 4000:
                optimizations.append(f"Audio optimizado: {avg_audio/1000:.1f}s promedio ")
            stage_totals = defaultdict(list)
            for req in audio_requests:
                for stage, time_ms in req['breakdown'].items():
                    stage_totals[stage].append(time_ms)
            
            for stage, times in stage_totals.items():
                avg_time = mean(times)
                if stage == 'asr' and avg_time > 1500:
                    issues.append(f"ASR lento: {avg_time:.0f}ms (revisar cache/servicio)")
                elif stage == 'download' and avg_time > 1000:
                    issues.append(f"Descarga lenta: {avg_time:.0f}ms (revisar conectividad)")
                elif stage in ['tg_send', 'tg_send_immediate'] and avg_time > 2000:
                    issues.append(f"Envío lento: {avg_time:.0f}ms (revisar API Telegram)")
                elif stage.endswith('_bg_optimized'):
                    optimizations.append(f"Background optimizado: {stage} {avg_time:.0f}ms ⚡")
        
        if text_requests:
            text_times = [req['total_ms'] for req in text_requests]
            avg_text = mean(text_times)
            if avg_text > 2000:
                issues.append(f"Texto lento: {avg_text/1000:.1f}s promedio (meta: <1s)")
            elif avg_text < 1000:
                optimizations.append(f"Texto optimizado: {avg_text/1000:.1f}s promedio ")
            
            # Detectar uso innecesario de MCP
            fast_requests = [req for req in text_requests if 'agent_fast' in str(req.get('breakdown', {}))]
            if fast_requests:
                optimizations.append(f"Respuestas rápidas detectadas: {len(fast_requests)} sin MCP ")
        
        result = []
        if optimizations:
            result.extend(optimizations)
        if issues:
            result.extend(issues)
        if not result:
            result.append("Performance estable - sin problemas detectados")
        
        return result

def log_telegram_analysis(hours_back: int = 24) -> Dict[str, Any]:
    """Función de conveniencia para ejecutar análisis y loggearlo"""
    analyzer = TelegramAnalyzer()
    return analyzer.analyze_recent_performance(hours_back)

def log_performance_summary():
    """Loggea un resumen de performance para monitoreo automático"""
    analyzer = TelegramAnalyzer()
    daily_analysis = analyzer.analyze_recent_performance(24)
    hourly_analysis = analyzer.analyze_recent_performance(1)
    
    summary_logger = setup_json_logger("telegram_summary", log_file="logs/telegram_summary.jsonl")
    summary_logger.info({
        "type": "performance_summary",
        "timestamp": time.time(),
        "daily": daily_analysis,
        "hourly": hourly_analysis
    })
    
    return {
        "daily": daily_analysis,
        "hourly": hourly_analysis
    }