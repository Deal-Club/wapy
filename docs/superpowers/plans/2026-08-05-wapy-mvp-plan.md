# Wapy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un service qui répond automatiquement, via WhatsApp (WAHA), aux questions des clients d'un restaurant à partir d'une fiche Google Sheet, et escalade à un humain ce qu'il ne sait pas.

**Architecture:** Webhook FastAPI reçoit les messages entrants de WAHA → garde-fous → chargement de l'historique (SQLite) + fiche (Google Sheet en cache) → cerveau Claude (sortie structurée « répondre / escalader ») → réponse via WAHA ou escalade WhatsApp au staff. Le canal est abstrait pour brancher l'API officielle Meta plus tard sans toucher au cerveau.

**Tech Stack:** Python 3.10+, FastAPI, WAHA (Docker), Anthropic SDK (`anthropic`), gspread, SQLite, requests, pytest.

## Global Constraints

- **Python 3.10+** (utilise `match`/`X | None`).
- **Ne jamais initier** de conversation avec un client — répondre uniquement. Seule exception : alertes d'escalade vers `STAFF_WHATSAPP_NUMBERS` (liste blanche fixe).
- **Ignorer** groupes (`chatId` finissant par `@g.us`) et broadcast (`status@broadcast`).
- **Fiche jamais appelée à chaque message** : `FicheLoader` met en cache avec TTL `FICHE_TTL_SECONDS` (défaut 300 s).
- **Modèle Claude configurable** via `WAPY_MODEL` (défaut `claude-opus-4-8`). Le code reste **agnostique au modèle** : ne pas passer `thinking`/`effort`/`temperature` (Haiku 4.5 rejette `effort`; les params de sampling 400 sur Opus 4.8). Décision via **sortie structurée** `output_config.format` (json_schema).
- **Clé API** : le SDK lit `ANTHROPIC_API_KEY` depuis l'env. Ne jamais mettre de secret en clair.
- **Ne pas committer** : `.env`, `credentials.json`, `wapy.db`, `*.log`.
- Réponses Claude : `max_tokens=1024`, parse le JSON avec `json.loads` (jamais de match sur la string brute).

---

### Task 1: Squelette du projet + config + endpoint /health

**Files:**
- Create: `requirements.txt`, `.gitignore`, `.env.example`, `config.py`, `app.py`, `README.md`
- Test: `tests/test_app.py`

**Interfaces:**
- Produces: `config` module (constantes), `app.py:create_app(deps: dict | None = None) -> FastAPI` avec route `GET /health`.

- [ ] **Step 1: Écrire `requirements.txt`**

```
fastapi>=0.110
uvicorn[standard]>=0.29
anthropic>=0.92
gspread>=6.0
google-auth>=2.29
requests>=2.31
pytest>=8.0
httpx>=0.27
```

- [ ] **Step 2: Écrire `.gitignore`**

```
.env
credentials.json
wapy.db
*.log
__pycache__/
*.pyc
.pytest_cache/
chrome_profile/
```

- [ ] **Step 3: Écrire `.env.example`**

```
ANTHROPIC_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Step 4: Écrire `config.py`**

```python
"""Toute la configuration de Wapy. Une seule source de vérité."""
import os

# --- Canal WAHA ---
WAHA_BASE_URL = os.environ.get("WAHA_BASE_URL", "http://localhost:3000")
WAHA_SESSION = os.environ.get("WAHA_SESSION", "default")

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
# Liste blanche de numéros WhatsApp du staff (format WAHA: "336XXXXXXXX@c.us").
STAFF_WHATSAPP_NUMBERS = [
    n.strip() for n in os.environ.get("STAFF_WHATSAPP_NUMBERS", "").split(",") if n.strip()
]

# --- Garde-fous ---
OPTOUT_KEYWORDS = ["stop", "désabonne", "desabonne", "ne plus", "arrête", "arrete", "unsubscribe"]
BAN_KEYWORDS = ["trop de messages", "too many messages", "temporarily banned", "your account", "spam"]
DELAI_MIN_REPONSE = float(os.environ.get("DELAI_MIN_REPONSE", "3"))
DELAI_MAX_REPONSE = float(os.environ.get("DELAI_MAX_REPONSE", "8"))
```

- [ ] **Step 5: Écrire le test qui échoue `tests/test_app.py`**

```python
from fastapi.testclient import TestClient
from app import create_app


def test_health_ok():
    client = TestClient(create_app())
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "Wapy"}
```

- [ ] **Step 6: Lancer le test (échoue)**

Run: `python -m pytest tests/test_app.py -v`
Expected: FAIL (`app` introuvable).

- [ ] **Step 7: Écrire `app.py` (minimal)**

```python
"""Point d'entrée Wapy — routes uniquement. La logique vit dans les modules."""
from fastapi import FastAPI


def create_app(deps: dict | None = None) -> FastAPI:
    app = FastAPI(title="Wapy")
    app.state.deps = deps or {}

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy"}

    return app


