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
_SENT_STATUSES = {"replied", "recorded", "escalated", "relayed", "forwarded", "handback", "pay-link", "booked"}


def _safe_send(channel, to: str, text: str) -> None:
    try:
        channel.send_text(to, text)
    except Exception:
        pass


def _csv(value: str | None) -> list[str]:
    return [x.strip() for x in (value or "").split(",") if x.strip()]


def handle_message(channel, store, brain, fiche_text, staff_send, staff_recognize, payload, pay_link=None, book_slot=None):
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

    if decision.action == "book":
        # Prise de RDV : on valide le créneau et on crée la réservation.
        ok, confirm = False, decision.message
        if book_slot:
            try:
                ok, confirm = book_slot(decision.book_datetime, decision.book_service, msg.chat_id, getattr(msg, "sender_name", ""))
            except Exception:
                ok, confirm = False, decision.message
        channel.send_text(msg.chat_id, confirm or decision.message)
        store.append(msg.chat_id, "assistant", confirm or decision.message)
        if ok:
            for num in staff_send:
                _safe_send(channel, num, f"📅 Nouveau rendez-vous\nClient {msg.chat_id}\n{confirm}")
            if hasattr(store, "add_record"):
                store.add_record(msg.chat_id, "Rendez-vous", confirm)
        return {"status": "booked" if ok else "replied"}

    escalate_to_staff(channel, store, msg.chat_id, msg.text, staff_send, decision.reason)
    return {"status": "escalated"}


def process_incoming(session, channel, brain, tenant, payload, vision_analyze=None, transcribe=None):
    # Média : on télécharge une fois et on classe sur le VRAI mimetype (fiable),
    # au lieu de deviner le type depuis le webhook.
    #  - image  -> vision (lecture des justificatifs de paiement)
    #  - audio  -> transcription (le bot répond au contenu) ; sinon note vocale
    # Droits d'abonnement (fonctionnalités incluses).
    from saas import billing
    _feats = billing.tenant_entitlements(session.get(models.Subscription, tenant.id))["features"]

    if hasattr(channel, "fetch_media"):
        raw = channel.parse_incoming(payload)
        if raw and getattr(raw, "media_url", ""):
            mtype = (getattr(raw, "media_type", "") or "").lower()
            p = payload.setdefault("payload", {})
            if mtype.startswith("image/") and vision_analyze and "vision" in _feats:
                media = channel.fetch_media(raw.media_url)
                if media:
                    try:
                        desc = vision_analyze(media[0], media[1] or mtype)
                    except Exception:
                        desc = ""
                    if desc:
                        p["body"] = ((p.get("body") or "") + f"\n[Image reçue, analyse : {desc}]").strip()
            elif mtype.startswith("audio/"):
                media = channel.fetch_media(raw.media_url) if "voice" in _feats else None
                if "voice" in _feats and not media:
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

    # Rendez-vous : si activé et inclus dans l'abonnement, on injecte les créneaux
    # disponibles dans la fiche et on fournit de quoi réserver.
    book_slot = None
    if "booking" in _feats:
        from datetime import datetime, timedelta
        from saas import booking, config_repo
        bcfg = booking.cfg_of(config_repo.get_config(session, tenant.id))
        if bcfg.get("enabled"):
            ups = (
                session.query(models.Booking)
                .filter(models.Booking.tenant_id == tenant.id, models.Booking.status == "booked",
                        models.Booking.start >= datetime.utcnow())
                .all()
            )
            taken_local = [booking.to_local(bcfg, b.start) for b in ups]
            slots = booking.free_slots(bcfg, taken_local)
            if slots:
                lines = "\n".join(f"- [{s:%Y-%m-%dT%H:%M}] {booking.human(s)}" for s in slots)
                svc = ", ".join((x.get("name") or "") for x in bcfg.get("services", [])) or "prestation"
                fiche_text += (
                    "\n\n## Rendez-vous\nRéservation possible. Services : " + svc +
                    ".\nCréneaux disponibles (utilise l'horodatage entre crochets pour book_datetime) :\n" + lines
                )

            def book_slot(dt_iso, service, chat_id, name, _b=bcfg):
                try:
                    local_dt = datetime.fromisoformat((dt_iso or "").strip()).replace(second=0, microsecond=0)
                except Exception:
                    return (False, "Je n'ai pas bien compris le créneau souhaité, pouvez-vous préciser ?")
                start_utc = booking.to_utc(_b, local_dt)
                cap = int(_b.get("capacity") or 1)
                cnt = session.query(models.Booking).filter_by(
                    tenant_id=tenant.id, status="booked", start=start_utc).count()
                if cnt >= cap:
                    ups2 = (session.query(models.Booking)
                            .filter(models.Booking.tenant_id == tenant.id, models.Booking.status == "booked",
                                    models.Booking.start >= datetime.utcnow()).all())
                    alt = booking.free_slots(_b, [booking.to_local(_b, b.start) for b in ups2], max_slots=4)
                    altmsg = " ; ".join(booking.human(a) for a in alt) or "aucune pour le moment"
                    return (False, f"Ce créneau vient d'être pris. Autres disponibilités : {altmsg}.")
                bk_row = models.Booking(
                    tenant_id=tenant.id, chat_id=chat_id, customer_name=name or "",
                    service=service or "Rendez-vous", start=start_utc,
                    duration_min=booking.service_duration(_b, service), status="booked")
                session.add(bk_row)
                session.commit()
                # Miroir Google Calendar (best-effort : ne bloque jamais la réservation).
                try:
                    from saas import gcal
                    ga = session.get(models.GoogleAuth, tenant.id)
                    if ga and ga.refresh_token and gcal.enabled():
                        eid = gcal.create_event(
                            ga.refresh_token, ga.calendar_id,
                            f"{service or 'Rendez-vous'} — {name or chat_id}",
                            start_utc, booking.service_duration(_b, service),
                            description=f"Client : {name or '—'}\nWhatsApp : {chat_id}")
                        if eid:
                            bk_row.gcal_event_id = eid
                            session.commit()
                except Exception:
                    logger.exception("Synchro Google Calendar échouée (RDV tenant %s)", tenant.id)
                return (True, f"C'est confirmé : {service or 'votre rendez-vous'} le {booking.human(local_dt)}. À très bientôt ! 🗓️")

    result = handle_message(
        channel, store, brain, fiche_text, staff_send, staff_recognize, payload,
        pay_link=None, book_slot=book_slot
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
