"""Abonnement des établissements à Wapy (facturation opérateur via GeniusPay).

- Essai gratuit de 7 jours à l'inscription (tout inclus) -> puis coupure si non payé.
- Plans à fonctionnalités + add-ons à la carte (le prix s'ajoute, le service se
  débloque). Les DROITS (entitlements) sont calculés côté serveur et contrôlés à
  chaque usage : on ne fait jamais confiance au client.

C'est WAPY (l'opérateur) qui encaisse, avec SES clés GeniusPay (variables d'env,
un seul compte marchand). Rien à voir avec un encaissement des clients finaux.
"""
import os

PERIOD_DAYS = 30
TRIAL_DAYS = 7
CURRENCY = "XOF"
# Garde-fou : générations « Remplir avec l'IA » autorisées par mois et par établissement.
AI_GENERATE_PER_MONTH = 3

# Catalogue des fonctionnalités (services) activables.
FEATURES = {
    "handoff": "Transfert au responsable (escalade humaine)",
    "records": "Carnet (réservations, commandes)",
    "knowledge": "Base de connaissances (documents)",
    "vision": "Lecture des justificatifs de paiement (images)",
    "voice": "Transcription des notes vocales",
    "suggestions": "Suggestions IA d'amélioration",
    "booking": "Prise de rendez-vous / réservations",
    "webchat": "Chatbot pour site web (widget à intégrer)",
    "data_connector": "Connexion à la base de l'entreprise (stock, produits)",
    "priority_support": "Support prioritaire",
}

# Plans mensuels. limits : 0 = illimité. Prix en XOF (à ajuster librement).
PLANS = {
    "essentiel": {
        "label": "Starter", "price": 10000, "model": "claude-haiku-4-5-20251001",
        "features": ["handoff", "records", "knowledge"],
        "limits": {"conversations": 500, "agents": 1, "documents": 3},
    },
    "pro": {
        "label": "Pro", "price": 25000, "model": "claude-sonnet-5",
        "features": ["handoff", "records", "knowledge", "vision", "voice", "suggestions", "booking", "webchat", "priority_support"],
        "limits": {"conversations": 2500, "agents": 3, "documents": 10},
    },
    "business": {
        "label": "Business", "price": 40000, "model": "claude-opus-5",
        "features": ["handoff", "records", "knowledge", "vision", "voice", "suggestions", "booking", "webchat", "data_connector", "priority_support"],
        "limits": {"conversations": 0, "agents": 0, "documents": 0},
    },
}

# Add-ons : s'ajoutent au prix et débloquent un service (feature) ou augmentent une limite (grant).
ADDONS = {
    "vision": {"label": "Lecture des justificatifs", "price": 4000, "feature": "vision"},
    "voice": {"label": "Notes vocales (transcription)", "price": 4000, "feature": "voice"},
    "suggestions": {"label": "Suggestions IA", "price": 3000, "feature": "suggestions"},
    "booking": {"label": "Prise de rendez-vous", "price": 5000, "feature": "booking"},
    "webchat": {"label": "Chatbot pour site web", "price": 6000, "feature": "webchat"},
    "data_connector": {"label": "Connexion base de l'entreprise", "price": 9000, "feature": "data_connector"},
    "priority_support": {"label": "Support prioritaire", "price": 6000, "feature": "priority_support"},
    "conversations_1000": {"label": "+1 000 conversations/mois", "price": 5000, "grant": {"conversations": 1000}},
    "agents_3": {"label": "+3 agents", "price": 4000, "grant": {"agents": 3}},
    "documents_10": {"label": "+10 documents", "price": 3000, "grant": {"documents": 10}},
}

_ALL_FEATURES = set(FEATURES.keys())
_UNLIMITED = {"conversations": 0, "agents": 0, "documents": 0}
# Essai et tenants d'avant la facturation : tout inclus.
TRIAL_ENT = {"features": _ALL_FEATURES, "limits": dict(_UNLIMITED), "model": "claude-sonnet-5"}
GRANDFATHER_ENT = {"features": _ALL_FEATURES, "limits": dict(_UNLIMITED), "model": ""}
EXPIRED_ENT = {"features": set(), "limits": {"conversations": 1, "agents": 1, "documents": 0}, "model": "claude-haiku-4-5-20251001"}


def _clean_addons(addons):
    return [a for a in (addons or []) if a in ADDONS]


def price_for(plan_key: str, addons=None) -> int:
    total = PLANS.get(plan_key, {}).get("price", 0)
    for a in _clean_addons(addons):
        total += ADDONS[a]["price"]
    return total


def entitlements_for(plan_key: str, addons=None) -> dict:
    plan = PLANS.get(plan_key)
    if not plan:
        return dict(EXPIRED_ENT)
    feats = set(plan["features"])
    limits = dict(plan["limits"])
    for a in _clean_addons(addons):
        ad = ADDONS[a]
        if ad.get("feature"):
            feats.add(ad["feature"])
        for k, v in (ad.get("grant") or {}).items():
            if limits.get(k, 0) != 0:  # 0 = illimité : on ne rajoute rien
                limits[k] = limits.get(k, 0) + v
    return {"features": feats, "limits": limits, "model": plan["model"]}


def tenant_entitlements(sub) -> dict:
    """Droits effectifs d'un établissement selon son abonnement."""
    if sub is None:
        return GRANDFATHER_ENT  # tenants existants avant la facturation
    if sub.status == "trial":
        return TRIAL_ENT
    if sub.status == "active":
        return entitlements_for(sub.plan, getattr(sub, "addons", None) or [])
    return EXPIRED_ENT


def has_feature(sub, feature: str) -> bool:
    return feature in tenant_entitlements(sub)["features"]


# --- Clés opérateur (env) ---
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


def catalogue() -> dict:
    """Grille publique (plans + add-ons + features) pour l'UI."""
    return {
        "currency": CURRENCY,
        "trial_days": TRIAL_DAYS,
        "features": FEATURES,
        "plans": [
            {"key": k, "label": v["label"], "price": v["price"],
             "features": v["features"], "limits": v["limits"]}
            for k, v in PLANS.items()
        ],
        "addons": [
            {"key": k, "label": v["label"], "price": v["price"],
             "feature": v.get("feature", ""), "grant": v.get("grant", {})}
            for k, v in ADDONS.items()
        ],
    }
