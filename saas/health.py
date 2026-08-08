"""Supervision des sessions WhatsApp (par tenant).

Un poller interroge WAHA périodiquement, met à jour le statut de chaque session,
et journalise un incident quand une session passe d'un état sain (WORKING) à un
état dégradé (déconnexion, QR réapparu, échec/ban). Le propriétaire voit une
bannière sur son dashboard ; l'admin voit l'historique.
"""
import asyncio
import logging
from datetime import datetime

from saas import models

logger = logging.getLogger("wapy.health")

WORKING = "WORKING"
# États qui exigent une action du propriétaire (reconnexion / re-scan).
DOWN_STATES = {"FAILED", "STOPPED"}
SCAN_STATES = {"SCAN_QR_CODE", "STARTING", "UNPAIRED"}


def classify(status: str) -> str:
    if status == WORKING:
        return "ok"
    if status in DOWN_STATES:
        return "down"
    if status in SCAN_STATES:
        return "scan"
    return "unknown"


def check_once(session_factory, wa_module) -> int:
    """Un cycle de supervision. Renvoie le nombre d'incidents journalisés."""
    try:
        statuses = {s.get("name"): s.get("status", "UNKNOWN") for s in wa_module.list_sessions()}
    except Exception as e:
        logger.error("Supervision : impossible de lister les sessions WAHA : %s", e)
        return 0

    incidents = 0
    s = session_factory()
    try:
        for row in s.query(models.WaSession).all():
            new = statuses.get(row.session_name)
            if new is None:
                continue
            old = row.status
            # Transition d'un état sain vers un état dégradé -> incident.
            if old == WORKING and new != WORKING:
                s.add(models.SessionIncident(
                    tenant_id=row.tenant_id, status=new, note=f"{old} -> {new}"
                ))
                incidents += 1
                logger.warning("Session %s dégradée : %s -> %s", row.session_name, old, new)
            row.status = new
            if new == WORKING:
                row.last_seen = datetime.utcnow()
        s.commit()
    finally:
        s.close()
    return incidents


def _send_resub_reminder(s, wa_module, tenant):
    """Relance de réabonnement : WhatsApp au responsable + e-mail au propriétaire."""
    import os
    from saas import models, notify, phone

    public = os.environ.get("PUBLIC_URL", "")
    wa_msg = (
        "⏰ Votre accès Wapy est suspendu (période terminée).\n"
        f"Réabonnez-vous pour réactiver votre assistant : {public}/dashboard"
    )
    try:
        channel = wa_module.channel_for(tenant)
        for n in [x.strip() for x in (tenant.staff_numbers or "").split(",") if x.strip()]:
            jid = phone.to_jid(n)
            if jid:
                try:
                    channel.send_text(jid, wa_msg)
                except Exception:
                    pass
    except Exception:
        pass
    owner = s.query(models.User).filter_by(tenant_id=tenant.id, role="owner").first()
    if owner:
        html = notify.render_email(
            title="Votre abonnement a expiré",
            intro=f"Bonjour, l'accès Wapy pour « {tenant.name} » est actuellement suspendu.",
            lines=[
                "Votre assistant ne répond plus à vos clients tant que l'abonnement n'est pas renouvelé.",
                "Réactivez-le en quelques secondes depuis votre tableau de bord.",
            ],
            cta_label="Réactiver mon assistant",
            cta_url=f"{public}/dashboard",
        )
        notify.send_email(
            owner.email, "Votre abonnement Wapy a expiré",
            f"Bonjour,\n\nVotre accès Wapy pour « {tenant.name} » est suspendu.\n"
            f"Réabonnez-vous ici : {public}/dashboard\n\nL'équipe Wapy.",
            html=html,
        )


def enforce_subscriptions(session_factory, wa_module) -> int:
    """Expire les essais/abonnements arrivés à terme : coupe le bot + relance (une fois)."""
    from saas import models

    now = datetime.utcnow()
    expired = 0
    s = session_factory()
    try:
        subs = (
            s.query(models.Subscription)
            .filter(models.Subscription.status.in_(["trial", "active"]))
            .all()
        )
        for sub in subs:
            if sub.current_period_end and sub.current_period_end < now:
                tenant = s.get(models.Tenant, sub.tenant_id)
                sub.status = "expired"
                if tenant:
                    tenant.status = "suspended"
                s.commit()
                expired += 1
                logger.warning("Abonnement expiré : tenant %s -> suspendu", sub.tenant_id)
                if tenant:
                    _send_resub_reminder(s, wa_module, tenant)
    finally:
        s.close()
    return expired


async def run_health_loop(session_factory, wa_module, interval: int = 120):
    """Boucle de supervision + facturation (lancée au démarrage de l'API)."""
    logger.info("Supervision + facturation démarrées (toutes les %ss).", interval)
    while True:
        try:
            await asyncio.to_thread(check_once, session_factory, wa_module)
            await asyncio.to_thread(enforce_subscriptions, session_factory, wa_module)
        except Exception as e:
            logger.error("Boucle santé/facturation en erreur : %s", e)
        await asyncio.sleep(interval)
