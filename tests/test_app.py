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
        return IncomingMessage(
            cid, p["body"], p.get("fromMe", False), cid.endswith("@g.us"), p.get("id", "")
        )

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
        self.msgs, self.esc, self.opt, self.processed = [], set(), set(), set()
        self.handoffs = []  # (staff, client, resolved)

    def is_processed(self, mid):
        return mid in self.processed

    def mark_processed(self, mid):
        self.processed.add(mid)

    def append(self, cid, role, text):
        self.msgs.append((cid, role, text))

    def get_history(self, cid, limit):
        return []

    def is_escalated(self, cid):
        return cid in self.esc

    def set_escalated(self, cid):
        self.esc.add(cid)

    def clear_escalated(self, cid):
        self.esc.discard(cid)

    def is_optout(self, cid):
        return cid in self.opt

    def set_optout(self, cid):
        self.opt.add(cid)

    def open_handoff(self, staff, client):
        self.handoffs.append([staff, client, False])

    def latest_open_handoff_client(self):
        for h in reversed(self.handoffs):
            if not h[2]:
                return h[1]
        return None

    def resolve_handoffs_for_client(self, client):
        for h in self.handoffs:
            if h[1] == client:
                h[2] = True


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


def _msg(cid="33611112222@c.us", body="Vous ouvrez à quelle heure ?", from_me=False, mid="m1"):
    return {
        "event": "message",
        "payload": {"from": cid, "body": body, "fromMe": from_me, "id": mid},
    }


def test_duplicate_message_ignored():
    brain = _Brain(Decision("reply", "ok", "y"))
    client, ch, store = _client(brain)
    client.post("/webhook", json=_msg(mid="dup1"))
    assert len(ch.sent) == 1
    brain.called = False
    r = client.post("/webhook", json=_msg(mid="dup1"))
    assert r.json()["status"] == "duplicate"
    assert brain.called is False
    assert len(ch.sent) == 1


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


def test_boss_relay_then_handback():
    staff = "33600000000@c.us"
    brain = _Brain(Decision("escalate", "", "réservation"))
    client, ch, store = _client(brain)

    # 1. Le client déclenche une escalade
    client.post("/webhook", json=_msg(cid="CLIENT@c.us", body="je veux réserver", mid="c1"))
    assert store.is_escalated("CLIENT@c.us")

    # 2. Le boss répond -> relayé au client (la conversation reste escaladée)
    r = client.post("/webhook", json=_msg(cid=staff, body="Oui, table libre à 20h", mid="s1"))
    assert r.json()["status"] == "relayed"
    assert ("CLIENT@c.us", "Oui, table libre à 20h") in ch.sent
    assert store.is_escalated("CLIENT@c.us")

    # 3. Le boss tape /fin -> la main revient au bot
    r2 = client.post("/webhook", json=_msg(cid=staff, body="/fin", mid="s2"))
    assert r2.json()["status"] == "handback"
    assert not store.is_escalated("CLIENT@c.us")


def test_staff_message_without_open_handoff_is_idle():
    brain = _Brain(Decision("reply", "x", "y"))
    client, ch, store = _client(brain)
    r = client.post("/webhook", json=_msg(cid="33600000000@c.us", body="coucou", mid="s9"))
    assert r.json()["status"] == "staff-idle"
    assert brain.called is False


def test_already_escalated_conversation_is_not_answered():
    brain = _Brain(Decision("reply", "x", "y"))
    ch, store = _Ch(), _Store()
    store.set_escalated("33611112222@c.us")
    client, _, _ = _client(brain, ch=ch, store=store)
    client.post("/webhook", json=_msg())
    assert brain.called is False
    assert ch.sent == []
