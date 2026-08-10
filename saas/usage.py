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
