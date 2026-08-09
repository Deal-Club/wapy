"""Vérification reCAPTCHA v3 (invisible) pour le chat du widget web.

Protège l'endpoint public /api/widget/chat contre les bots/scrapers qui
voudraient abuser du site d'un client pour surcharger l'outil. Score-based et
invisible (pas de casse-tête pour le visiteur).

Optionnel : sans clés (RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET) la vérification est
neutralisée et seule la limitation de débit s'applique — l'outil reste fonctionnel.
"""
import os

import requests

VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
MIN_SCORE = 0.5


def site_key() -> str:
    return os.environ.get("RECAPTCHA_SITE_KEY", "").strip()


def _secret() -> str:
    return os.environ.get("RECAPTCHA_SECRET", "").strip()


def enabled() -> bool:
    return bool(site_key() and _secret())


def verify(token: str, remoteip: str = "") -> bool:
    """True si le jeton reCAPTCHA est valide (ou si la protection est désactivée)."""
    if not enabled():
        return True  # non configuré -> on ne bloque pas (rate-limit prend le relais)
    if not token:
        return False
    data = {"secret": _secret(), "response": token}
    if remoteip:
        data["remoteip"] = remoteip
    try:
        r = requests.post(VERIFY_URL, data=data, timeout=10)
        d = r.json() or {}
    except Exception:
        return True  # panne Google -> ne pas bloquer les vrais visiteurs
    if not d.get("success"):
        return False
    score = d.get("score")
    return score is None or float(score) >= MIN_SCORE
