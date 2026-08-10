"""Client GeniusPay (paiements mobiles Wave / Orange / MTN + carte).

- create_payment : crée un paiement en mode « checkout » (le client choisit son
  moyen sur la page GeniusPay) et renvoie l'URL à envoyer au client.
- verify_webhook : valide la signature HMAC des notifications de paiement.

Multi-tenant : chaque établissement fournit ses propres clés (il encaisse).
"""
import hashlib
import hmac
import os

import requests

BASE_URL = os.environ.get("GENIUSPAY_BASE_URL", "https://geniuspay.ci/api/v1/merchant")


def create_payment(cfg, amount: int, description: str, customer: dict,
                   metadata: dict, success_url: str = "", error_url: str = "") -> dict:
    """Crée un paiement. `cfg` a .api_key / .api_secret. Renvoie {reference, url, status}."""
    body = {"amount": int(amount), "description": description[:500], "metadata": metadata or {}}
    if customer:
        body["customer"] = customer
    if success_url:
        body["success_url"] = success_url
    if error_url:
        body["error_url"] = error_url
    r = requests.post(
        f"{BASE_URL}/payments",
        headers={
            "X-API-Key": cfg.api_key,
            "X-API-Secret": cfg.api_secret,
            "Content-Type": "application/json",
        },
        json=body,
        # (connexion, lecture) : échoue vite si GeniusPay est injoignable, patiente
        # un peu plus pour la réponse. L'activation réelle passe de toute façon par le webhook.
        timeout=(5, 20),
    )
    r.raise_for_status()
    d = (r.json() or {}).get("data", {}) or {}
    return {
        "reference": d.get("reference", ""),
        "url": d.get("checkout_url") or d.get("payment_url", ""),
        "amount": d.get("amount", amount),
        "status": d.get("status", "pending"),
    }


def verify_webhook(secret: str, timestamp: str, raw_body: str, signature: str) -> bool:
    """Valide la signature HMAC-SHA256 d'un webhook GeniusPay.

    Tolérant aux deux schémas de la doc : HMAC(timestamp + '.' + body) et HMAC(body)."""
    if not secret or not signature:
        return False
    for data in (f"{timestamp}.{raw_body}", raw_body):
        exp = hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(exp, signature):
            return True
    return False
