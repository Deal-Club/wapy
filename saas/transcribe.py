"""Transcription des notes vocales (Whisper).

Deux modes, sans changement de code :
- AUTO-HÉBERGÉ (défaut) : faster-whisper tourne sur le serveur, aucun coût par usage.
  Modèle configurable via `WHISPER_MODEL` (défaut « small », bon en français).
- API (si `TRANSCRIBE_API_KEY` défini) : API compatible OpenAI (Groq/OpenAI).

Si la transcription échoue/indisponible, renvoie "" et le bot demande d'écrire.
"""
import io
import logging
import os

import requests

logger = logging.getLogger("wapy.transcribe")

_model = None


def _local_model():
    """Charge faster-whisper une seule fois (singleton)."""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        name = os.environ.get("WHISPER_MODEL", "small")
        _model = WhisperModel(name, device="cpu", compute_type="int8")
        logger.info("faster-whisper chargé (modèle %s)", name)
    return _model


def _transcribe_local(data: bytes) -> str:
    try:
        segments, _info = _local_model().transcribe(io.BytesIO(data), language="fr", vad_filter=True)
        return " ".join(seg.text for seg in segments).strip()
    except Exception as e:
        logger.error("Transcription locale échouée : %s", e)
        return ""


def _transcribe_api(data: bytes, mime: str, key: str) -> str:
    base = os.environ.get("TRANSCRIBE_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    model = os.environ.get("TRANSCRIBE_MODEL", "whisper-large-v3-turbo")
    m = (mime or "").lower()
    ext = "ogg" if "ogg" in m else ("mp3" if ("mp3" in m or "mpeg" in m) else ("wav" if "wav" in m else "m4a"))
    try:
        r = requests.post(
            f"{base}/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            files={"file": (f"audio.{ext}", data, mime or "audio/ogg")},
            data={"model": model, "language": "fr"},
            timeout=90,
        )
        if r.status_code == 200:
            return (r.json().get("text") or "").strip()
    except Exception as e:
        logger.error("Transcription API échouée : %s", e)
    return ""


def transcribe_audio(data: bytes, mime: str = "audio/ogg") -> str:
    if not data:
        return ""
    key = os.environ.get("TRANSCRIBE_API_KEY", "").strip()
    if key:
        return _transcribe_api(data, mime, key)
    return _transcribe_local(data)
