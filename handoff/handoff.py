"""Escalade humaine : alerte le staff du resto sur WhatsApp et ouvre un handoff.

Le boss répond à l'alerte pour transmettre au client (relais géré dans app.py),
et tape /fin pour rendre la conversation au bot. Le client reçoit un accusé
immédiat pour ne pas rester sans réponse."""

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
    for num in staff_numbers:
        store.open_handoff(num, chat_id)
        try:
            channel.send_text(num, alerte)
        except Exception:
            # Une alerte staff qui échoue ne doit pas casser le traitement.
            pass
    # Accusé au client : il sait qu'un humain va lui répondre.
    try:
        channel.send_text(chat_id, CLIENT_ACK)
    except Exception:
        pass
