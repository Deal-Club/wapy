from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from channel.base import IncomingMessage
from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, models, wa
from saas.app import create_app


class _Ch:
    def __init__(self):
        self.sent = []

    def parse_incoming(self, payload):
        p = payload["payload"]
        cid = p["from"]
        return IncomingMessage(
            cid, p["body"], p.get("fromMe", False), cid.endswith("@g.us"), p.get("id", "")
        )

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _Brain:
    def __init__(self, decision):
        self.decision = decision

    def decide(self, fiche_text, history, incoming_text):
        return self.decision


def _factory():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


def test_signup_login_via_api():
    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    r = c.post("/auth/signup", json={"email": "a@b.com", "password": "secret123", "resto_nom": "Chez Test"})
    assert r.status_code == 200 and "token" in r.json()
    r2 = c.post("/auth/signup", json={"email": "A@b.com", "password": "x", "resto_nom": "T2"})
    assert r2.status_code == 400  # email dupliqué
    assert c.post("/auth/login", json={"email": "a@b.com", "password": "secret123"}).status_code == 200
    assert c.post("/auth/login", json={"email": "a@b.com", "password": "wrong"}).status_code == 401


def test_webhook_routes_to_tenant_and_replies():
    sf = _factory()
    ch = _Ch()
    app = create_app(
        session_factory=sf,
        channel_factory=lambda tenant: ch,
        brain=_Brain(Decision("reply", "Bonjour !", "salut")),
    )
    s = sf()
    _, tenant = auth.signup(s, "a@b.com", "x", "Chez Test")
    s.add(models.WaSession(tenant_id=tenant.id, session_name=wa.session_name(tenant.id), status="WORKING"))
    s.commit()

    c = TestClient(app)
    payload = {
        "event": "message",
        "session": wa.session_name(tenant.id),
        "payload": {"from": "cl@c.us", "body": "salut", "fromMe": False, "id": "m1"},
    }
    r = c.post("/webhook", json=payload)
    assert r.json()["status"] == "replied"
    assert ("cl@c.us", "Bonjour !") in ch.sent


def test_webhook_unknown_session():
    sf = _factory()
    app = create_app(
        session_factory=sf,
        channel_factory=lambda t: _Ch(),
        brain=_Brain(Decision("reply", "x", "y")),
    )
    r = TestClient(app).post(
        "/webhook",
        json={"event": "message", "session": "tZZ", "payload": {"from": "x@c.us", "body": "hi", "id": "1"}},
    )
    assert r.json()["status"] == "unknown-session"