app = create_app()
```

- [ ] **Step 8: Lancer le test (passe)**

Run: `python -m pytest tests/test_app.py -v`
Expected: PASS

- [ ] **Step 9: Écrire `README.md`** (installation, `.env`, `python -m pytest`, `uvicorn app:app`). Contenu court : prérequis (Python 3.10+, WAHA en Docker), `pip install -r requirements.txt`, copier `.env.example` → `.env`, lancer les tests, lancer le serveur.

- [ ] **Step 10: Commit**

```bash
git add requirements.txt .gitignore .env.example config.py app.py README.md tests/test_app.py
git commit -m "feat(wapy): squelette FastAPI + config + /health"
```

---

### Task 2: Garde-fous (fonctions pures)

**Files:**
- Create: `safety/__init__.py`, `safety/guards.py`
- Test: `tests/test_safety.py`

**Interfaces:**
- Produces:
  - `is_group(chat_id: str) -> bool`
  - `is_broadcast(chat_id: str) -> bool`
  - `detect_optout(text: str) -> bool`
  - `detect_ban_warning(text: str) -> bool`
  - `human_delay(rng) -> float` (rng = objet avec `.uniform(a, b)`)

- [ ] **Step 1: Écrire le test qui échoue `tests/test_safety.py`**

```python
import random
from safety.guards import (
    is_group, is_broadcast, detect_optout, detect_ban_warning, human_delay,
)


def test_is_group():
    assert is_group("120363000000000000@g.us") is True
    assert is_group("33612345678@c.us") is False


def test_is_broadcast():
    assert is_broadcast("status@broadcast") is True
    assert is_broadcast("33612345678@c.us") is False


def test_detect_optout_matches_keyword_case_insensitive():
    assert detect_optout("STOP merci") is True
    assert detect_optout("Je veux me désabonner") is True
    assert detect_optout("Vous êtes ouverts ce soir ?") is False


def test_detect_ban_warning():
    assert detect_ban_warning("You are sending too many messages") is True
    assert detect_ban_warning("Bonjour, une table pour 2 ?") is False


def test_human_delay_within_bounds():
    d = human_delay(random.Random(42))
    assert 3.0 <= d <= 8.0
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_safety.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `safety/__init__.py`** (vide).

- [ ] **Step 4: Écrire `safety/guards.py`**

```python
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
```

- [ ] **Step 5: Lancer les tests (passent)**

Run: `python -m pytest tests/test_safety.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add safety/ tests/test_safety.py
git commit -m "feat(wapy): garde-fous (groupes, opt-out, ban, délai humain)"
```

---

### Task 3: Persistance des conversations (SQLite)

**Files:**
- Create: `store/__init__.py`, `store/conversations.py`
- Test: `tests/test_store.py`

**Interfaces:**
- Produces `ConversationStore`:
  - `__init__(self, db_path: str)` — crée le schéma si absent
  - `append(self, chat_id: str, role: str, text: str) -> None` — `role` ∈ `{"user","assistant"}`
  - `get_history(self, chat_id: str, limit: int) -> list[dict]` — `[{"role","content"}]` ordre chronologique
  - `set_escalated(self, chat_id: str) -> None`
  - `is_escalated(self, chat_id: str) -> bool`
  - `set_optout(self, chat_id: str) -> None`
  - `is_optout(self, chat_id: str) -> bool`

- [ ] **Step 1: Écrire le test qui échoue `tests/test_store.py`**

```python
from store.conversations import ConversationStore


def test_append_and_get_history(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    s.append("33612345678@c.us", "user", "Bonjour")
    s.append("33612345678@c.us", "assistant", "Bonjour, comment aider ?")
    hist = s.get_history("33612345678@c.us", limit=10)
    assert hist == [
        {"role": "user", "content": "Bonjour"},
        {"role": "assistant", "content": "Bonjour, comment aider ?"},
    ]


def test_history_limit_keeps_most_recent_in_order(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    for i in range(5):
        s.append("c@c.us", "user", f"msg{i}")
    hist = s.get_history("c@c.us", limit=2)
    assert [h["content"] for h in hist] == ["msg3", "msg4"]


def test_escalation_flag(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    assert s.is_escalated("c@c.us") is False
    s.set_escalated("c@c.us")
    assert s.is_escalated("c@c.us") is True


def test_optout_flag(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    assert s.is_optout("c@c.us") is False
    s.set_optout("c@c.us")
    assert s.is_optout("c@c.us") is True
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_store.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `store/__init__.py`** (vide).

- [ ] **Step 4: Écrire `store/conversations.py`**

```python
"""Persistance SQLite : historique de conversation + états (escalade, opt-out)."""
import sqlite3


class ConversationStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_schema()

    def _conn(self):
        return sqlite3.connect(self.db_path)

    def _init_schema(self):
        with self._conn() as c:
            c.execute(
                """CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )"""
            )
            c.execute(
                """CREATE TABLE IF NOT EXISTS conv_state (
                    chat_id TEXT PRIMARY KEY,
                    escalated INTEGER DEFAULT 0,
                    optout INTEGER DEFAULT 0
                )"""
            )

    def append(self, chat_id: str, role: str, text: str) -> None:
        with self._conn() as c:
            c.execute(
                "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
                (chat_id, role, text),
            )

    def get_history(self, chat_id: str, limit: int) -> list[dict]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT role, content FROM messages WHERE chat_id = ? "
                "ORDER BY id DESC LIMIT ?",
                (chat_id, limit),
            ).fetchall()
        return [{"role": r, "content": t} for r, t in reversed(rows)]

    def _set_flag(self, chat_id: str, column: str) -> None:
        with self._conn() as c:
            c.execute(
                f"INSERT INTO conv_state (chat_id, {column}) VALUES (?, 1) "
                f"ON CONFLICT(chat_id) DO UPDATE SET {column}=1",
                (chat_id,),
            )

    def _get_flag(self, chat_id: str, column: str) -> bool:
        with self._conn() as c:
            row = c.execute(
                f"SELECT {column} FROM conv_state WHERE chat_id = ?", (chat_id,)
            ).fetchone()
        return bool(row and row[0])

    def set_escalated(self, chat_id: str) -> None:
        self._set_flag(chat_id, "escalated")

    def is_escalated(self, chat_id: str) -> bool:
        return self._get_flag(chat_id, "escalated")

    def set_optout(self, chat_id: str) -> None:
        self._set_flag(chat_id, "optout")

    def is_optout(self, chat_id: str) -> bool:
        return self._get_flag(chat_id, "optout")
```

- [ ] **Step 5: Lancer les tests (passent)**

Run: `python -m pytest tests/test_store.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add store/ tests/test_store.py
git commit -m "feat(wapy): persistance SQLite (historique + escalade + opt-out)"
```

---

**⏸️ Point de contrôle 1** — Après Task 3, les fondations (config, garde-fous, persistance) sont posées et testées.

---

### Task 4: Fiche restaurant (Google Sheet en cache) + template

**Files:**
- Create: `fiche/__init__.py`, `fiche/loader.py`, `docs/fiche-template.md`
- Test: `tests/test_fiche.py`

**Interfaces:**
- Produces:
  - `flatten(infos: list[list[str]], menu: list[list[str]], faq: list[list[str]]) -> str` — aplati les 3 onglets en texte pour le prompt.
  - `FicheLoader(reader, ttl_seconds: int, clock)` avec `load() -> str` (cache TTL). `reader() -> dict` renvoie `{"infos","menu","faq"}` (listes de lignes). `clock() -> float` (temps monotone, injectable pour les tests).
  - `gspread_reader() -> dict` — lecture réelle du Google Sheet (I/O, non testée unitairement).

- [ ] **Step 1: Écrire le test qui échoue `tests/test_fiche.py`**

```python
from fiche.loader import flatten, FicheLoader


def test_flatten_contains_sections_and_values():
    text = flatten(
        infos=[["Nom", "Chez Léon"], ["Horaires", "12h-14h / 19h-22h"]],
        menu=[["Entrée", "Salade", "Verte", "8€", "végé"]],
        faq=[["Terrasse ?", "Oui, chauffée"]],
    )
    assert "Chez Léon" in text
    assert "12h-14h" in text
    assert "Salade" in text and "8€" in text
    assert "Terrasse ?" in text and "Oui, chauffée" in text


def test_ficheloader_caches_within_ttl():
    calls = {"n": 0}

    def reader():
        calls["n"] += 1
        return {"infos": [["Nom", "X"]], "menu": [], "faq": []}

    now = {"t": 100.0}
    loader = FicheLoader(reader, ttl_seconds=300, clock=lambda: now["t"])
    loader.load()
    loader.load()
    assert calls["n"] == 1  # 2e appel servi par le cache

    now["t"] = 500.0  # TTL dépassé
    loader.load()
    assert calls["n"] == 2  # rechargé
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_fiche.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `fiche/__init__.py`** (vide).

- [ ] **Step 4: Écrire `fiche/loader.py`**

```python
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
```

- [ ] **Step 5: Lancer les tests (passent)**

Run: `python -m pytest tests/test_fiche.py -v`
Expected: PASS

- [ ] **Step 6: Écrire `docs/fiche-template.md`** — décrit le Google Sheet à créer avec le client (premier livrable côté contenu) :

```markdown
# Template de fiche restaurant (Google Sheet)

Créer un Google Sheet nommé selon `config.SHEET_NAME`, partagé en édition avec
l'e-mail du compte de service (`credentials.json`). 3 onglets, ligne 1 = en-têtes.

## Onglet `Infos` (2 colonnes)
| Rubrique | Contenu |
|---|---|
| Nom | Chez Léon |
| Ton de voix | Chaleureux, tutoiement léger |
| Horaires | Mar-Dim 12h-14h / 19h-22h, fermé lundi |
| Adresse / Accès / Parking | 12 rue X, parking gratuit à 50 m |
| Politique de réservation | Résa conseillée le week-end (le bot n'enregistre pas encore : escalade) |
| À escalader systématiquement | Réservations, commandes, réclamations, privatisations |

## Onglet `Menu` (5 colonnes)
| Catégorie | Plat | Description | Prix | Allergènes/Régime |
|---|---|---|---|---|
| Entrée | Salade César | Poulet, parmesan | 9€ | contient gluten |

## Onglet `FAQ` (2 colonnes)
| Question | Réponse |
|---|---|
| Vous avez une terrasse ? | Oui, chauffée et ouverte toute l'année. |
```

- [ ] **Step 7: Commit**

```bash
git add fiche/ tests/test_fiche.py docs/fiche-template.md
git commit -m "feat(wapy): fiche resto Google Sheet (aplatie + cache TTL) + template"
```

