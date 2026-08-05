"""Preuve du pipeline COMPLET en réel, sans WAHA (Docker non requis).

Tout est réel — fiche Google Sheets, cerveau Claude, décision, escalade —
seul l'ENVOI WhatsApp est simulé (loggé au lieu d'être posté à WAHA).

Usage : python -m tools.test_pipeline_live
Prérequis : credentials.json + Sheet partagé + ANTHROPIC_API_KEY dans .env
"""
import os
import random
import sys
import tempfile

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def _load_dotenv(path=".env"):
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip()
        if k and v and k not in os.environ:
            os.environ[k] = v


_load_dotenv()
if not os.environ.get("ANTHROPIC_API_KEY"):
    print("❌ ANTHROPIC_API_KEY absente dans .env")
    sys.exit(1)

import anthropic
from fastapi.testclient import TestClient

import config
from app import create_app
from brain.brain import Brain
from store.conversations import ConversationStore
from fiche.loader import FicheLoader, gspread_reader
from channel.waha import WahaProvider

CLIENT = "2290161413177@c.us"   # téléphone B (le client)
STAFF = config.STAFF_WHATSAPP_NUMBERS


class MockChannel(WahaProvider):
    """Canal WAHA réel pour parser, mais l'envoi est simulé (loggé)."""
    def __init__(self):
        super().__init__("http://mock", "default")
        self.sent = []

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


def _webhook(body, frm=CLIENT):
    return {"event": "message", "payload": {"from": frm, "fromMe": False, "body": body}}


def main():
    ch = MockChannel()
    deps = {
        "channel": ch,
        "brain": Brain(anthropic.Anthropic(), config.WAPY_MODEL),
        "store": ConversationStore(tempfile.mktemp(suffix=".db")),
        "fiche": FicheLoader(gspread_reader, config.FICHE_TTL_SECONDS),
        "staff_numbers": STAFF,
        "rng": random.Random(1),
    }
    client = TestClient(create_app(deps))
    print(f"Modèle : {config.WAPY_MODEL} | Staff (escalade) : {STAFF}\n" + "=" * 64)

    scenarios = [
        ("FAQ (prix)", _webhook("C'est combien le poulet braisé ?")),
        ("Réservation -> escalade", _webhook("Je veux réserver une table pour 4 ce soir")),
        ("Message après escalade (doit être ignoré)", _webhook("Et vous avez un parking ?")),
        ("Opt-out d'un autre client", _webhook("STOP", frm="2290100000000@c.us")),
    ]
    for label, payload in scenarios:
        before = len(ch.sent)
        r = client.post("/webhook", json=payload)
        status = r.json().get("status")
        print(f"\n▶ {label}")
        print(f"  Client   : « {payload['payload']['body']} »  (from {payload['payload']['from']})")
        print(f"  Statut   : {status}")
        for to, text in ch.sent[before:]:
            who = "STAFF 🔔" if to in STAFF else "client 🤖"
            print(f"  Envoi -> {who} {to} : {text}")


if __name__ == "__main__":
    main()
