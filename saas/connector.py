"""Connecteur vers la base de l'établissement (endpoint HTTP read-only).

Modèle de sécurité (décidé à dessein) :
- On ne se connecte JAMAIS directement à une base SQL du client. L'établissement
  expose un endpoint HTTP (souvent une petite route sur SON logiciel de gestion)
  qui renvoie du JSON pour une requête donnée. Ça évite d'ouvrir sa base sur
  Internet et de stocker des identifiants de base chez nous.
- Le token d'accès est chiffré au repos (Fernet, clé opérateur en variable d'env
  WAPY_FERNET_KEY). Un dump de notre base ne révèle pas le token.
- Appels sortants durcis : HTTPS obligatoire, garde anti-SSRF (IP privées/loopback
  bloquées), timeout court, taille de réponse plafonnée, GET uniquement.
- Jamais exposé au navigateur : le fetch est fait côté serveur, le token ne quitte
  pas le backend.
"""
import ipaddress
import os
import socket
from urllib.parse import urlparse, urlencode

import requests

TIMEOUT = 8
MAX_BYTES = 20_000  # plafond de réponse injectée dans le prompt


# --- Chiffrement du token au repos (Fernet) ---
def _fernet():
    key = os.environ.get("WAPY_FERNET_KEY", "").strip()
    if not key:
        return None
    try:
        from cryptography.fernet import Fernet
        return Fernet(key.encode())
    except Exception:
        return None


def encryption_ready() -> bool:
    return _fernet() is not None


def encrypt(plain: str) -> str:
    f = _fernet()
    if not f or not plain:
        return ""
    return f.encrypt(plain.encode()).decode()


def decrypt(cipher: str) -> str:
    f = _fernet()
    if not f or not cipher:
        return ""
    try:
        return f.decrypt(cipher.encode()).decode()
    except Exception:
        return ""


# --- Garde anti-SSRF ---
def _is_public_host(host: str) -> bool:
    """True si l'hôte résout uniquement vers des IP publiques (bloque loopback,
    liens locaux, IP privées, réservées) — anti-SSRF."""
    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return False
    if not infos:
        return False
    for info in infos:
        ip = info[4][0]
        try:
            addr = ipaddress.ip_address(ip)
        except ValueError:
            return False
        if (addr.is_private or addr.is_loopback or addr.is_link_local
                or addr.is_reserved or addr.is_multicast or addr.is_unspecified):
            return False
    return True


def validate_url(url: str) -> tuple[bool, str]:
    """Valide une URL de connecteur (HTTPS + hôte public). Renvoie (ok, raison)."""
    try:
        p = urlparse((url or "").strip())
    except Exception:
        return (False, "URL invalide")
    if p.scheme != "https":
        return (False, "L'URL doit être en HTTPS")
    if not p.hostname:
        return (False, "Hôte manquant")
    if not _is_public_host(p.hostname):
        return (False, "Hôte non autorisé (adresse privée/interne bloquée)")
    return (True, "")


def fetch(url: str, header_name: str, token: str, query: str) -> str:
    """Interroge l'endpoint de l'établissement avec `query`. Renvoie du texte
    (JSON brut tronqué) prêt à injecter dans le prompt. Best-effort et durci."""
    ok, reason = validate_url(url)
    if not ok:
        return f"(connecteur indisponible : {reason})"
    headers = {"Accept": "application/json"}
    if header_name and token:
        headers[header_name] = token
    sep = "&" if urlparse(url).query else "?"
    full = f"{url}{sep}{urlencode({'q': query or ''})}"
    try:
        r = requests.get(full, headers=headers, timeout=TIMEOUT, stream=True,
                         allow_redirects=False)
        if r.status_code >= 400:
            return f"(la base a répondu {r.status_code})"
        body = r.raw.read(MAX_BYTES + 1, decode_content=True) or b""
    except Exception:
        return "(recherche impossible : la base n'a pas répondu)"
    text = body[:MAX_BYTES].decode("utf-8", "replace").strip()
    if len(body) > MAX_BYTES:
        text += "\n… (résultat tronqué)"
    return text or "(aucun résultat)"


def lookup_fn_for(dc) -> callable:
    """Construit la fonction de recherche pour un DataConnector (row) donné.
    Renvoie None si le connecteur est absent/désactivé."""
    if not dc or not dc.enabled or not dc.url:
        return None
    token = decrypt(dc.token_enc or "")

    def _fn(query: str) -> str:
        return fetch(dc.url, dc.header_name or "Authorization", token, query)

    return _fn


def fiche_note(dc) -> str:
    """Section « ## Données en direct » à injecter dans la fiche quand le connecteur
    est actif, pour que le cerveau sache qu'il peut interroger la base."""
    if not dc or not dc.enabled or not dc.url:
        return ""
    what = (dc.note or "").strip() or "informations de l'établissement (stock, produits, prix)"
    return (
        "\n\n## Données en direct\n"
        f"Tu peux interroger en direct la base de l'établissement : {what}. "
        "Pour une demande de disponibilité/stock/prix d'un article précis non listé "
        "dans la fiche, utilise action='lookup' (voir consignes)."
    )