---

### Task 5: Canal — interface abstraite + adaptateur WAHA

**Files:**
- Create: `channel/__init__.py`, `channel/base.py`, `channel/waha.py`
- Test: `tests/test_channel_waha.py`

**Interfaces:**
- Produces:
  - `channel/base.py` : dataclass `IncomingMessage(chat_id: str, text: str, from_me: bool, is_group: bool)` ; ABC `WhatsAppChannel` avec `parse_incoming(payload: dict) -> IncomingMessage | None`, `send_text(chat_id: str, text: str) -> None`, `session_status() -> str`.
  - `channel/waha.py` : `WahaProvider(base_url: str, session: str)` implémentant l'ABC.

- [ ] **Step 1: Écrire le test qui échoue `tests/test_channel_waha.py`**

```python
from channel.waha import WahaProvider


def _provider():
    return WahaProvider(base_url="http://waha:3000", session="default")


def test_parse_incoming_message():
    payload = {
        "event": "message",
        "session": "default",
        "payload": {"from": "33612345678@c.us", "fromMe": False, "body": "Bonjour"},
    }
    msg = _provider().parse_incoming(payload)
    assert msg is not None
    assert msg.chat_id == "33612345678@c.us"
    assert msg.text == "Bonjour"
    assert msg.from_me is False
    assert msg.is_group is False


def test_parse_incoming_group_flag():
    payload = {
        "event": "message",
        "payload": {"from": "123@g.us", "fromMe": False, "body": "hi"},
    }
    msg = _provider().parse_incoming(payload)
    assert msg.is_group is True


def test_parse_incoming_ignores_non_message_event():
    assert _provider().parse_incoming({"event": "session.status", "payload": {}}) is None


def test_parse_incoming_ignores_empty_body():
    payload = {"event": "message", "payload": {"from": "x@c.us", "fromMe": False, "body": ""}}
    assert _provider().parse_incoming(payload) is None


def test_send_text_posts_to_waha(monkeypatch):
    captured = {}

    def fake_post(url, json, timeout):
        captured["url"] = url
        captured["json"] = json

        class R:
            status_code = 201

            def raise_for_status(self):
                pass

        return R()

    import channel.waha as waha
    monkeypatch.setattr(waha.requests, "post", fake_post)
    _provider().send_text("33612345678@c.us", "Bonjour !")
    assert captured["url"] == "http://waha:3000/api/sendText"
    assert captured["json"] == {
        "session": "default",
        "chatId": "33612345678@c.us",
        "text": "Bonjour !",
    }
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_channel_waha.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `channel/__init__.py`** (vide).

- [ ] **Step 4: Écrire `channel/base.py`**

```python
"""Interface canal WhatsApp — le cerveau ne sait pas quel adaptateur est derrière.
Permet de brancher l'API officielle Meta plus tard sans toucher au reste."""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class IncomingMessage:
    chat_id: str
    text: str
    from_me: bool
    is_group: bool


class WhatsAppChannel(ABC):
    @abstractmethod
    def parse_incoming(self, payload: dict) -> IncomingMessage | None: ...

    @abstractmethod
    def send_text(self, chat_id: str, text: str) -> None: ...

    @abstractmethod
    def session_status(self) -> str: ...
```

- [ ] **Step 5: Écrire `channel/waha.py`**

```python
"""Adaptateur non-officiel : WAHA (WhatsApp HTTP API, self-host Docker).

Note : la forme exacte du webhook et des endpoints peut varier selon la version
de WAHA (NOWEB/WEBJS). Vérifier contre la version déployée.
"""
import requests

from channel.base import WhatsAppChannel, IncomingMessage


class WahaProvider(WhatsAppChannel):
    def __init__(self, base_url: str, session: str):
        self.base_url = base_url.rstrip("/")
        self.session = session

    def parse_incoming(self, payload: dict) -> IncomingMessage | None:
        if payload.get("event") != "message":
            return None
        p = payload.get("payload", {})
        chat_id = p.get("from", "")
        body = p.get("body", "")
        if not chat_id or not body:
            return None
        return IncomingMessage(
            chat_id=chat_id,
            text=body,
            from_me=bool(p.get("fromMe", False)),
            is_group=chat_id.endswith("@g.us"),
        )

    def send_text(self, chat_id: str, text: str) -> None:
        r = requests.post(
            f"{self.base_url}/api/sendText",
            json={"session": self.session, "chatId": chat_id, "text": text},
            timeout=30,
        )
        r.raise_for_status()

    def session_status(self) -> str:
        r = requests.get(f"{self.base_url}/api/sessions/{self.session}", timeout=15)
        r.raise_for_status()
        return r.json().get("status", "UNKNOWN")
