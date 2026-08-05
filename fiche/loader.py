"""Chargement de la fiche resto depuis un Google Sheet, aplatie et mise en cache.

La fiche est éditée par le client (non technique) dans un Google Sheet à 3 onglets
(Infos / Menu / FAQ). On ne rappelle JAMAIS l'API Google à chaque message : cache TTL.
"""
import time


def flatten(infos, menu, faq) -> str:
    parts = ["# FICHE RESTAURANT", "", "## Infos"]
    for row in infos:
        if len(row) >= 2 and row[0].strip():
            parts.append(f"- {row[0].strip()} : {row[1].strip()}")
    parts += ["", "## Menu"]
    for row in menu:
        cells = [c.strip() for c in row if c.strip()]
        if cells:
            parts.append("- " + " | ".join(cells))
    parts += ["", "## FAQ"]
    for row in faq:
        if len(row) >= 2 and row[0].strip():
            parts.append(f"Q: {row[0].strip()}\nR: {row[1].strip()}")
    return "\n".join(parts)


class FicheLoader:
    def __init__(self, reader, ttl_seconds: int, clock=time.monotonic):
        self._reader = reader
        self._ttl = ttl_seconds
        self._clock = clock
        self._cache: str | None = None
        self._loaded_at: float = 0.0

    def load(self) -> str:
        now = self._clock()
        if self._cache is None or (now - self._loaded_at) >= self._ttl:
            data = self._reader()
            self._cache = flatten(data["infos"], data["menu"], data["faq"])
            self._loaded_at = now
        return self._cache


def gspread_reader():
    """Lecture réelle du Google Sheet (I/O). Réutilise le pattern gspread existant."""
    import gspread
    from google.oauth2.service_account import Credentials
    from config import GOOGLE_CREDENTIALS_FILE, SHEET_NAME, TAB_INFOS, TAB_MENU, TAB_FAQ

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(GOOGLE_CREDENTIALS_FILE, scopes=scopes)
    ss = gspread.authorize(creds).open(SHEET_NAME)
    return {
        "infos": ss.worksheet(TAB_INFOS).get_all_values()[1:],  # saute l'en-tête
        "menu": ss.worksheet(TAB_MENU).get_all_values()[1:],
        "faq": ss.worksheet(TAB_FAQ).get_all_values()[1:],
    }
