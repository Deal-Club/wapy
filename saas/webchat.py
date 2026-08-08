"""Chatbot web embarquable (widget iframe) — canal parallèle à WhatsApp.

Le visiteur d'un site client discute avec le même cerveau, nourri par la même
config d'établissement (fiche + base de connaissances + connecteur de données).
Pas de compte WhatsApp : conversation anonyme identifiée par une clé de session
navigateur. L'escalade « humain » notifie le responsable avec le transcript et le
contact laissé (optionnel) par le visiteur.
"""
import re
import secrets

from brain.brain import Brain, decide_with_lookup
from saas import models, connector
from saas.config_repo import build_fiche_text, get_config

HISTORY_LIMIT = 20
MAX_MSG = 2000

_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(r"(?:\+?\d[\d\s.\-]{6,}\d)")


def new_widget_key() -> str:
    return "wk_" + secrets.token_urlsafe(18)


def get_or_create_session(session, tenant_id: int, session_key: str):
    sess = (
        session.query(models.WebChatSession)
        .filter_by(tenant_id=tenant_id, session_key=session_key)
        .first()
    )
    if not sess:
        sess = models.WebChatSession(tenant_id=tenant_id, session_key=session_key)
        session.add(sess)
        session.commit()
    return sess


def _history(session, sess) -> list[dict]:
    rows = (
        session.query(models.WebChatMessage)
        .filter_by(session_id=sess.id)
        .order_by(models.WebChatMessage.id.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in reversed(rows)]


def _add_msg(session, sess, role: str, content: str) -> None:
    session.add(models.WebChatMessage(session_id=sess.id, role=role, content=content or ""))
    from datetime import datetime
    sess.last_at = datetime.utcnow()
    session.commit()


def _capture_contact(session, sess, text: str) -> None:
    if sess.contact:
        return
    m = _EMAIL.search(text or "")
    if not m:
        p = _PHONE.search(text or "")
        m = p if p else None
    if m:
        sess.contact = m.group(0).strip()[:255]
        session.commit()


def reply(session, tenant, sess, message: str, brain: Brain, notify=None, feats=None) -> dict:
    """Traite un message du visiteur et renvoie {reply, escalated}."""
    feats = feats or set()
    message = (message or "").strip()[:MAX_MSG]
    if not message:
        return {"reply": "", "escalated": bool(sess.escalated)}

    history = _history(session, sess)
    _add_msg(session, sess, "user", message)
    _capture_contact(session, sess, message)

    fiche = build_fiche_text(session, tenant.id)
    cfg = get_config(session, tenant.id)

    # Rendez-vous (si inclus) : mêmes créneaux que sur WhatsApp.
    book_slot = None
    if "booking" in feats:
        from datetime import datetime
        from saas import booking
        bcfg = booking.cfg_of(cfg)
        if bcfg.get("enabled"):
            ups = (session.query(models.Booking)
                   .filter(models.Booking.tenant_id == tenant.id,
                           models.Booking.status == "booked",
                           models.Booking.start >= datetime.utcnow()).all())
            slots = booking.free_slots(bcfg, [booking.to_local(bcfg, b.start) for b in ups])
            svc = ", ".join((x.get("name") or "") for x in bcfg.get("services", [])) or "prestation"
            if slots:
                lines = "\n".join(f"- [{s:%Y-%m-%dT%H:%M}] {booking.human(s)}" for s in slots)
                fiche += ("\n\n## Rendez-vous\nRéservation possible. Services : " + svc +
                          ".\nCréneaux disponibles (utilise l'horodatage entre crochets pour "
                          "book_datetime) :\n" + lines)

            def book_slot(dt_iso, service, chat_id, name, _b=bcfg):
                try:
                    local_dt = datetime.fromisoformat((dt_iso or "").strip()).replace(second=0, microsecond=0)
                except Exception:
                    return (False, "Je n'ai pas bien compris le créneau, pouvez-vous préciser ?")
                start_utc = booking.to_utc(_b, local_dt)
                cnt = session.query(models.Booking).filter_by(
                    tenant_id=tenant.id, status="booked", start=start_utc).count()
                if cnt >= int(_b.get("capacity") or 1):
                    return (False, "Ce créneau vient d'être pris, souhaitez-vous un autre horaire ?")
                session.add(models.Booking(
                    tenant_id=tenant.id, chat_id=chat_id, customer_name=name or "",
                    service=service or "Rendez-vous", start=start_utc,
                    duration_min=booking.service_duration(_b, service), status="booked"))
                session.commit()
                return (True, f"C'est confirmé : {service or 'votre rendez-vous'} le {booking.human(local_dt)}. À très bientôt ! 🗓️")

    # Connecteur de données (si inclus) : le cerveau peut interroger la base.
    lookup_fn = None
    if "data_connector" in feats:
        dc = session.get(models.DataConnector, tenant.id)
        fiche += connector.fiche_note(dc)
        lookup_fn = connector.lookup_fn_for(dc)

    decision = decide_with_lookup(brain, fiche, history, message, lookup_fn, channel="web")
    chat_id = f"web:{sess.session_key}"
    out = decision.message

    if decision.action == "book" and book_slot:
        ok, confirm = book_slot(decision.book_datetime, decision.book_service, chat_id,
                                sess.contact or "")
        out = confirm or decision.message
        if ok and notify:
            notify(f"📅 Nouveau rendez-vous (site web)\n{confirm}\nContact : {sess.contact or '—'}")
        if ok:
            _store_record(session, tenant.id, chat_id, "Rendez-vous", confirm)
    elif decision.action == "record":
        _store_record(session, tenant.id, chat_id, decision.record_type or "Demande", decision.record)
        if notify:
            notify(f"📝 {decision.record_type or 'Demande'} (site web)\n{decision.record}\n"
                   f"Contact : {sess.contact or '—'}")
    elif decision.action == "escalate":
        sess.escalated = True
        session.commit()
        if not sess.contact:
            out = (decision.message or "Je transmets votre demande à un responsable.") + \
                  "\nPour être recontacté(e), laissez-moi votre numéro ou e-mail (facultatif)."
        if notify:
            transcript = "\n".join(f"{'👤' if m['role'] == 'user' else '🤖'} {m['content']}"
                                   for m in _history(session, sess)[-8:])
            notify(f"🆘 Un visiteur du site souhaite un échange humain.\n"
                   f"Contact : {sess.contact or '(non fourni)'}\n\nDerniers messages :\n{transcript}")

    _add_msg(session, sess, "assistant", out)
    return {"reply": out, "escalated": bool(sess.escalated)}


def _store_record(session, tenant_id, chat_id, kind, content):
    try:
        from saas.store_db import DbStore
        DbStore(session, tenant_id).add_record(chat_id, kind, content)
    except Exception:
        session.rollback()