```

- [ ] **Step 6: Lancer les tests (passent)**

Run: `python -m pytest tests/test_channel_waha.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add channel/ tests/test_channel_waha.py
git commit -m "feat(wapy): canal abstrait + adaptateur WAHA (parse/send/status)"
```

---

**⏸️ Point de contrôle 2** — Après Task 5 : fiche, canal et fondations sont prêts.

---

### Task 6: Cerveau (Claude, sortie structurée « répondre / escalader »)

**Files:**
- Create: `brain/__init__.py`, `brain/brain.py`
- Test: `tests/test_brain.py`

**Interfaces:**
- Produces:
  - `build_system_prompt(fiche_text: str) -> str` — prompt système avec règle de non-invention stricte.
  - dataclass `Decision(action: str, message: str, reason: str)` (`action` ∈ `{"reply","escalate"}`).
  - `Brain(client, model: str)` avec `decide(fiche_text: str, history: list[dict], incoming_text: str) -> Decision`.
  - `DECISION_SCHEMA` (dict json_schema).

- [ ] **Step 1: Écrire le test qui échoue `tests/test_brain.py`**

```python
import json
from brain.brain import Brain, build_system_prompt, Decision


def test_system_prompt_embeds_fiche_and_grounding_rule():
    sp = build_system_prompt("## Infos\n- Nom : Chez Léon")
    assert "Chez Léon" in sp
    assert "escalade" in sp.lower()  # règle : ne rien inventer -> escalade


class _FakeBlock:
    type = "text"

    def __init__(self, text):
        self.text = text


class _FakeResp:
    def __init__(self, text):
        self.content = [_FakeBlock(text)]


class _FakeMessages:
    def __init__(self, payload):
        self._payload = payload
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return _FakeResp(json.dumps(self._payload))


class _FakeClient:
    def __init__(self, payload):
        self.messages = _FakeMessages(payload)


def test_decide_returns_reply():
    client = _FakeClient({"action": "reply", "message": "Nous ouvrons à 12h.", "reason": "horaires dans la fiche"})
    d = Brain(client, model="claude-opus-4-8").decide(
        fiche_text="## Infos\n- Horaires : 12h",
        history=[],
        incoming_text="Vous ouvrez à quelle heure ?",
    )
    assert isinstance(d, Decision)
    assert d.action == "reply"
    assert d.message == "Nous ouvrons à 12h."


def test_decide_passes_model_history_and_schema():
    client = _FakeClient({"action": "escalate", "message": "", "reason": "réservation"})
    Brain(client, model="claude-haiku-4-5").decide(
        fiche_text="x",
        history=[{"role": "user", "content": "salut"}, {"role": "assistant", "content": "bonjour"}],
        incoming_text="je veux réserver",
    )
    call = client.messages.calls[0]
    assert call["model"] == "claude-haiku-4-5"
    # historique + message courant, dans l'ordre
    assert call["messages"][-1] == {"role": "user", "content": "je veux réserver"}
    assert call["messages"][0] == {"role": "user", "content": "salut"}
    # sortie structurée demandée
    assert call["output_config"]["format"]["type"] == "json_schema"
    # pas de params spécifiques à un modèle (agnostique)
    assert "thinking" not in call and "temperature" not in call
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_brain.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `brain/__init__.py`** (vide).

- [ ] **Step 4: Écrire `brain/brain.py`**

```python
"""Cerveau : Claude décide de répondre (depuis la fiche) ou d'escalader.

Sortie structurée (json_schema) pour une décision fiable et parsable.
Code agnostique au modèle : pas de `thinking`/`effort`/`temperature`
(effort 400 sur Haiku ; sampling 400 sur Opus 4.8). Le modèle est configurable.
"""
import json
from dataclasses import dataclass

DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["reply", "escalate"]},
        "message": {"type": "string"},
        "reason": {"type": "string"},
    },
    "required": ["action", "message", "reason"],
    "additionalProperties": False,
}


@dataclass
class Decision:
    action: str
    message: str
    reason: str


def build_system_prompt(fiche_text: str) -> str:
    return (
        "Tu es l'assistant WhatsApp d'un restaurant. Tu réponds aux clients qui "
        "écrivent, en français, dans le ton indiqué par la fiche.\n\n"
        "RÈGLES ABSOLUES :\n"
        "1. Réponds UNIQUEMENT à partir des informations de la fiche ci-dessous.\n"
        "2. Si l'information demandée n'est PAS dans la fiche, ou si le client veut "
        "réserver, commander, se plaindre, ou parler à un humain : action='escalate' "
        "(n'invente jamais un prix, un horaire, une disponibilité).\n"
        "3. Sinon : action='reply' avec un message court, chaleureux et exact.\n"
        "4. Renseigne toujours 'reason' (courte justification interne).\n\n"
        "=== FICHE RESTAURANT ===\n"
        f"{fiche_text}\n"
        "=== FIN FICHE ==="
    )


class Brain:
    def __init__(self, client, model: str):
        self._client = client
        self._model = model

    def decide(self, fiche_text: str, history: list[dict], incoming_text: str) -> Decision:
        messages = list(history) + [{"role": "user", "content": incoming_text}]
        resp = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=build_system_prompt(fiche_text),
            messages=messages,
            output_config={"format": {"type": "json_schema", "schema": DECISION_SCHEMA}},
        )
        text = next(b.text for b in resp.content if b.type == "text")
        data = json.loads(text)
        return Decision(action=data["action"], message=data["message"], reason=data["reason"])
```

- [ ] **Step 5: Lancer les tests (passent)**

Run: `python -m pytest tests/test_brain.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add brain/ tests/test_brain.py
git commit -m "feat(wapy): cerveau Claude (sortie structurée reply/escalate, agnostique modèle)"
```

