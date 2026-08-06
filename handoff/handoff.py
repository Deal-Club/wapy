"""Escalade humaine : alerte le staff du resto sur WhatsApp et ouvre un handoff.

Le boss répond à l'alerte pour transmettre au client (relais géré dans app.py),
et tape /fin pour rendre la conversation au bot. Le client reçoit un accusé
immédiat pour ne pas rester sans réponse."""
import logging

logger = logging.getLogger("wapy.handoff")

CLIENT_ACK = (
    "Merci ! Je transmets votre demande à notre équipe, "
    "on revient vers vous très vite. 🙏"
)


def escalate_to_staff(channel, store, chat_id, incoming_text, staff_numbers, reason):
    store.set_escalated(chat_id)
    alerte = (
        "🔔 Un client attend une réponse humaine.\n"
        f"Client : {chat_id}\n"
        f"Message : « {incoming_text} »\n"
        f"Motif : {reason}\n\n"
        "➡️ Répondez à ce message pour transmettre au client.\n"
        "Tapez /fin pour rendre la conversation au bot."
    )
    if not staff_numbers:
        logger.error(
            "Escalade sans destinataire : aucun numéro staff vérifié pour ce client %s. "
            "Le boss ne sera PAS alerté.", chat_id
        )
    delivered = 0
    for num in staff_numbers:
        store.open_handoff(num, chat_id)
        try:
            channel.send_text(num, alerte)
            delivered += 1
        except Exception as e:
            # Ne casse pas le traitement, mais l'échec doit être VISIBLE (diagnostic ban / mauvais numéro).
            logger.error("Alerte staff non envoyée à %s : %s", num, e)
    # Accusé au client : il sait qu'un humain va lui répondre.
    try:
        channel.send_text(chat_id, CLIENT_ACK)
    except Exception as e:
        logger.error("Accusé client non envoyé à %s : %s", chat_id, e)
    return delivered
