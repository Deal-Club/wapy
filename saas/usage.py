"""Compteur d'usage par tenant (messages entrants/sortants) — socle facturation."""
import datetime

from saas import models


def _today() -> str:
    return datetime.date.today().isoformat()


def bump(session, tenant_id: int, in_delta: int = 0, out_delta: int = 0) -> None:
    day = _today()
    row = session.query(models.UsageCounter).filter_by(tenant_id=tenant_id, day=day).first()
    if not row:
        row = models.UsageCounter(tenant_id=tenant_id, day=day, messages_in=0, messages_out=0)
        session.add(row)
        session.flush()
    row.messages_in = (row.messages_in or 0) + in_delta
    row.messages_out = (row.messages_out or 0) + out_delta
    session.commit()


def _month() -> str:
    return datetime.date.today().strftime("%Y-%m")


def ai_gen_count(session, tenant_id: int) -> int:
    """Nombre de générations IA déjà consommées ce mois-ci."""
    row = session.query(models.AiGenUsage).filter_by(tenant_id=tenant_id, month=_month()).first()
    return (row.count if row else 0) or 0


def ai_gen_bump(session, tenant_id: int) -> int:
    """Incrémente le compteur de générations IA du mois. Renvoie le total à jour."""
    m = _month()
    row = session.query(models.AiGenUsage).filter_by(tenant_id=tenant_id, month=m).first()
    if not row:
        row = models.AiGenUsage(tenant_id=tenant_id, month=m, count=0)
        session.add(row)
        session.flush()
    row.count = (row.count or 0) + 1
    session.commit()
    return row.count


# --- Quota de conversations ------------------------------------------------
#
# Le quota était déclaré dans `billing.PLANS` depuis l'origine et appliqué nulle
# part : un établissement pouvait consommer sans borne un forfait borné. C'est
# le seul poste dont le coût grandit indéfiniment, donc le seul qui pouvait
# transformer un client en perte.
#
# Ce qui se passe au plafond est délibéré : les conversations DÉJÀ engagées ce
# mois-ci continuent normalement, seuls les NOUVEAUX interlocuteurs reçoivent un
# message d'attente et déclenchent une alerte au responsable. Couper tout le
# monde d'un coup punirait des clients qui n'y sont pour rien ; le message
# d'attente ne coûte rien (aucun appel au modèle) et laisse une porte humaine.


def conversations_du_mois(session, tenant_id: int) -> int:
    return (
        session.query(models.MonthlyConversation)
        .filter_by(tenant_id=tenant_id, month=_month())
        .count()
    )


def conversation_connue(session, tenant_id: int, chat_id: str) -> bool:
    """Cet interlocuteur a-t-il déjà été compté ce mois-ci ?"""
    return (
        session.query(models.MonthlyConversation)
        .filter_by(tenant_id=tenant_id, month=_month(), chat_id=chat_id or "")
        .first()
        is not None
    )


def noter_conversation(session, tenant_id: int, chat_id: str) -> None:
    """Compte l'interlocuteur pour le mois. Idempotent (contrainte d'unicité)."""
    if not chat_id or conversation_connue(session, tenant_id, chat_id):
        return
    session.add(models.MonthlyConversation(
        tenant_id=tenant_id, month=_month(), chat_id=chat_id))
    try:
        session.commit()
    except Exception:
        # Course entre deux messages du même interlocuteur : l'unicité a tranché,
        # la ligne existe, il n'y a rien à réparer.
        session.rollback()


def quota_atteint(session, tenant_id: int, chat_id: str, limite: int) -> bool:
    """Vrai si ce message doit être refusé faute de quota.

    `limite` à 0 = illimité. Un interlocuteur déjà compté passe toujours : on ne
    coupe pas une conversation en cours au milieu.
    """
    if not limite:
        return False
    if conversation_connue(session, tenant_id, chat_id):
        return False
    return conversations_du_mois(session, tenant_id) >= limite


# --- Quota du canal TikTok -------------------------------------------------
#
# Compteur SÉPARÉ de celui des conversations WhatsApp, et c'est délibéré. Sous
# une vidéo qui marche, les commentateurs se comptent par centaines dans la
# journée : les faire tomber dans le quota WhatsApp ferait sauter le forfait d'un
# établissement dès la première vidéo réussie, sur un canal qui coûte pourtant
# moins cher (aucun historique de conversation à recharger à chaque réponse).
#
# On compte les RÉPONSES ÉMISES, pas les interlocuteurs : sous une vidéo la même
# personne commente souvent plusieurs fois, et c'est chaque réponse qui coûte un
# appel au modèle.


def tiktok_du_mois(session, tenant_id: int, kind: str = "") -> int:
    q = session.query(models.TikTokUsage).filter_by(tenant_id=tenant_id, month=_month())
    if kind:
        q = q.filter_by(kind=kind)
    return sum(r.count or 0 for r in q.all())


def noter_reponse_tiktok(session, tenant_id: int, kind: str = "comment") -> int:
    """Incrémente le compteur du mois. Renvoie le total à jour, tous types confondus."""
    m = _month()
    row = (session.query(models.TikTokUsage)
           .filter_by(tenant_id=tenant_id, month=m, kind=kind).first())
    if not row:
        row = models.TikTokUsage(tenant_id=tenant_id, month=m, kind=kind, count=0)
        session.add(row)
        session.flush()
    row.count = (row.count or 0) + 1
    session.commit()
    return tiktok_du_mois(session, tenant_id)


def quota_tiktok_atteint(session, tenant_id: int, limite: int) -> bool:
    """Vrai si l'établissement a épuisé son quota TikTok du mois.

    ATTENTION : la convention est l'INVERSE de `quota_atteint`. Ici `limite <= 0`
    signifie « aucun droit » et bloque, là où 0 vaut « illimité » pour les
    conversations. TikTok est vendu en option : l'absence de quota accordé veut
    dire que l'option n'a pas été souscrite, jamais qu'elle est sans limite.
    Interpréter 0 comme illimité offrirait le canal à qui ne l'a pas acheté.
    """
    if limite <= 0:
        return True
    return tiktok_du_mois(session, tenant_id) >= limite


def totals(session, tenant_id: int) -> dict:
    rows = session.query(models.UsageCounter).filter_by(tenant_id=tenant_id).all()
    return {
        "messages_in": sum(r.messages_in or 0 for r in rows),
        "messages_out": sum(r.messages_out or 0 for r in rows),
        "days": [
            {"day": r.day, "in": r.messages_in or 0, "out": r.messages_out or 0}
            for r in sorted(rows, key=lambda x: x.day)
        ],
    }