---

### Task 7: Escalade humaine + notifier Telegram

**Files:**
- Create: `notifier.py`, `handoff/__init__.py`, `handoff/handoff.py`
- Test: `tests/test_handoff.py`

**Interfaces:**
- Consumes: `channel.base.WhatsAppChannel` (send_text), `store.conversations.ConversationStore` (set_escalated).
- Produces:
  - `notifier.notify(level: str, title: str, body: str = "") -> bool` (adapté de l'existant ; jamais d'exception).
  - `handoff.escalate_to_staff(channel, store, chat_id: str, incoming_text: str, staff_numbers: list[str], reason: str) -> None` — alerte chaque numéro staff sur WhatsApp + marque escaladé.

- [ ] **Step 1: Écrire le test qui échoue `tests/test_handoff.py`**

```python
from handoff.handoff import escalate_to_staff


class _FakeChannel:
    def __init__(self):
        self.sent = []

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _FakeStore:
    def __init__(self):
        self.escalated = set()

    def set_escalated(self, chat_id):
        self.escalated.add(chat_id)


def test_escalate_notifies_each_staff_and_marks_state():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(
        ch, st,
        chat_id="33611112222@c.us",
        incoming_text="Je veux réserver pour 4 samedi",
        staff_numbers=["33600000001@c.us", "33600000002@c.us"],
        reason="réservation",
    )
    assert st.escalated == {"33611112222@c.us"}
    assert len(ch.sent) == 2
    to_first, body_first = ch.sent[0]
    assert to_first == "33600000001@c.us"
    assert "réserver" in body_first  # le message client est repris dans l'alerte


def test_escalate_no_staff_configured_still_marks_state():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(ch, st, "c@c.us", "bonjour", staff_numbers=[], reason="x")
    assert st.escalated == {"c@c.us"}
    assert ch.sent == []
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `python -m pytest tests/test_handoff.py -v`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Écrire `notifier.py`** (adapté de `whatsapp-bot/notifier.py`). Réservé aux **alertes techniques** (session, ban) destinées à l'opérateur Wapy — pas à l'escalade client.

```python
"""Alertes Telegram pour l'opérateur Wapy (session tombée, avertissement de ban).
Silencieux si TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID absents. Ne lève jamais d'exception."""
import logging
import os
import socket

import requests

logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
HOSTNAME = socket.gethostname()
LEVELS_EMOJI = {"INFO": "ℹ️", "WARN": "⚠️", "CRITICAL": "🚨", "SUCCESS": "✅"}


def is_configured() -> bool:
    return bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID)


def notify(level: str, title: str, body: str = "") -> bool:
    if not is_configured():
        return False
    emoji = LEVELS_EMOJI.get(level, "")
    lines = [f"{emoji} *{title}*", f"_{HOSTNAME}_"]
    if body:
        lines += ["", body]
    text = "\n".join(lines)
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            data={"chat_id": TELEGRAM_CHAT_ID, "text": text[:4000], "parse_mode": "Markdown"},
            timeout=10,
        )
        if r.status_code == 200:
            return True
        logger.warning("Telegram HTTP %s: %s", r.status_code, r.text[:200])
    except Exception as e:
        logger.warning("Telegram notify failed: %s", e)
    return False
```

- [ ] **Step 4: Écrire `handoff/__init__.py`** (vide).

- [ ] **Step 5: Écrire `handoff/handoff.py`**

```python
"""Escalade humaine : alerte le staff du resto sur WhatsApp et fige la conversation.
L'employé reprend ensuite la main depuis le WhatsApp du resto (WAHA = appareil lié)."""


def escalate_to_staff(channel, store, chat_id, incoming_text, staff_numbers, reason):
    store.set_escalated(chat_id)
    alerte = (
        "🔔 Un client attend une réponse humaine.\n"
        f"Client : {chat_id}\n"
        f"Message : « {incoming_text} »\n"
        f"Motif : {reason}\n"
        "Réponds-lui depuis le WhatsApp du resto."
    )
    for num in staff_numbers:
        try:
            channel.send_text(num, alerte)
        except Exception:
            # Une alerte staff qui échoue ne doit pas casser le traitement.
            pass
```

- [ ] **Step 6: Lancer les tests (passent)**

Run: `python -m pytest tests/test_handoff.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add notifier.py handoff/ tests/test_handoff.py
git commit -m "feat(wapy): escalade staff WhatsApp + notifier Telegram (alertes techniques)"
```

---

**⏸️ Point de contrôle 3** — Après Task 7, tous les composants isolés sont testés.

---

### Task 8: Orchestration du webhook (câblage complet)

**Files:**
- Modify: `app.py`
- Test: `tests/test_app.py` (étendre)

**Interfaces:**
- Consumes: `channel`, `brain`, `store`, `fiche` (loader), `safety`, `handoff`, `config.STAFF_WHATSAPP_NUMBERS`, `config.HISTORY_LIMIT`.
- Produces: route `POST /webhook` qui orchestre le traitement d'un message entrant. `create_app(deps)` injecte `{"channel","brain","store","fiche","staff_numbers","rng"}` (les tests passent des faux).

- [ ] **Step 1: Écrire les tests qui échouent (étendre `tests/test_app.py`)**

```python
import random
from fastapi.testclient import TestClient
from app import create_app
from channel.base import IncomingMessage
from brain.brain import Decision


