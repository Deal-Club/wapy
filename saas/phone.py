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

    On NE retire PAS le '0' de tête : au Bénin le '01' fait partie du numéro
    (ex. 01 61 04 04 61 -> 2290161040461). Le stripping cassait ces numéros.
    Les habitudes 'trunk 0' (France...) sont couvertes par `candidate_jids`,
    qui essaie aussi la variante sans le 0.
    """
    nn = digits(number)
    cc = digits(dialcode)
    if not nn:
        return ""
    if cc and nn.startswith(cc):
        return nn
    return (cc + nn) if cc else nn


def to_jid(number: str, dialcode: str = "") -> str:
    """Numéro -> JID WhatsApp. Un JID déjà formé (`@c.us`/`@lid`...) est renvoyé tel quel."""
    n = (number or "").strip()
    if n.endswith(_JID_SUFFIXES):
        return n
    e = to_e164(n, dialcode)
    return e + CUS if e else ""


def candidate_numbers(number: str, dialcode: str = "") -> list[str]:
    """Variantes de chiffres (sans @c.us) à soumettre à WAHA pour résoudre le vrai
    chatId. Couvre l'ambiguïté du '0' de tête sans deviner."""
    n = (number or "").strip()
    if n.endswith(_JID_SUFFIXES):
        return [digits(n)]
    d = digits(n)
    cc = digits(dialcode)
    if not d:
        return []
    if cc and d.startswith(cc):
        bases = {d}
    elif cc:
        bases = {cc + d, cc + d.lstrip("0")}
    else:
        bases = {d, d.lstrip("0")}
    return sorted({b for b in bases if b}, key=len, reverse=True)


def candidate_jids(number: str, dialcode: str = "") -> list[str]:
    """Variantes plausibles d'un même numéro, pour envoyer l'OTP à toutes.

    Couvre l'ambiguïté du '0' de tête (gardé OU retiré) sans deviner : seule la
    vraie ligne WhatsApp reçoit le code ; les variantes invalides tombent dans le
    vide. Ex. Bénin '01 61040461'+229 -> {2290161040461, 22961040461} ;
    France '06...'+33 -> {330..., 336...}.
    """
    n = (number or "").strip()
    if n.endswith(_JID_SUFFIXES):
        return [n]
    d = digits(n)
    cc = digits(dialcode)
    if not d:
        return []
    if cc and d.startswith(cc):
        bases = {d}
    elif cc:
        stripped = d.lstrip("0")
        bases = {cc + d, cc + stripped}
    else:
        bases = {d, d.lstrip("0")}
    # ordre stable : plus long d'abord (garde le 0), puis variante raccourcie
    ordered = sorted({b for b in bases if b}, key=len, reverse=True)
    return [b + CUS for b in ordered]


def to_jids_csv(value: str, dialcode: str = "") -> str:
    """Normalise une liste CSV de numéros en JIDs `@c.us` (dédupe, ignore les vides)."""
    out: list[str] = []
    for part in (value or "").split(","):
        j = to_jid(part, dialcode)
        if j and j not in out:
            out.append(j)
    return ",".join(out)


def _nsn(d: str) -> str:
    """Retire un '0' de tête (trunk) pour rapprocher local et E.164."""
    return d[1:] if d.startswith("0") and len(d) > 1 else d


def same_number(a: str, b: str) -> bool:
    """Deux identifiants désignent-ils le même numéro ? Tolère indicatif pays et
    trunk '0' (ex. 22961040461 == 061040461 == 61040461). Insensible au format
    @c.us/@lid. Renvoie False si l'un est vide."""
    da, db = digits(a), digits(b)
    if not da or not db:
        return False
    if da == db:
        return True
    x, y = _nsn(da), _nsn(db)
    if x == y:
        return True
    short, long = (x, y) if len(x) <= len(y) else (y, x)
    return len(short) >= 8 and long.endswith(short)


def mask(jid: str) -> str:
    """Masque partiellement un numéro pour l'affichage (ex. 229…0461)."""
    d = digits(jid)
    if len(d) <= 4:
        return d
    return f"+{d[:3]}…{d[-4:]}"
