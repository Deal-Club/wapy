"""Orchestration du bot en multi-tenant. Réutilise brain/handoff/safety.

`handle_message` = logique pure (fakes-friendly), identique au webhook mono-tenant
mais paramétrée par tenant (config, store, numéros staff).
`process_incoming` câble le tenant (store DB + fiche DB + config staff).
"""
import logging
import os

from safety.guards import is_group, is_broadcast, detect_optout
from handoff.handoff import escalate_to_staff
from saas.store_db import DbStore
from saas.config_repo import build_fiche_text
from saas import phone, usage

logger = logging.getLogger("wapy.saas")

HISTORY_LIMIT = 20
HANDBACK_CMDS = {"/fin", "fin", "/bot", "terminé", "termine"}
# Base interne pour que WAHA récupère les images servies par l'API.
MEDIA_BASE = os.environ.get("MEDIA_INTERNAL_BASE", "http://api:8000")
# Statuts qui ont émis un message sortant (compteur d'usage).
_SENT_STATUSES = {"replied", "recorded", "escalated", "relayed", "forwarded", "handback"}


def _safe_send(channel, to: str, text: str) -> None:
    try:
        channel.send_text(to, text)
    except Exception:
        pass


def _csv(value: str | None) -> list[str]:
    return [x.strip() for x in (value or "").split(",") if x.strip()]


def handle_message(channel, store, brain, fiche_text, staff_send, staff_recognize, payload):
    msg = channel.parse_incoming(payload)
    if msg is None:
        return {"status": "ignored"}
    if msg.from_me or msg.is_group or is_broadcast(msg.chat_id) or is_group(msg.chat_id):
        return {"status": "ignored"}

    if msg.id and store.is_processed(msg.id):
        return {"status": "duplicate"}
    if msg.id:
        store.mark_processed(msg.id)

    if getattr(msg, "sender_name", "") and hasattr(store, "set_name"):
        store.set_name(msg.chat_id, msg.sender_name)

    logger.info("IN %s : %s", msg.chat_id, msg.text[:200])

    # Relais boss <-> client
    if msg.chat_id in staff_recognize:
        client_id = store.latest_open_handoff_client()
        if msg.text.strip().lower() in HANDBACK_CMDS:
            if client_id:
                store.resolve_handoffs_for_client(client_id)
                store.clear_escalated(client_id)
                _safe_send(channel, msg.chat_id, "🔁 Conversation rendue au bot.")
                return {"status": "handback"}
            _safe_send(channel, msg.chat_id, "Aucune conversation en cours.")
            return {"status": "staff-idle"}
        if client_id:
            channel.send_text(client_id, msg.text)
            return {"status": "relayed"}
        return {"status": "staff-idle"}

    if store.is_optout(msg.chat_id):
        return {"status": "handed_off"}
    if detect_optout(msg.text):
        store.set_optout(msg.chat_id)
        store.resolve_handoffs_for_client(msg.chat_id)
        return {"status": "optout"}

    # Handoff bidirectionnel : message du client transmis au staff
    if store.is_escalated(msg.chat_id):
        label = f"💬 Client {msg.chat_id} :\n{msg.text}"
        for num in staff_send:
            _safe_send(channel, num, label)
        return {"status": "forwarded"}

    # Bot
    store.append(msg.chat_id, "user", msg.text)
    history = store.get_history(msg.chat_id, HISTORY_LIMIT)
    decision = brain.decide(fiche_text, history, msg.text)
    if decision.action == "reply":
        img = getattr(decision, "image", "") or ""
        if img and hasattr(channel, "send_image"):
            url = img if img.startswith("http") else MEDIA_BASE + img
            try:
                channel.send_image(msg.chat_id, url, caption=decision.message)
            except Exception:
                channel.send_text(msg.chat_id, decision.message)
        else:
            channel.send_text(msg.chat_id, decision.message)
        store.append(msg.chat_id, "assistant", decision.message)
        return {"status": "replied"}

    if decision.action == "record":
        # Le bot conclut l'action lui-même, l'enregistre, NOTIFIE le staff sans lui passer la main.
        channel.send_text(msg.chat_id, decision.message)
        store.append(msg.chat_id, "assistant", decision.message)
        if hasattr(store, "add_record"):
            store.add_record(msg.chat_id, decision.record_type, decision.record)
        note = (
            f"📝 {decision.record_type or 'Demande'} enregistrée par l'assistant\n"
            f"Client {msg.chat_id} :\n{decision.record}"
        )
        for num in staff_send:
            _safe_send(channel, num, note)
        return {"status": "recorded"}

    escalate_to_staff(channel, store, msg.chat_id, msg.text, staff_send, decision.reason)
    return {"status": "escalated"}


def process_incoming(session, channel, brain, tenant, payload):
    store = DbStore(session, tenant.id)
    fiche_text = build_fiche_text(session, tenant.id)
    # Normalise en JID @c.us : une valeur legacy sans suffixe (ex. "22961040461")
    # partait dans le vide (WAHA renvoie 201 mais ne délivre pas).
    staff_send = [phone.to_jid(n) for n in _csv(tenant.staff_numbers) if phone.to_jid(n)]
    staff_recognize = list(set(staff_send) | set(_csv(tenant.staff_inbound_ids)))
    result = handle_message(
        channel, store, brain, fiche_text, staff_send, staff_recognize, payload
    )
    status = result.get("status")
    if status not in ("ignored", "duplicate"):
        usage.bump(
            session,
            tenant.id,
            in_delta=1,
            out_delta=1 if status in _SENT_STATUSES else 0,
        )
    return result
