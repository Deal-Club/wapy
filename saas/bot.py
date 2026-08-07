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
from saas import models, phone, usage

logger = logging.getLogger("wapy.saas")

HISTORY_LIMIT = 20
HANDBACK_CMDS = {"/fin", "fin", "/bot", "terminé", "termine"}
# Base interne pour que WAHA récupère les images servies par l'API.
MEDIA_BASE = os.environ.get("MEDIA_INTERNAL_BASE", "http://api:8000")
# Statuts qui ont émis un message sortant (compteur d'usage).
_SENT_STATUSES = {"replied", "recorded", "escalated", "relayed", "forwarded", "handback", "pay-link"}


def _safe_send(channel, to: str, text: str) -> None:
    try:
        channel.send_text(to, text)
    except Exception:
        pass


def _csv(value: str | None) -> list[str]:
    return [x.strip() for x in (value or "").split(",") if x.strip()]


def handle_message(channel, store, brain, fiche_text, staff_send, staff_recognize, payload, pay_link=None):
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

    # Relais boss <-> client. Cible = le client dont le responsable a CITÉ le message
    # (multi-conversations), sinon la dernière escalade ouverte.
    if msg.chat_id in staff_recognize:
        target = None
        if getattr(msg, "quoted_id", "") and hasattr(store, "client_for_alert"):
            target = store.client_for_alert(msg.quoted_id)
        if not target:
            target = store.latest_open_handoff_client()
        if msg.text.strip().lower() in HANDBACK_CMDS:
            if target:
                store.resolve_handoffs_for_client(target)
                store.clear_escalated(target)
                _safe_send(channel, msg.chat_id, "🔁 Conversation rendue au bot.")
                return {"status": "handback"}
            _safe_send(channel, msg.chat_id, "Aucune conversation en cours.")
            return {"status": "staff-idle"}
        if target:
            channel.send_text(target, msg.text)
            # Range la réponse humaine dans l'historique du client : le cerveau saura
            # que la demande a été traitée et ne ré-escaladera pas au prochain message.
            store.append(target, "assistant", msg.text)
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
        store.append(msg.chat_id, "user", msg.text)  # garde l'historique complet
        label = f"💬 Client {msg.chat_id} :\n{msg.text}\n(Citez ce message pour lui répondre.)"
        for num in staff_send:
            try:
                mid = channel.send_text(num, label)
                if mid and hasattr(store, "map_alert"):
                    store.map_alert(mid, msg.chat_id)
            except Exception:
                pass
            if getattr(msg, "media_url", "") and hasattr(channel, "send_image"):
                try:
                    channel.send_image(num, msg.media_url, caption=f"Pièce jointe du client {msg.chat_id}")
                except Exception:
                    pass
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

    if decision.action == "pay":
        # Paiement en ligne : génère un lien GeniusPay et l'envoie au client.
        amt = int(getattr(decision, "pay_amount", 0) or 0)
        url = ""
        if pay_link and amt >= 200:
            try:
                url = pay_link(amt, decision.record or decision.message, msg.chat_id)
            except Exception:
                url = ""
        if url:
            full = f"{decision.message}\n{url}"
            channel.send_text(msg.chat_id, full)
            store.append(msg.chat_id, "assistant", full)
            for num in staff_send:
                _safe_send(channel, num, f"💳 Lien de paiement ({amt} XOF) envoyé au client {msg.chat_id}.")
            return {"status": "pay-link"}
        # Paiement en ligne indisponible/échoué -> message seul (guidage manuel).
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
            # Transfère le justificatif (capture de paiement) au responsable pour vérif.
            if getattr(msg, "media_url", "") and hasattr(channel, "send_image"):
                try:
                    channel.send_image(num, msg.media_url, caption="Justificatif reçu du client")
                except Exception:
                    pass
        return {"status": "recorded"}

    escalate_to_staff(channel, store, msg.chat_id, msg.text, staff_send, decision.reason)
    return {"status": "escalated"}


