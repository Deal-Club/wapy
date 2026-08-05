"""Toute la configuration de Wapy. Une seule source de vérité."""
import os

# --- Canal WAHA ---
WAHA_BASE_URL = os.environ.get("WAHA_BASE_URL", "http://localhost:3000")
WAHA_SESSION = os.environ.get("WAHA_SESSION", "default")
# Clé API WAHA (si WAHA la réclame). Même variable que côté WAHA : WHATSAPP_API_KEY.
WAHA_API_KEY = os.environ.get("WHATSAPP_API_KEY", "").strip()

# --- Cerveau (Claude) ---
# Modèle configurable. Défaut Opus 4.8. Pour un bot FAQ à fort volume,
# claude-haiku-4-5 (~5x moins cher) ou claude-sonnet-4-6 conviennent très bien.
WAPY_MODEL = os.environ.get("WAPY_MODEL", "claude-opus-4-8")

# --- Fiche restaurant (Google Sheet) ---
GOOGLE_CREDENTIALS_FILE = os.environ.get("GOOGLE_CREDENTIALS_FILE", "credentials.json")
SHEET_NAME = os.environ.get("SHEET_NAME", "Wapy - Fiche Resto")
TAB_INFOS = "Infos"
TAB_MENU = "Menu"
TAB_FAQ = "FAQ"
FICHE_TTL_SECONDS = int(os.environ.get("FICHE_TTL_SECONDS", "300"))

# --- Persistance ---
DB_PATH = os.environ.get("WAPY_DB_PATH", "wapy.db")
HISTORY_LIMIT = 20  # nb de messages d'historique injectés dans le prompt

# --- Escalade ---
# Numéros WhatsApp du staff pour ENVOYER les alertes (format "336XXXXXXXX@c.us").
STAFF_WHATSAPP_NUMBERS = [
    n.strip() for n in os.environ.get("STAFF_WHATSAPP_NUMBERS", "").split(",") if n.strip()
]
# Identifiants du staff pour RECONNAÎTRE ses messages entrants. WAHA/NOWEB peut
# livrer un contact sous un id privé "@lid" différent du "@c.us". Renseigner ici
# le(s) @lid du staff (visible dans les logs "IN ...@lid" quand le boss écrit).
STAFF_INBOUND_IDS = [
    x.strip() for x in os.environ.get("STAFF_INBOUND_IDS", "").split(",") if x.strip()
]

# --- Garde-fous ---
OPTOUT_KEYWORDS = ["stop", "désabonne", "desabonne", "ne plus", "arrête", "arrete", "unsubscribe"]
BAN_KEYWORDS = ["trop de messages", "too many messages", "temporarily banned", "your account", "spam"]
DELAI_MIN_REPONSE = float(os.environ.get("DELAI_MIN_REPONSE", "3"))
DELAI_MAX_REPONSE = float(os.environ.get("DELAI_MAX_REPONSE", "8"))
