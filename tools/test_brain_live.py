"""Test manuel du cerveau en conditions réelles : lit la fiche + interroge Claude.

Charge .env (pour ANTHROPIC_API_KEY / WAPY_MODEL), lit la fiche Google Sheets,
puis envoie quelques messages types au cerveau et affiche la décision.

Usage : python -m tools.test_brain_live
Prérequis : credentials.json + Sheet partagé + ANTHROPIC_API_KEY dans .env
"""
import os
import sys

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
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if key and val and key not in os.environ:
            os.environ[key] = val


_load_dotenv()

if not os.environ.get("ANTHROPIC_API_KEY"):
    print("❌ ANTHROPIC_API_KEY absente. Ajoute-la dans wapy/.env :")
    print("   ANTHROPIC_API_KEY=sk-ant-...")
    sys.exit(1)

import anthropic
import config
from fiche.loader import gspread_reader, flatten
from brain.brain import Brain

MESSAGES = [
    "Bonjour, vous êtes ouverts ce soir ?",
    "C'est combien le poisson braisé ?",
    "Vous acceptez MTN MoMo ?",
    "Vous avez des plats végétariens ?",
    "Je veux réserver une table pour 6 personnes samedi soir",
]


def main():
    data = gspread_reader()
    fiche_text = flatten(data["infos"], data["menu"], data["faq"])
    brain = Brain(anthropic.Anthropic(), config.WAPY_MODEL)
    print(f"Modèle : {config.WAPY_MODEL}\n" + "=" * 60)
    for msg in MESSAGES:
        d = brain.decide(fiche_text, history=[], incoming_text=msg)
        print(f"\n👤 Client   : {msg}")
        if d.action == "reply":
            print(f"🤖 Wapy     : {d.message}")
        else:
            print(f"🔔 ESCALADE : (motif : {d.reason})")


if __name__ == "__main__":
    main()
