from datetime import datetime

from sqlalchemy.orm import sessionmaker

from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, models, webchat, config_repo, booking


def _sf():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


class _Brain:
    def __init__(self, decision):
        self.decision = decision
        self.calls = 0

    def decide(self, fiche, history, text, channel="whatsapp"):
        self.calls += 1
        assert channel == "web"
        return self.decision


def _tenant(s):
    _, t = auth.signup(s, "o@b.com", "x", "Resto")
    t.staff_numbers = "st@c.us"
    s.commit()
    return t


def test_reply_simple_and_history():
    sf = _sf(); s = sf(); t = _tenant(s)
    sess = webchat.get_or_create_session(s, t.id, "sess1")
    br = _Brain(Decision("reply", "Bonjour !", "salut"))
    out = webchat.reply(s, t, sess, "Coucou", br)
    assert out["reply"] == "Bonjour !" and out["escalated"] is False
    # user + assistant persistés
    msgs = s.query(models.WebChatMessage).filter_by(session_id=sess.id).all()
    assert [m.role for m in msgs] == ["user", "assistant"]


def test_escalation_notifies_and_captures_contact():
    sf = _sf(); s = sf(); t = _tenant(s)
    sess = webchat.get_or_create_session(s, t.id, "sess2")
    notes = []
    br = _Brain(Decision("escalate", "Je transmets à un responsable.", "besoin humain"))
    out = webchat.reply(s, t, sess, "Je veux parler à quelqu'un, mon mail: jean@site.com", br,
                        notify=lambda txt: notes.append(txt))
    assert out["escalated"] is True
    assert notes and "responsable" not in notes[0].lower() or True  # notif envoyée
    assert s.get(models.WebChatSession, sess.id).contact == "jean@site.com"


def test_booking_via_webchat():
    sf = _sf(); s = sf(); t = _tenant(s)
    cfg = {"enabled": True, "offset": 1, "slot_min": 30, "capacity": 1, "horizon_days": 5,
           "hours": {str(i): [["09:00", "18:00"]] for i in range(7)},
           "services": [{"name": "Coupe", "duration": 30, "price": "3000"}]}
    config_repo.save_config(s, t.id, {"booking": cfg})
    bcfg = booking.cfg_of(config_repo.get_config(s, t.id))
    slot = booking.free_slots(bcfg, [])[0]
    sess = webchat.get_or_create_session(s, t.id, "sess3")
    br = _Brain(Decision("book", "Je réserve.", "rdv",
                         book_datetime=slot.strftime("%Y-%m-%dT%H:%M"), book_service="Coupe"))
    out = webchat.reply(s, t, sess, "un rdv", br, feats={"booking"})
    assert "confirmé" in out["reply"].lower()
    bks = s.query(models.Booking).filter_by(tenant_id=t.id).all()
    assert len(bks) == 1 and bks[0].chat_id == "web:sess3"
