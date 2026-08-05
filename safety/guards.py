"""Garde-fous : filtrage entrant + protection du numéro."""
from config import OPTOUT_KEYWORDS, BAN_KEYWORDS, DELAI_MIN_REPONSE, DELAI_MAX_REPONSE


def is_group(chat_id: str) -> bool:
    return chat_id.endswith("@g.us")


def is_broadcast(chat_id: str) -> bool:
    return chat_id == "status@broadcast"


def detect_optout(text: str) -> bool:
    low = text.lower()
    return any(kw in low for kw in OPTOUT_KEYWORDS)


def detect_ban_warning(text: str) -> bool:
    low = text.lower()
    return any(kw in low for kw in BAN_KEYWORDS)


def human_delay(rng) -> float:
    """Délai humain avant réponse (assurance bon marché, pas un rempart)."""
    return rng.uniform(DELAI_MIN_REPONSE, DELAI_MAX_REPONSE)
