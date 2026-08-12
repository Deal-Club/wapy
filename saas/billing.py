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

# Plans mensuels. limits : 0 = illimité. Prix en XOF.
#
# LES TROIS PLANS TOURNENT SUR LE MÊME MODÈLE, ET C'EST DÉLIBÉRÉ.
# `tools/eval_prompt.py` rejoue 8 scénarios réels (escalade, justificatif de
# paiement, prix listé, horodatage exact d'un créneau). Haiku 4.5 les passe 8/8,
# Sonnet 5 aussi — pour environ 3,7x le coût sur un travail identique. Vendre un
# modèle plus cher comme différence de plan, c'est facturer un écart que rien ne
# mesure et que le client ne perçoit pas.
#
# Les plans se différencient donc sur ce qui crée vraiment de la valeur et que le
# code sait contrôler : le VOLUME de conversations et les FONCTIONS. Qui veut
# quand même le modèle supérieur prend l'option `modele_avance`, facturée à son
# coût réel.
#
# Limite assumée de cette décision : l'éval sature à 8/8, elle ne discrimine pas
# au-dessus de cette barre et ne couvre pas les conversations longues ou
# ambiguës. Si un écart apparaît un jour, il apparaîtra d'abord là.
MODELE_STANDARD = "claude-haiku-4-5-20251001"
MODELE_AVANCE = "claude-sonnet-5"

PLANS = {
    "essentiel": {
        "label": "Starter", "price": 9900, "model": MODELE_STANDARD,
        "features": ["handoff", "records", "knowledge"],
        "limits": {"conversations": 500, "agents": 1, "documents": 3},
    },
    "pro": {
        "label": "Pro", "price": 24900, "model": MODELE_STANDARD,
        "features": ["handoff", "records", "knowledge", "vision", "voice", "suggestions", "booking", "webchat", "priority_support"],
        "limits": {"conversations": 2000, "agents": 3, "documents": 10},
    },
    "business": {
        "label": "Business", "price": 49900, "model": MODELE_STANDARD,
        "features": ["handoff", "records", "knowledge", "vision", "voice", "suggestions", "booking", "webchat", "data_connector", "priority_support"],
        # Plus d'illimité sur les conversations : c'était le seul poste dont le
        # coût grandit sans borne, sur le plan qui promettait de ne pas le borner.
        "limits": {"conversations": 6000, "agents": 0, "documents": 0},
    },
}

# --- Modèle par TÂCHE ------------------------------------------------------
#
# Le modèle du plan ne vaut que pour le cerveau conversationnel : c'est le seul
# que le client entend, donc le seul qui différencie les plans. Les tâches
# annexes tournaient elles aussi sur le modèle du plan, ce qui faisait lire un
# reçu Mobile Money sur Opus 5 — cinq fois le prix de la même extraction, sans
# que personne ne perçoive la différence.
#
# Chaque tâche est donc épinglée au modèle le moins cher qui la fait BIEN, quel
# que soit le plan payé. Pour deux d'entre elles c'est une hausse de qualité sur
# Starter, pour Business une baisse de coût : les deux vont dans le bon sens.
MODELES_TACHES = {
    # Lecture des justificatifs de paiement. Sonnet 5 et non Haiku : Haiku plafonne
    # à 1 568 px quand Sonnet 5 monte à 2 576 px, et une capture d'écran de Mobile
    # Money est exactement le cas « image dense ou dégradée ». Un montant mal lu est
    # une erreur commerciale, pas une approximation.
    "vision": "claude-sonnet-5",
    # Génération de la fiche à l'inscription. Plafonnée à AI_GENERATE_PER_MONTH
    # appels par mois, donc le coût est borné — et c'est la toute première
    # impression du client. C'est l'endroit où dépenser PLUS, pas moins.
    "config": "claude-sonnet-5",
    # Suggestions d'amélioration de la fiche. Haiku assumé : c'est la tâche au plus
    # gros volume d'entrée (toutes les conversations récentes), et sa sortie passe
    # par une validation humaine (accepter / rejeter) avant d'avoir le moindre effet.
    # Une suggestion faible est rejetée d'un clic ; elle ne casse rien.
    "learn": "claude-haiku-4-5-20251001",
}