class _Ch:
    def __init__(self):
        self.sent = []

    def parse_incoming(self, payload):
        p = payload["payload"]
        cid = p["from"]
        return IncomingMessage(cid, p["body"], p.get("fromMe", False), cid.endswith("@g.us"))

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _Brain:
    def __init__(self, decision):
        self.decision = decision
        self.called = False

    def decide(self, fiche_text, history, incoming_text):
        self.called = True
        return self.decision


class _Store:
    def __init__(self):
        self.msgs, self.esc, self.opt = [], set(), set()

    def append(self, cid, role, text):
        self.msgs.append((cid, role, text))

    def get_history(self, cid, limit):
        return []

    def is_escalated(self, cid):
        return cid in self.esc

    def set_escalated(self, cid):
        self.esc.add(cid)

    def is_optout(self, cid):
        return cid in self.opt

    def set_optout(self, cid):
        self.opt.add(cid)


class _Fiche:
    def load(self):
        return "## Infos\n- Nom : X"


def _client(brain, ch=None, store=None):
    ch = ch or _Ch()
    store = store or _Store()
    deps = {
        "channel": ch,
        "brain": brain,
        "store": store,
        "fiche": _Fiche(),
        "staff_numbers": ["33600000000@c.us"],
        "rng": random.Random(1),
    }
    return TestClient(create_app(deps)), ch, store


def _msg(cid="33611112222@c.us", body="Vous ouvrez à quelle heure ?", from_me=False):
    return {"event": "message", "payload": {"from": cid, "body": body, "fromMe": from_me}}


def test_reply_flow_sends_and_persists():
    brain = _Brain(Decision("reply", "On ouvre à 12h.", "horaires"))
    client, ch, store = _client(brain)
    r = client.post("/webhook", json=_msg())
    assert r.status_code == 200
    assert ("33611112222@c.us", "On ouvre à 12h.") in ch.sent
    assert ("33611112222@c.us", "assistant", "On ouvre à 12h.") in store.msgs


def test_escalate_flow_alerts_staff():
    brain = _Brain(Decision("escalate", "", "réservation"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(body="je veux réserver"))
    assert store.is_escalated("33611112222@c.us")
    assert any(to == "33600000000@c.us" for to, _ in ch.sent)


def test_group_message_ignored():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(cid="123@g.us"))
    assert brain.called is False
    assert ch.sent == []


def test_from_me_ignored():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(from_me=True))
    assert brain.called is False


def test_optout_keyword_stops_and_marks():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(body="STOP"))
    assert store.is_optout("33611112222@c.us")
    assert brain.called is False


def test_already_escalated_conversation_is_not_answered():
    brain = _Brain(Decision("reply", "x", "y"))
    ch, store = _Ch(), _Store()
    store.set_escalated("33611112222@c.us")
    client, _, _ = _client(brain, ch=ch, store=store)
    client.post("/webhook", json=_msg())
    assert brain.called is False
    assert ch.sent == []
```

- [ ] **Step 2: Lancer les tests (échouent)**

Run: `python -m pytest tests/test_app.py -v`
Expected: FAIL (`/webhook` n'existe pas).

- [ ] **Step 3: Réécrire `app.py` avec l'orchestration**

```python
"""Point d'entrée Wapy — routes + câblage. La logique vit dans les modules."""
import random

from fastapi import FastAPI, Request

import config
from safety.guards import is_group, is_broadcast, detect_optout
from handoff.handoff import escalate_to_staff


def _build_default_deps() -> dict:
    from channel.waha import WahaProvider
    from brain.brain import Brain
    from store.conversations import ConversationStore
    from fiche.loader import FicheLoader, gspread_reader
    import anthropic

    return {
        "channel": WahaProvider(config.WAHA_BASE_URL, config.WAHA_SESSION),
        "brain": Brain(anthropic.Anthropic(), config.WAPY_MODEL),
        "store": ConversationStore(config.DB_PATH),
        "fiche": FicheLoader(gspread_reader, config.FICHE_TTL_SECONDS),
        "staff_numbers": config.STAFF_WHATSAPP_NUMBERS,
        "rng": random.Random(),
    }


def create_app(deps: dict | None = None) -> FastAPI:
    app = FastAPI(title="Wapy")
    app.state.deps = deps  # None => construits paresseusement au 1er webhook

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy"}

    @app.post("/webhook")
    async def webhook(request: Request):
        if app.state.deps is None:
            app.state.deps = _build_default_deps()
        d = app.state.deps
        channel, brain, store, fiche = d["channel"], d["brain"], d["store"], d["fiche"]

        payload = await request.json()
        msg = channel.parse_incoming(payload)
        if msg is None:
            return {"status": "ignored"}

        # Garde-fous d'entrée
        if msg.from_me or msg.is_group or is_broadcast(msg.chat_id) or is_group(msg.chat_id):
            return {"status": "ignored"}
        if store.is_optout(msg.chat_id) or store.is_escalated(msg.chat_id):
            return {"status": "handed_off"}
        if detect_optout(msg.text):
            store.set_optout(msg.chat_id)
            return {"status": "optout"}

        # Traitement
        store.append(msg.chat_id, "user", msg.text)
        history = store.get_history(msg.chat_id, config.HISTORY_LIMIT)
        decision = brain.decide(fiche.load(), history, msg.text)

        if decision.action == "reply":
            channel.send_text(msg.chat_id, decision.message)
            store.append(msg.chat_id, "assistant", decision.message)
            return {"status": "replied"}

        escalate_to_staff(
            channel, store, msg.chat_id, msg.text, d["staff_numbers"], decision.reason
        )
        return {"status": "escalated"}

    return app


