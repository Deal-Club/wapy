"""Escalade humaine : alerte le staff du resto sur WhatsApp et fige la conversation.
L'employé reprend ensuite la main depuis le WhatsApp du resto (WAHA = appareil lié)."""


def escalate_to_staff(channel, store, chat_id, incoming_text, staff_numbers, reason):
    store.set_escalated(chat_id)
    alerte = (
        "🔔 Un client attend une réponse humaine.\n"
        f"Client : {chat_id}\n"
        f"Message : « {incoming_text} »\n"
        f"Motif : {reason}\n"
        "Réponds-lui depuis le WhatsApp du resto."
    )
    for num in staff_numbers:
        try:
            channel.send_text(num, alerte)
        except Exception:
            # Une alerte staff qui échoue ne doit pas casser le traitement.
            pass
