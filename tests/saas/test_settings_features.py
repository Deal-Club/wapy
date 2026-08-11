from sqlalchemy.orm import sessionmaker

from channel.base import IncomingMessage
from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, config_repo, phone, recaptcha
from saas.bot import process_incoming


def _sf():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


def test_same_number_suffix_and_format():
    assert phone.same_number("22961040461", "061040461")       # indicatif/trunk 0
    assert phone.same_number("22961040461@c.us", "22961040461")
    assert not phone.same_number("22961040461", "22990362070")
    assert not phone.same_number("", "123")


def test_is_blocked():
    assert config_repo.is_blocked("22961040461@c.us", ["061040461"])
    assert not config_repo.is_blocked("22990362070@c.us", ["061040461"])


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
    def decide(self, fiche, history, text, channel="whatsapp", extra=""):
        return Decision("reply", "Bonjour !", "ok")


def test_blocklist_blocks_only_listed_numbers():
    sf = _sf(); s = sf()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    t.staff_numbers = "st@c.us"
    config_repo.save_config(s, t.id, {"blocked_numbers": ["061040461"]})
    s.commit()
    r = process_incoming(s, _Ch(), _Brain(), t,
                         {"event": "message", "payload": {"from": "22961040461@c.us", "body": "hi", "id": "m1"}})
    assert r["status"] == "blocked"
    r2 = process_incoming(s, _Ch(), _Brain(), t,
                          {"event": "message", "payload": {"from": "22990362070@c.us", "body": "hi", "id": "m2"}})
    assert r2["status"] == "replied"


def test_ai_gen_monthly_counter():
    from saas import usage, billing
    sf = _sf(); s = sf()
    _, t = auth.signup(s, "ai@b.com", "x", "T")
    assert usage.ai_gen_count(s, t.id) == 0
    for i in range(1, 4):
        assert usage.ai_gen_bump(s, t.id) == i
    assert usage.ai_gen_count(s, t.id) == 3
    assert billing.AI_GENERATE_PER_MONTH >= 1


def test_recaptcha_disabled_is_passthrough(monkeypatch):
    monkeypatch.delenv("RECAPTCHA_SECRET", raising=False)
    monkeypatch.delenv("RECAPTCHA_SITE_KEY", raising=False)
    assert recaptcha.enabled() is False
    assert recaptcha.verify("") is True   # non configuré -> ne bloque pas


def test_recaptcha_enabled_rejects_bad_token(monkeypatch):
    monkeypatch.setenv("RECAPTCHA_SECRET", "sec")
    monkeypatch.setenv("RECAPTCHA_SITE_KEY", "site")

    class _R:
        def json(self):
            return {"success": False}

    monkeypatch.setattr(recaptcha.requests, "post", lambda *a, **k: _R())
    assert recaptcha.enabled() is True
    assert recaptcha.verify("bad-token") is False
