"""Normalisation de numéros de téléphone -> JID WhatsApp (`@c.us`).

Multi-pays : l'UI fournit un indicatif (dialcode) et un numéro local. On produit
un identifiant E.164 (chiffres, sans '+') suffixé `@c.us`, seul format accepté par
WAHA pour *envoyer* un message. La vérification par code (OTP) confirme ensuite la
délivrabilité réelle, ce qui rattrape les particularités de numérotation
(ex. Bénin, trunk '0') sans deviner à la place de l'utilisateur.
"""
import re

CUS = "@c.us"
_JID_SUFFIXES = (CUS, "@lid", "@s.whatsapp.net", "@g.us")


def digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def to_e164(number: str, dialcode: str = "") -> str:
    """Combine indicatif + numéro local en chiffres E.164 (sans '+').

    - Si le numéro contient déjà l'indicatif, on le garde tel quel.
    - Sinon on retire un éventuel '0' de tête (préfixe national) puis on préfixe.
    """
    nn = digits(number)
    cc = digits(dialcode)
    if not nn:
        return ""
    if cc and nn.startswith(cc):
        return nn
    nn = nn[1:] if nn.startswith("0") else nn
    return (cc + nn) if cc else nn


def to_jid(number: str, dialcode: str = "") -> str:
    """Numéro -> JID WhatsApp. Un JID déjà formé (`@c.us`/`@lid`...) est renvoyé tel quel."""
    n = (number or "").strip()
    if n.endswith(_JID_SUFFIXES):
        return n
    e = to_e164(n, dialcode)
    return e + CUS if e else ""


def to_jids_csv(value: str, dialcode: str = "") -> str:
    """Normalise une liste CSV de numéros en JIDs `@c.us` (dédupe, ignore les vides)."""
    out: list[str] = []
    for part in (value or "").split(","):
        j = to_jid(part, dialcode)
        if j and j not in out:
            out.append(j)
    return ",".join(out)


def mask(jid: str) -> str:
    """Masque partiellement un numéro pour l'affichage (ex. 229…0461)."""
    d = digits(jid)
    if len(d) <= 4:
        return d
    return f"+{d[:3]}…{d[-4:]}"
