"""Abonnement des établissements à Wapy (facturation opérateur via GeniusPay).

C'est WAPY (l'opérateur) qui encaisse l'abonnement des établissements, avec SES
propres clés GeniusPay (variables d'environnement, un seul compte marchand).
À ne pas confondre avec un éventuel encaissement des clients finaux par les
établissements (non géré ici).
"""
import os

PERIOD_DAYS = 30

# Prix en XOF/mois. À ajuster selon la grille tarifaire réelle.
PLANS = {
    "starter": {"label": "Starter", "price": 5000, "desc": "1 WhatsApp, jusqu'à 500 conversations/mois"},
    "pro": {"label": "Pro", "price": 15000, "desc": "Volume plus élevé + priorité support"},
    "business": {"label": "Business", "price": 40000, "desc": "Usage intensif + accompagnement"},
}


class _OperatorCfg:
    api_key = ""
    api_secret = ""


def operator_cfg():
    cfg = _OperatorCfg()
    cfg.api_key = os.environ.get("GENIUSPAY_API_KEY", "").strip()
    cfg.api_secret = os.environ.get("GENIUSPAY_API_SECRET", "").strip()
    return cfg


def operator_webhook_secret() -> str:
    return os.environ.get("GENIUSPAY_WEBHOOK_SECRET", "").strip()


def billing_enabled() -> bool:
    c = operator_cfg()
    return bool(c.api_key and c.api_secret)


def plans_public() -> list[dict]:
    return [{"key": k, "label": v["label"], "price": v["price"], "desc": v["desc"]} for k, v in PLANS.items()]
