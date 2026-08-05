"""Test manuel : lit la fiche resto depuis Google Sheets et affiche ce que Wapy voit.

Usage : python tools/test_fiche_read.py
Prérequis : credentials.json à la racine, Sheet partagé avec le compte de service,
config.SHEET_NAME = nom exact du classeur.
"""
import sys

# Force l'UTF-8 en sortie (console Windows en cp1252 sinon).
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from config import SHEET_NAME
from fiche.loader import gspread_reader, flatten


def main():
    print(f"Lecture du Google Sheet : « {SHEET_NAME} »\n")
    try:
        data = gspread_reader()
    except Exception as e:
        print(f"❌ Échec de lecture : {type(e).__name__}: {e}")
        print("\nPistes : nom du classeur ≠ SHEET_NAME, Sheet non partagé avec le "
              "compte de service, ou onglets mal nommés (Infos/Menu/FAQ).")
        sys.exit(1)

    print(f"✓ Infos : {len(data['infos'])} ligne(s) | "
          f"Menu : {len(data['menu'])} ligne(s) | FAQ : {len(data['faq'])} ligne(s)\n")
    print("===== FICHE VUE PAR LE CERVEAU (aplatie dans le prompt) =====\n")
    print(flatten(data["infos"], data["menu"], data["faq"]))


if __name__ == "__main__":
    main()