app = create_app()
```

> Note : `get_history` est appelé après `append`, donc le message courant figure déjà dans l'historique. C'est acceptable au MVP (le prompt le tolère). Si on veut l'éviter plus tard, exclure le dernier message ou inverser l'ordre append/history.

- [ ] **Step 4: Lancer toute la suite (passe)**

Run: `python -m pytest -v`
Expected: PASS (toutes les tâches).

- [ ] **Step 5: Commit**

```bash
git add app.py tests/test_app.py
git commit -m "feat(wapy): orchestration webhook (garde-fous -> cerveau -> réponse/escalade)"
```

---

### Task 9: Déploiement (WAHA + Wapy) + smoke test manuel

**Files:**
- Create: `docker-compose.yml`, `Dockerfile`, `docs/deploiement.md`

**Interfaces:**
- Consumes: tout le service. Produces : stack lançable (WAHA + Wapy) et procédure de connexion du WhatsApp du resto.

> Cette tâche est de l'intégration/déploiement : sa « vérification » est un smoke test manuel documenté, pas un test unitaire.

- [ ] **Step 1: Écrire `Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Écrire `docker-compose.yml`** (WAHA + Wapy ; WAHA POST son webhook vers Wapy)

```yaml
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    environment:
      - WHATSAPP_HOOK_URL=http://wapy:8000/webhook
      - WHATSAPP_HOOK_EVENTS=message
    volumes:
      - ./waha_sessions:/app/.sessions

  wapy:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      - WAHA_BASE_URL=http://waha:3000
    volumes:
      - ./wapy.db:/app/wapy.db
      - ./credentials.json:/app/credentials.json:ro
    depends_on:
      - waha
```

- [ ] **Step 3: Écrire `docs/deploiement.md`** — procédure :
  1. Créer le Google Sheet depuis `docs/fiche-template.md`, le partager avec le compte de service, poser `credentials.json`.
  2. Remplir `.env` (`ANTHROPIC_API_KEY`, `STAFF_WHATSAPP_NUMBERS`, `SHEET_NAME`, `WAPY_MODEL` si autre qu'Opus, `TELEGRAM_*`).
  3. `docker compose up -d`.
  4. Scanner le QR WhatsApp du resto : `GET http://<host>:3000/api/screenshot` (ou dashboard WAHA) → le titulaire scanne via Réglages → Appareils liés.
  5. **Smoke test** : depuis un autre téléphone, écrire une question couverte par la fiche au numéro du resto → vérifier la réponse auto. Écrire « je veux réserver » → vérifier l'alerte reçue sur le WhatsApp staff. Écrire « STOP » → vérifier qu'aucune réponse n'est envoyée ensuite.
  6. Vérifier `GET /health` = `{"status":"ok"}`.

- [ ] **Step 4: Vérification (smoke test)**

Run: `docker compose up -d` puis `curl http://localhost:8000/health`
Expected: `{"status":"ok","service":"Wapy"}` ; les 3 scénarios du smoke test se comportent comme décrit.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml docs/deploiement.md
git commit -m "feat(wapy): déploiement Docker (WAHA + Wapy) + procédure smoke test"
```

---

## Notes transverses

- **Warmup / plafond** : non pertinent en entrant (on ne fait que répondre). Le levier anti-ban n°1 est respecté par nature. Ne pas réintroduire de quotas de type sortant.
- **Migration future vers l'API officielle Meta** : implémenter un `channel/official.py` conforme à `WhatsAppChannel` (webhook Meta + envoi Cloud API) et changer l'injection dans `_build_default_deps`. Aucun autre module ne bouge.
- **Réservations / commandes (phases 2-3)** : ajouter des outils Claude (tool use) avec confirmation stricte, brancher une source de dispo. Le champ `action` du `Decision` s'étendra (`reserve`, `order`) sans casser l'existant.
- **`human_delay`** est fourni par les garde-fous mais non encore branché dans l'orchestration (cosmétique, cf. modèle de menace). L'ajouter avant `send_text` si souhaité, sans bloquer l'event loop (`await asyncio.sleep(...)`).
- **Détection de ban / heartbeat de session** : `detect_ban_warning` (Task 2) et `notifier.notify` (Task 7) sont fournis comme briques, mais le **câblage complet** (boucle heartbeat périodique + réaction aux avertissements WhatsApp reçus comme événements système WAHA + pause auto) est **volontairement différé** après le MVP. Justification : en entrant, le risque de ban est faible, et ces événements arrivent hors du flux « message client » (à traiter dans une tâche de fond séparée). À implémenter en Task 10 dès que le socle est validé en prod.
