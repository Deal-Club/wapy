import random
from fastapi.testclient import TestClient
from app import create_app
from channel.base import IncomingMessage
from brain.brain import Decision


def test_health_ok():
    client = TestClient(create_app())
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "Wapy"}


class _Ch:
    def __init__(self):
        self.sent = []

    def parse_incoming(self, payload):
        p = payload["payload"]
        cid = p["from"]
        return IncomingMessage(cid, p["body"], p.get("fromMe", False), cid.endswith("@g.us"))

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _Brain:
    def __init__(self, decision):
        self.decision = decision
        self.called = False

    def decide(self, fiche_text, history, incoming_text):
        self.called = True
        return self.decision


class _Store:
    def __init__(self):
        self.msgs, self.esc, self.opt = [], set(), set()

    def append(self, cid, role, text):
        self.msgs.append((cid, role, text))

    def get_history(self, cid, limit):
        return []

    def is_escalated(self, cid):
        return cid in self.esc

    def set_escalated(self, cid):
        self.esc.add(cid)

    def is_optout(self, cid):
        return cid in self.opt

    def set_optout(self, cid):
        self.opt.add(cid)


class _Fiche:
    def load(self):
        return "## Infos\n- Nom : X"


def _client(brain, ch=None, store=None):
    ch = ch or _Ch()
    store = store or _Store()
    deps = {
        "channel": ch,
        "brain": brain,
        "store": store,
        "fiche": _Fiche(),
        "staff_numbers": ["33600000000@c.us"],
        "rng": random.Random(1),
    }
    return TestClient(create_app(deps)), ch, store


def _msg(cid="33611112222@c.us", body="Vous ouvrez à quelle heure ?", from_me=False):
    return {"event": "message", "payload": {"from": cid, "body": body, "fromMe": from_me}}


def test_reply_flow_sends_and_persists():
    brain = _Brain(Decision("reply", "On ouvre à 12h.", "horaires"))
    client, ch, store = _client(brain)
    r = client.post("/webhook", json=_msg())
    assert r.status_code == 200
    assert ("33611112222@c.us", "On ouvre à 12h.") in ch.sent
    assert ("33611112222@c.us", "assistant", "On ouvre à 12h.") in store.msgs


def test_escalate_flow_alerts_staff():
    brain = _Brain(Decision("escalate", "", "réservation"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(body="je veux réserver"))
    assert store.is_escalated("33611112222@c.us")
    assert any(to == "33600000000@c.us" for to, _ in ch.sent)


def test_group_message_ignored():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(cid="123@g.us"))
    assert brain.called is False
    assert ch.sent == []


def test_from_me_ignored():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(from_me=True))
    assert brain.called is False


def test_optout_keyword_stops_and_marks():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(body="STOP"))
    assert store.is_optout("33611112222@c.us")
    assert brain.called is False


def test_already_escalated_conversation_is_not_answered():
    brain = _Brain(Decision("reply", "x", "y"))
    ch, store = _Ch(), _Store()
    store.set_escalated("33611112222@c.us")
    client, _, _ = _client(brain, ch=ch, store=store)
    client.post("/webhook", json=_msg())
    assert brain.called is False
    assert ch.sent == []