def process_incoming(session, channel, brain, tenant, payload, vision_analyze=None, transcribe=None):
    # Média : on télécharge une fois et on classe sur le VRAI mimetype (fiable),
    # au lieu de deviner le type depuis le webhook.
    #  - image  -> vision (lecture des justificatifs de paiement)
    #  - audio  -> transcription (le bot répond au contenu) ; sinon note vocale
    if hasattr(channel, "fetch_media"):
        raw = channel.parse_incoming(payload)
        if raw and getattr(raw, "media_url", ""):
            mtype = (getattr(raw, "media_type", "") or "").lower()
            p = payload.setdefault("payload", {})
            if mtype.startswith("image/") and vision_analyze:
                media = channel.fetch_media(raw.media_url)
                if media:
                    try:
                        desc = vision_analyze(media[0], media[1] or mtype)
                    except Exception:
                        desc = ""
                    if desc:
                        p["body"] = ((p.get("body") or "") + f"\n[Image reçue, analyse : {desc}]").strip()
            elif mtype.startswith("audio/"):
                media = channel.fetch_media(raw.media_url)
                if not media:
                    logger.warning("Vocal : téléchargement média échoué (%s)", raw.media_url)
                txt = ""
                if media and transcribe:
                    try:
                        txt = transcribe(media[0], media[1] or mtype)
                    except Exception as e:
                        logger.error("Transcription échouée : %s", e)
                if txt.strip():
                    logger.info("Vocal transcrit (%d car) : %s", len(txt), txt[:80])
                # Transcrit -> le bot répond au contenu ; sinon -> note vocale (il demande d'écrire).
                p["body"] = txt.strip() if txt and txt.strip() else "[Le client a envoyé une note vocale.]"

    store = DbStore(session, tenant.id)
    fiche_text = build_fiche_text(session, tenant.id)
    # Normalise en JID @c.us : une valeur legacy sans suffixe (ex. "22961040461")
    # partait dans le vide (WAHA renvoie 201 mais ne délivre pas).
    staff_send = [phone.to_jid(n) for n in _csv(tenant.staff_numbers) if phone.to_jid(n)]
    staff_recognize = list(set(staff_send) | set(_csv(tenant.staff_inbound_ids)))

    # Auto-reconnaissance du personnel (le responsable répond depuis son tel avec un
    # @lid ≠ du @c.us d'alerte -> sinon le bot lui répond comme à un client) :
    #  1) SIGNAL CERTAIN : il a CITÉ (reply) une de nos alertes -> c'est le staff.
    #  2) Secours : son @lid se résout (via WAHA store) vers un numéro staff.
    raw = channel.parse_incoming(payload)
    if raw and raw.chat_id not in staff_recognize:
        is_staff = False
        if getattr(raw, "quoted_id", "") and store.client_for_alert(raw.quoted_id):
            is_staff = True
        elif (
            raw.chat_id.endswith("@lid")
            and staff_send
            and hasattr(channel, "resolve_lid")
            and store.latest_open_handoff_client()
        ):
            pn = channel.resolve_lid(raw.chat_id)
            if pn and pn in set(staff_send):
                is_staff = True
        if is_staff:
            ids = _csv(tenant.staff_inbound_ids)
            if raw.chat_id not in ids:
                tenant.staff_inbound_ids = ",".join(ids + [raw.chat_id])
                session.commit()
            staff_recognize = list(set(staff_recognize) | {raw.chat_id})
            logger.info("Staff auto-reconnu (%s) : %s", "citation" if raw.quoted_id else "résolution @lid", raw.chat_id)

    # Paiement en ligne : si l'établissement a configuré GeniusPay, on indique au
    # cerveau que c'est dispo et on lui fournit de quoi générer un lien.
    pay_link = None
    pay_cfg = session.get(models.PaymentConfig, tenant.id)
    if pay_cfg and pay_cfg.enabled and pay_cfg.api_key and pay_cfg.api_secret:
        fiche_text += (
            "\n\n## Paiement en ligne\nDisponible (Wave, Orange Money, MTN Money, carte). "
            "Utilise action='pay' avec le montant total en XOF pour envoyer un lien de paiement."
        )

        def pay_link(amount, description, chat_id, _cfg=pay_cfg, _tid=tenant.id):
            from saas import geniuspay
            public = os.environ.get("PUBLIC_URL", "")
            res = geniuspay.create_payment(
                _cfg, amount, description, {},
                {"tenant_id": _tid, "chat_id": chat_id},
                success_url=public, error_url=public,
            )
            session.add(models.Payment(
                tenant_id=_tid, chat_id=chat_id, reference=res.get("reference", ""),
                amount=amount, description=(description or "")[:500],
                status="pending", checkout_url=res.get("url", ""),
            ))
            session.commit()
            return res.get("url", "")

    result = handle_message(
        channel, store, brain, fiche_text, staff_send, staff_recognize, payload, pay_link=pay_link
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
