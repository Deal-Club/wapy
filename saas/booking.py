"""Réservation / RDV générique (autonome), tous secteurs.

Les créneaux sont calculés depuis les horaires d'ouverture (par jour de semaine)
et les réservations déjà prises. Heure locale = UTC + `offset` heures (Bénin = 1,
pas de changement d'heure). Les réservations sont stockées en UTC (rappels simples).
"""
from datetime import datetime, timedelta

DEFAULT = {
    "enabled": False,
    "offset": 1,          # décalage horaire local vs UTC (heures)
    "slot_min": 30,       # granularité d'un créneau (minutes)
    "capacity": 1,        # nb de RDV en parallèle
    "horizon_days": 14,   # fenêtre de réservation
    "hours": {},          # "0".."6" (lundi..dimanche) -> [["09:00","12:00"],["14:00","18:00"]]
    "services": [],       # [{"name","duration","price"}]
}


def cfg_of(config: dict) -> dict:
    b = dict(DEFAULT)
    b.update((config or {}).get("booking") or {})
    return b


def offset(cfg: dict) -> int:
    try:
        return int(cfg.get("offset", 1))
    except Exception:
        return 1


def now_local(cfg: dict) -> datetime:
    return datetime.utcnow() + timedelta(hours=offset(cfg))


def to_utc(cfg: dict, local_dt: datetime) -> datetime:
    return local_dt - timedelta(hours=offset(cfg))


def to_local(cfg: dict, utc_dt: datetime) -> datetime:
    return utc_dt + timedelta(hours=offset(cfg))


def service_duration(cfg: dict, name: str) -> int:
    for s in cfg.get("services", []) or []:
        if (s.get("name") or "").strip().lower() == (name or "").strip().lower():
            try:
                return int(s.get("duration") or cfg.get("slot_min") or 30)
            except Exception:
                break
    return int(cfg.get("slot_min") or 30)


def _hm(s: str):
    h, m = s.split(":")
    return int(h), int(m)


def free_slots(cfg: dict, taken_local: list, ref_local: datetime = None, max_slots: int = 8) -> list:
    """Créneaux libres à venir (datetimes LOCAUX). `taken_local` = débuts déjà réservés (locaux)."""
    if not cfg.get("enabled"):
        return []
    slot = int(cfg.get("slot_min") or 30)
    cap = int(cfg.get("capacity") or 1)
    horizon = int(cfg.get("horizon_days") or 14)
    hours = cfg.get("hours") or {}
    ref = ref_local or now_local(cfg)
    from collections import Counter
    taken = Counter(t.replace(second=0, microsecond=0) for t in (taken_local or []))
    out: list = []
    d = ref.date()
    for _ in range(horizon + 1):
        for rng in hours.get(str(d.weekday()), []) or []:
            try:
                sh, sm = _hm(rng[0]); eh, em = _hm(rng[1])
            except Exception:
                continue
            t = datetime(d.year, d.month, d.day, sh, sm)
            end = datetime(d.year, d.month, d.day, eh, em)
            while t + timedelta(minutes=slot) <= end:
                if t >= ref and taken.get(t, 0) < cap:
                    out.append(t)
                    if len(out) >= max_slots:
                        return out
                t += timedelta(minutes=slot)
        d += timedelta(days=1)
    return out


_JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
_MOIS = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
         "septembre", "octobre", "novembre", "décembre"]


def human(local_dt: datetime) -> str:
    return f"{_JOURS[local_dt.weekday()]} {local_dt.day} {_MOIS[local_dt.month]} à {local_dt:%H:%M}"


def prompt_block(cfg: dict, slots: list) -> str:
    """Section « ## Rendez-vous » injectée dans le prompt (hors cache : elle change
    à chaque créneau écoulé).

    Sans créneau (horaires non renseignés, ou agenda plein), on enregistre la
    demande au lieu d'escalader. L'escalade mettait `escalated` à vrai : le bot
    cessait alors de répondre à ce client et chaque message suivant partait au
    responsable sans réponse, jusqu'à intervention humaine. Une config incomplète
    rendait ainsi la conversation muette. `record` notifie le staff tout autant,
    mais laisse la conversation vivante.
    """
    svc = ", ".join((x.get("name") or "") for x in cfg.get("services", []) or []) or "prestation"
    if slots:
        lignes = "\n".join(f"- [{s:%Y-%m-%dT%H:%M}] {human(s)}" for s in slots)
        return ("\n\n## Rendez-vous\nRéservation possible. Services : " + svc +
                ".\nCréneaux disponibles (utilise l'horodatage entre crochets pour "
                "book_datetime) :\n" + lignes)
    return ("\n\n## Rendez-vous\nLa prise de rendez-vous est possible (services : " + svc +
            "), mais aucun créneau n'est libre dans la fenêtre actuelle. Ne dis JAMAIS "
            "que tu ne prends pas de rendez-vous, et ne passe pas la main à un humain : "
            "demande au client ses disponibilités souhaitées (jour et heure), puis "
            "enregistre-les avec action='record', record_type='Demande de rendez-vous'. "
            "Le responsable est prévenu automatiquement et confirmera.")
