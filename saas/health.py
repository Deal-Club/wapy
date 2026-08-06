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


async def run_health_loop(session_factory, wa_module, interval: int = 120):
    """Boucle de supervision (lancée au démarrage de l'API)."""
    logger.info("Supervision des sessions WhatsApp démarrée (toutes les %ss).", interval)
    while True:
        try:
            await asyncio.to_thread(check_once, session_factory, wa_module)
        except Exception as e:
            logger.error("Supervision : cycle en erreur : %s", e)
        await asyncio.sleep(interval)
