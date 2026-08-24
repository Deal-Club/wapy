"""WAHA multi-sessions : une session WhatsApp par tenant.

`session_name(tenant) = "t{id}"`. Le webhook résout le tenant depuis la session.
Les appels réseau (start/qr/status) sont utilisés par l'onboarding (P2).
"""
import os

import requests

from channel.waha import WahaProvider
from saas import models

WAHA_BASE_URL = os.environ.get("WAHA_BASE_URL", "http://localhost:3000")
WAHA_API_KEY = os.environ.get("WHATSAPP_API_KEY", "").strip()


def session_name(tenant_id: int) -> str:
    return f"t{tenant_id}"


def channel_for(tenant) -> WahaProvider:
    return WahaProvider(WAHA_BASE_URL, session_name(tenant.id), WAHA_API_KEY)


# --- Pont développeurs : instance WAHA distincte ----------------------------
#
# Séparée de celle des assistants, et pas seulement par principe. Un développeur
# qui pousse du volume ne doit pas pouvoir dégrader le bot d'un client qui paie,
# et un incident sur l'une des deux instances ne doit pas toucher l'autre.
# En développement, faute des deux variables, tout retombe sur l'instance unique.
WAHA_PONT_BASE_URL = os.environ.get("WAHA_PONT_BASE_URL", "").strip() or WAHA_BASE_URL
WAHA_PONT_API_KEY = os.environ.get("WHATSAPP_PONT_API_KEY", "").strip() or WAHA_API_KEY


def channel_pont(sname: str) -> WahaProvider:
    """Canal d'une session de pont. Ne suit pas la convention `t{id}` des tenants."""
    return WahaProvider(WAHA_PONT_BASE_URL, sname, WAHA_PONT_API_KEY)


def pont_isole() -> bool:
    """Vrai si le pont tourne bien sur son instance dédiée (contrôle d'exploitation)."""
    return WAHA_PONT_BASE_URL != WAHA_BASE_URL


def _entetes_pont() -> dict:
    return {"X-Api-Key": WAHA_PONT_API_KEY} if WAHA_PONT_API_KEY else {}


def demarrer_session_pont(sname: str, webhook_url: str) -> None:
    """Démarre une session sur l'instance du pont, à zéro.

    Pas de store NOWEB ici, contrairement aux assistants : le pont n'a pas à
    résoudre les @lid puisqu'il ne reconnaît personne et ne répond à personne.
    Moins d'état conservé, moins de mémoire, moins de données au repos.
    """
    try:
        requests.delete(f"{WAHA_PONT_BASE_URL}/api/sessions/{sname}",
                        headers=_entetes_pont(), timeout=15)
    except Exception:
        pass
    requests.post(
        f"{WAHA_PONT_BASE_URL}/api/sessions",
        json={
            "name": sname,
            "start": True,
            "config": {
                "webhooks": [{"url": webhook_url, "events": ["message", "session.status"]}],
                "client": {"deviceName": "Wapy Pont", "browserName": "Wapy"},
            },
        },
        headers=_entetes_pont(),
        timeout=30,
    )


def qr_pont(sname: str) -> bytes:
    r = requests.get(f"{WAHA_PONT_BASE_URL}/api/{sname}/auth/qr?format=image",
                     headers=_entetes_pont(), timeout=30)
    r.raise_for_status()
    return r.content


def etat_pont(sname: str) -> str:
    try:
        r = requests.get(f"{WAHA_PONT_BASE_URL}/api/sessions/{sname}",
                         headers=_entetes_pont(), timeout=15)
        if r.status_code == 404:
            return "STOPPED"
        r.raise_for_status()
        return (r.json() or {}).get("status") or "UNKNOWN"
    except Exception:
        return "UNKNOWN"


def tenant_for_session(session, sname: str):
    """Résout le tenant depuis le nom de session WAHA (table WaSession, sinon 't{id}')."""
    row = session.query(models.WaSession).filter_by(session_name=sname).first()
    if row:
        return session.get(models.Tenant, row.tenant_id)
    if sname.startswith("t") and sname[1:].isdigit():
        return session.get(models.Tenant, int(sname[1:]))
    return None


def _headers() -> dict:
    return {"X-Api-Key": WAHA_API_KEY} if WAHA_API_KEY else {}


def _delete_session(sname: str) -> None:
    for method, path in (("post", f"/api/sessions/{sname}/stop"), ("delete", f"/api/sessions/{sname}")):
        try:
            getattr(requests, method)(f"{WAHA_BASE_URL}{path}", headers=_headers(), timeout=15)
        except Exception:
            pass


def start_session(tenant, webhook_url: str) -> None:
    """Démarre une session WhatsApp propre (repart de zéro pour éviter l'état FAILED
    / le 422 'already exists', et permettre de lier un autre numéro)."""
    sname = session_name(tenant.id)
    _delete_session(sname)
    requests.post(
        f"{WAHA_BASE_URL}/api/sessions",
        json={
            "name": sname,
            "start": True,
            "config": {
                "webhooks": [{"url": webhook_url, "events": ["message", "session.status"]}],
                # Nom affiché dans « Appareils connectés » de WhatsApp (branding).
                # Supporté par WAHA >= 2025.12 ; ignoré par les versions plus anciennes.
                "client": {"deviceName": "Wapy", "browserName": "Wapy"},
                # Store NOWEB : nécessaire pour résoudre @lid -> numéro (reconnaissance
                # auto du personnel). WAHA attend `full_sync` (snake_case) selon la version ;
                # on met les deux orthographes par sécurité. Cf. resolve_lid.
                "noweb": {"store": {"enabled": True, "fullSync": True, "full_sync": True}},
            },
        },
        headers=_headers(),
        timeout=30,
    )


def get_qr(tenant) -> bytes:
    sname = session_name(tenant.id)
    r = requests.get(
        f"{WAHA_BASE_URL}/api/{sname}/auth/qr?format=image", headers=_headers(), timeout=30
    )
    r.raise_for_status()
    return r.content


def list_sessions() -> list[dict]:
    """Liste toutes les sessions WAHA et leur statut (pour la supervision)."""
    r = requests.get(f"{WAHA_BASE_URL}/api/sessions", headers=_headers(), timeout=20)
    r.raise_for_status()
    data = r.json()
    return data if isinstance(data, list) else []


def get_status(tenant) -> str:
    sname = session_name(tenant.id)
    r = requests.get(
        f"{WAHA_BASE_URL}/api/sessions/{sname}", headers=_headers(), timeout=15
    )
    r.raise_for_status()
    return r.json().get("status", "UNKNOWN")


def logout(tenant) -> None:
    """Déconnecte et supprime la session WhatsApp du tenant (pour en lier une autre)."""
    sname = session_name(tenant.id)
    for method, path in (
        ("post", f"/api/sessions/{sname}/logout"),
        ("post", f"/api/sessions/{sname}/stop"),
        ("delete", f"/api/sessions/{sname}"),
    ):
        try:
            getattr(requests, method)(
                f"{WAHA_BASE_URL}{path}", headers=_headers(), timeout=15
            )
        except Exception:
            pass
