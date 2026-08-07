"""Transcription des notes vocales (Whisper via une API compatible OpenAI).

Activée si `TRANSCRIBE_API_KEY` est défini (ex. Groq — rapide et bon marché, ou
OpenAI). Sinon la fonction renvoie "" et le bot demande poliment au client d'écrire.
Aucun changement de code pour l'activer : il suffit de fournir la clé en variable
d'environnement.
"""
import os

import requests


def transcribe_audio(data: bytes, mime: str = "audio/ogg") -> str:
    key = os.environ.get("TRANSCRIBE_API_KEY", "").strip()
    if not key or not data:
        return ""
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
    except Exception:
        pass
    return ""