# --- Garde-fou de marge ----------------------------------------------------
#
# Part du prix du plan au-delà de laquelle le coût IA du mois fait basculer le
# cerveau d'un cran vers le bas. À 50 %, un établissement normal ne l'atteint
# jamais : c'est un filet contre le cas extrême (usage industriel sur un forfait
# illimité), pas un rationnement.
#
# Dégrader plutôt que couper est délibéré : un bot qui répond un peu moins bien
# reste un bot qui répond. Un bot coupé, c'est un client perdu.
PART_COUT_MAX = 0.5

# Cran du dessous pour chaque modèle. Haiku est le plancher : on ne descend pas
# en dessous, la dégradation s'arrête là.
DEGRADATION = {
    "claude-opus-5": "claude-sonnet-5",
    "claude-opus-4-8": "claude-sonnet-5",
    "claude-sonnet-5": "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6": "claude-haiku-4-5-20251001",
}


def plafond_xof(plan_key: str) -> int:
    """Coût IA mensuel au-delà duquel on dégrade. 0 = pas de plafond connu."""
    prix = PLANS.get(plan_key, {}).get("price", 0)
    return int(prix * PART_COUT_MAX)


# Add-ons : s'ajoutent au prix et débloquent un service (feature) ou augmentent une limite (grant).
ADDONS = {
    "vision": {"label": "Lecture des justificatifs", "price": 4000, "feature": "vision"},
    "voice": {"label": "Notes vocales (transcription)", "price": 4000, "feature": "voice"},
    "suggestions": {"label": "Suggestions IA", "price": 3000, "feature": "suggestions"},
    "booking": {"label": "Prise de rendez-vous", "price": 5000, "feature": "booking"},
    "webchat": {"label": "Chatbot pour site web", "price": 6000, "feature": "webchat"},
    "data_connector": {"label": "Connexion base de l'entreprise", "price": 9000, "feature": "data_connector"},
    "priority_support": {"label": "Support prioritaire", "price": 6000, "feature": "priority_support"},
    # Prix aligné sur le coût marginal réel d'une conversation (cf. saas/costs.py)
    # et sur le pas d'un changement de plan : Pro -> Business achète 4 000
    # conversations pour 25 000 F, soit le même ordre de prix à l'unité.
    "conversations_1000": {"label": "+1 000 conversations/mois", "price": 6900, "grant": {"conversations": 1000}},
    # Seule option qui change le modèle du cerveau. Facturée au-dessus du surcoût
    # mesuré (~3,7x sur l'entrée) pour que l'option finance ce qu'elle consomme.
    "modele_avance": {"label": "Réponses avancées (modèle supérieur)", "price": 9900, "model": MODELE_AVANCE},
    "agents_3": {"label": "+3 agents", "price": 4000, "grant": {"agents": 3}},
    "documents_10": {"label": "+10 documents", "price": 3000, "grant": {"documents": 10}},
}

_ALL_FEATURES = set(FEATURES.keys())
_UNLIMITED = {"conversations": 0, "agents": 0, "documents": 0}
# Essai : toutes les fonctions, mais le MÊME modèle que les plans payants.
# Faire tourner l'essai sur un modèle supérieur reviendrait à faire découvrir le
# produit sous une forme qu'on ne vend pas : la conversion se paierait d'une
# déception le huitième jour. Les conversations restent plafonnées au quota du
# plan d'entrée — un essai n'a pas à être un forfait illimité.
TRIAL_ENT = {
    "features": _ALL_FEATURES,
    "limits": {"conversations": 500, "agents": 1, "documents": 3},
    "model": MODELE_STANDARD,
}
GRANDFATHER_ENT = {"features": _ALL_FEATURES, "limits": dict(_UNLIMITED), "model": ""}
EXPIRED_ENT = {"features": set(), "limits": {"conversations": 1, "agents": 1, "documents": 0}, "model": MODELE_STANDARD}


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
    modele = plan["model"]
    for a in _clean_addons(addons):
        ad = ADDONS[a]
        if ad.get("feature"):
            feats.add(ad["feature"])
        if ad.get("model"):
            modele = ad["model"]
        for k, v in (ad.get("grant") or {}).items():
            if limits.get(k, 0) != 0:  # 0 = illimité : on ne rajoute rien
                limits[k] = limits.get(k, 0) + v
    return {"features": feats, "limits": limits, "model": modele}


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
