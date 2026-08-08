from datetime import datetime

from sqlalchemy.orm import sessionmaker

from channel.base import IncomingMessage
from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, models, booking, config_repo
from saas.bot import process_incoming


def _sf():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


CFG = {
    "enabled": True, "offset": 1, "slot_min": 30, "capacity": 1, "horizon_days": 5,
    "hours": {str(i): [["09:00", "18:00"]] for i in range(7)},
    "services": [{"name": "Coupe", "duration": 30, "price": "3000"}],
}


def test_free_slots_generate_and_exclude_taken():
    ref = datetime(2026, 8, 10, 8, 0)  # lundi
    slots = booking.free_slots({**CFG, "hours": {"0": [["09:00", "11:00"]]}, "horizon_days": 1}, [], ref_local=ref)
    assert slots[0] == datetime(2026, 8, 10, 9, 0)
    assert datetime(2026, 8, 10, 10, 30) in slots
    assert datetime(2026, 8, 10, 11, 0) not in slots  # fin d'horaire
    taken = booking.free_slots({**CFG, "hours": {"0": [["09:00", "11:00"]]}, "horizon_days": 1},
                               [datetime(2026, 8, 10, 9, 0)], ref_local=ref)
    assert datetime(2026, 8, 10, 9, 0) not in taken


class _Ch:
    def __init__(self):
        self.sent = []

    def parse_incoming(self, payload):
        p = payload["payload"]
        return IncomingMessage(p["from"], p.get("body", ""), False, False, p.get("id", ""))

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))
        return None


class _Brain:
    def __init__(self, decision):
        self.decision = decision

    def decide(self, fiche, history, text, channel="whatsapp"):
        return self.decision


def test_booking_end_to_end():
    sf = _sf()
    s = sf()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    t.staff_numbers = "st@c.us"
    config_repo.save_config(s, t.id, {"booking": CFG})
    s.commit()

    bcfg = booking.cfg_of(config_repo.get_config(s, t.id))
    dt = booking.free_slots(bcfg, [])[0]  # premier créneau libre à venir
    brain = _Brain(Decision("book", "Je réserve.", "rdv",
                            book_datetime=dt.strftime("%Y-%m-%dT%H:%M"), book_service="Coupe"))
    ch = _Ch()
    r = process_incoming(s, ch, brain, t, {"event": "message", "payload": {"from": "cl@c.us", "body": "un rdv svp", "id": "m1"}})
    assert r["status"] == "booked"
    bks = s.query(models.Booking).filter_by(tenant_id=t.id).all()
    assert len(bks) == 1 and bks[0].service == "Coupe"
    assert any(to == "cl@c.us" and "confirmé" in txt.lower() for to, txt in ch.sent)
    # créneau désormais occupé -> une 2e demande sur le même créneau propose une alternative
    r2 = process_incoming(s, ch, brain, t, {"event": "message", "payload": {"from": "cl2@c.us", "body": "meme creneau", "id": "m2"}})
    assert s.query(models.Booking).filter_by(tenant_id=t.id, status="booked").count() == 1
