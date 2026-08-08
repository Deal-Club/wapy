"""Synchro Google Calendar par établissement (OAuth 2.0, refresh token / tenant).

Modèle « option B » : chaque établissement connecte SON propre agenda via un
consentement OAuth (bouton dans le dashboard). On stocke un `refresh_token` par
tenant ; aucune clé de compte de service (bloquée par la règle d'org Google
`iam.disableServiceAccountKeyCreation`). Les identifiants OAuth de l'application
(client id/secret) viennent de l'environnement.

Best-effort partout : si la synchro échoue, la réservation reste valable — le
calendrier n'est qu'un miroir.
"""
import os
from datetime import timedelta
from urllib.parse import urlencode

import requests

AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URI = "https://oauth2.googleapis.com/token"
REVOKE_URI = "https://oauth2.googleapis.com/revoke"
CAL_API = "https://www.googleapis.com/calendar/v3"
# calendar.events : lecture/écriture des événements, sans accès aux autres agendas.
SCOPE = "https://www.googleapis.com/auth/calendar.events"


def client_id() -> str:
    return os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "").strip()


def client_secret() -> str:
    return os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()


def enabled() -> bool:
    """La synchro est disponible seulement si l'opérateur a configuré l'app OAuth."""
    return bool(client_id() and client_secret())


def redirect_uri() -> str:
    base = os.environ.get("PUBLIC_URL", "").rstrip("/")
    return f"{base}/api/google/callback"


def auth_url(state: str) -> str:
    """URL de consentement Google à ouvrir pour l'établissement."""
    params = {
        "client_id": client_id(),
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",   # nécessaire pour recevoir un refresh_token
        "prompt": "consent",        # force un refresh_token neuf à chaque connexion
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_URI}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Échange le code d'autorisation contre les jetons (dont refresh_token)."""
    r = requests.post(TOKEN_URI, data={
        "code": code,
        "client_id": client_id(),
        "client_secret": client_secret(),
        "redirect_uri": redirect_uri(),
        "grant_type": "authorization_code",
    }, timeout=30)
    r.raise_for_status()
    return r.json() or {}


def access_token(refresh_token: str) -> str:
    """Un access_token frais à partir du refresh_token stocké."""
    if not refresh_token:
        return ""
    r = requests.post(TOKEN_URI, data={
        "refresh_token": refresh_token,
        "client_id": client_id(),
        "client_secret": client_secret(),
        "grant_type": "refresh_token",
    }, timeout=30)
    r.raise_for_status()
    return (r.json() or {}).get("access_token", "")


def primary_calendar(access_tok: str) -> dict:
    """Métadonnées du calendrier principal (son id = l'e-mail du compte)."""
    r = requests.get(
        f"{CAL_API}/calendars/primary",
        headers={"Authorization": f"Bearer {access_tok}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json() or {}


def _event_body(summary: str, start_utc, duration_min: int, description: str) -> dict:
    end_utc = start_utc + timedelta(minutes=int(duration_min or 30))
    # start/end sont stockés en UTC -> suffixe 'Z' (Google convertit à l'affichage).
    return {
        "summary": summary,
        "description": description or "",
        "start": {"dateTime": start_utc.strftime("%Y-%m-%dT%H:%M:%S") + "Z"},
        "end": {"dateTime": end_utc.strftime("%Y-%m-%dT%H:%M:%S") + "Z"},
    }


def create_event(refresh_token: str, calendar_id: str, summary: str,
                 start_utc, duration_min: int, description: str = "") -> str:
    """Crée un événement dans l'agenda de l'établissement. Renvoie l'id (ou '')."""
    tok = access_token(refresh_token)
    if not tok:
        return ""
    cal = calendar_id or "primary"
    r = requests.post(
        f"{CAL_API}/calendars/{cal}/events",
        headers={"Authorization": f"Bearer {tok}"},
        json=_event_body(summary, start_utc, duration_min, description),
        timeout=30,
    )
    r.raise_for_status()
    return (r.json() or {}).get("id", "")


def delete_event(refresh_token: str, calendar_id: str, event_id: str) -> None:
    """Supprime l'événement (à l'annulation d'un RDV). Best-effort."""
    if not event_id:
        return
    tok = access_token(refresh_token)
    if not tok:
        return
    cal = calendar_id or "primary"
    requests.delete(
        f"{CAL_API}/calendars/{cal}/events/{event_id}",
        headers={"Authorization": f"Bearer {tok}"},
        timeout=30,
    )


def revoke(refresh_token: str) -> None:
    """Révoque l'accès côté Google (à la déconnexion). Best-effort."""
    if not refresh_token:
        return
    try:
        requests.post(REVOKE_URI, data={"token": refresh_token}, timeout=15)
    except Exception:
        pass
