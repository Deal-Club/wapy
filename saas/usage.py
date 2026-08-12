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
