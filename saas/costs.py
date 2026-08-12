"""Coût réel de l'IA, par établissement et par tâche.

Pourquoi ce module existe : `usage.py` compte des messages, pas de l'argent. Un
message sur Opus 5 coûte cinq fois un message sur Haiku, et un message avec cache
amorcé coûte dix fois moins que le même sans cache. Compter les messages ne dit
donc rien de la marge — et sans cette mesure, arbitrer entre qualité et coût se
fait au jugé.

Chaque réponse de l'API porte déjà le détail (`usage.input_tokens`,
`cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens`) : il
suffisait de ne plus le jeter.

Le coût est stocké en micro-dollars (entier) et non en flottant : additionner des
flottants sur des milliers d'appels dérive, et une facture ne se négocie pas à
l'arrondi près.
"""
import datetime
import os

from saas import models

# Tarifs publics Anthropic, en dollars par million de tokens (entrée, sortie).
#
# Sonnet 5 est au tarif de liste (3/15) et NON au tarif promotionnel (2/10) en
# vigueur jusqu'au 31/08/2026 : une prévision de marge doit se faire sur le prix
# qu'on paiera, pas sur celui qu'on paie ce mois-ci.
TARIFS = {
    "claude-haiku-4-5-20251001": (1.0, 5.0),
    "claude-haiku-4-5": (1.0, 5.0),
    "claude-sonnet-5": (3.0, 15.0),
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-opus-5": (5.0, 25.0),
    "claude-opus-4-8": (5.0, 25.0),
}
# Modèle inconnu : on facture au tarif le plus cher connu plutôt que zéro. Une
# sous-estimation silencieuse est le pire des deux comportements possibles.
TARIF_PAR_DEFAUT = (5.0, 25.0)

# Multiplicateurs de cache. Lecture = 0,1x le tarif d'entrée. Écriture = 2x avec
# le TTL d'une heure retenu par `brain.CACHE_TTL` (1,25x seulement en TTL 5 min).
MULT_CACHE_LECTURE = 0.1
MULT_CACHE_ECRITURE = 2.0


def taux_xof() -> float:
    """Dollar -> franc CFA. Le XOF est arrimé à l'euro, le taux ne bouge qu'avec lui."""
    try:
        return float(os.environ.get("USD_XOF", "600"))
    except ValueError:
        return 600.0


def cout_micro_usd(modele: str, conso: dict) -> int:
    """Coût d'un appel en micro-dollars, à partir des compteurs `usage` de l'API."""
    entree, sortie = TARIFS.get(modele, TARIF_PAR_DEFAUT)
    usd = (
        conso.get("entree", 0) * entree
        + conso.get("cache_lecture", 0) * entree * MULT_CACHE_LECTURE
        + conso.get("cache_ecriture", 0) * entree * MULT_CACHE_ECRITURE
        + conso.get("sortie", 0) * sortie
    ) / 1_000_000
    return round(usd * 1_000_000)


def _mois() -> str:
    return datetime.date.today().strftime("%Y-%m")


def enregistrer(session, tenant_id: int, tache: str, modele: str, conso: dict) -> int:
    """Ajoute la consommation d'un appel au compteur du mois. Renvoie son coût.

    Ne lève jamais : une écriture de télémétrie qui échoue ne doit pas faire
    perdre la réponse déjà produite pour le client.
    """
    if not conso or not any(conso.values()):
        return 0
    cout = cout_micro_usd(modele, conso)
    try:
        mois = _mois()
        ligne = (
            session.query(models.AiCost)
            .filter_by(tenant_id=tenant_id, month=mois, task=tache, model=modele)
            .first()
        )
        if not ligne:
            ligne = models.AiCost(tenant_id=tenant_id, month=mois, task=tache, model=modele)
            session.add(ligne)
            session.flush()
        ligne.calls = (ligne.calls or 0) + 1
        ligne.tokens_in = (ligne.tokens_in or 0) + conso.get("entree", 0)
        ligne.tokens_out = (ligne.tokens_out or 0) + conso.get("sortie", 0)
        ligne.tokens_cache_read = (ligne.tokens_cache_read or 0) + conso.get("cache_lecture", 0)
        ligne.tokens_cache_write = (ligne.tokens_cache_write or 0) + conso.get("cache_ecriture", 0)
        ligne.cost_micro_usd = (ligne.cost_micro_usd or 0) + cout
        session.commit()
    except Exception:
        session.rollback()
    return cout


def modele_tache(tache: str, modele_plan: str) -> str:
    """Modèle à employer pour une tâche annexe (vision, config, learn).

    Le modèle du plan ne sert qu'au cerveau conversationnel : cf. l'en-tête de
    `billing.MODELES_TACHES`. Une tâche inconnue retombe sur le modèle du plan,
    pour qu'ajouter un appel quelque part ne le fasse jamais tourner « nulle part ».
    """
    from saas import billing

    return billing.MODELES_TACHES.get(tache, modele_plan)


def modele_effectif(session, tenant, sub) -> str:
    """Modèle du cerveau, dégradé d'un cran si le coût du mois dépasse le plafond.

    Filet contre le cas extrême : un établissement en illimité qui consomme plus
    que son abonnement ne rapporte. On dégrade au lieu de couper — un bot qui
    répond un peu moins bien reste un bot qui répond.
    """
    from saas import billing

    modele = tenant.wapy_model or billing.PLANS["essentiel"]["model"]
    plan = getattr(sub, "plan", "") if sub is not None else ""
    statut = getattr(sub, "status", "") if sub is not None else ""
    # Pas de plafond hors abonnement payant actif : un essai n'a pas de prix de
    # référence, et le dégrader saboterait précisément la période qui convertit.
    if statut != "active" or plan not in billing.PLANS:
        return modele
    plafond = billing.plafond_xof(plan)
    if plafond <= 0:
        return modele
    depense_xof = cout_du_mois(session, tenant.id) / 1_000_000 * taux_xof()
    if depense_xof < plafond:
        return modele
    return billing.DEGRADATION.get(modele, modele)


def cout_du_mois(session, tenant_id: int) -> int:
    """Coût IA cumulé de l'établissement sur le mois en cours, en micro-dollars."""
    lignes = session.query(models.AiCost).filter_by(tenant_id=tenant_id, month=_mois()).all()
    return sum(l.cost_micro_usd or 0 for l in lignes)


def detail_du_mois(session, tenant_id: int) -> dict:
    """Coût du mois ventilé par tâche, prêt pour l'UI (montants en FCFA)."""
    lignes = session.query(models.AiCost).filter_by(tenant_id=tenant_id, month=_mois()).all()
    taux = taux_xof()
    par_tache: dict[str, int] = {}
    for l in lignes:
        par_tache[l.task] = par_tache.get(l.task, 0) + (l.cost_micro_usd or 0)
    total = sum(par_tache.values())
    return {
        "mois": _mois(),
        "total_xof": round(total / 1_000_000 * taux, 2),
        "par_tache_xof": {t: round(v / 1_000_000 * taux, 2) for t, v in par_tache.items()},
        "appels": sum(l.calls or 0 for l in lignes),
    }
