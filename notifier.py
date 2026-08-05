"""Alertes Telegram pour l'opérateur Wapy (session tombée, avertissement de ban).
Silencieux si TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID absents. Ne lève jamais d'exception."""
import logging
import os
import socket

import requests

logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
HOSTNAME = socket.gethostname()
LEVELS_EMOJI = {"INFO": "ℹ️", "WARN": "⚠️", "CRITICAL": "🚨", "SUCCESS": "✅"}


def is_configured() -> bool:
    return bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID)


def notify(level: str, title: str, body: str = "") -> bool:
    if not is_configured():
        return False
    emoji = LEVELS_EMOJI.get(level, "")
    lines = [f"{emoji} *{title}*", f"_{HOSTNAME}_"]
    if body:
        lines += ["", body]
    text = "\n".join(lines)
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            data={"chat_id": TELEGRAM_CHAT_ID, "text": text[:4000], "parse_mode": "Markdown"},
            timeout=10,
        )
        if r.status_code == 200:
            return True
        logger.warning("Telegram HTTP %s: %s", r.status_code, r.text[:200])
    except Exception as e:
        logger.warning("Telegram notify failed: %s", e)
    return False
