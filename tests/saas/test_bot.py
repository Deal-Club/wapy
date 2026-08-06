from sqlalchemy.orm import sessionmaker

from channel.base import IncomingMessage
from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, config_repo, models
from saas.bot import handle_message, process_incoming


# --- Fakes pour la logique pure ---
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

    def send_image(self, chat_id, url, caption=""):
        self.sent.append(("IMG", chat_id, url, caption))


class _Brain:
    def __init__(self, decision):
        self.decision = decision
        self.called = False

    def decide(self, fiche_text, history, incoming_text):
        self.called = True
        return self.decision


class _Store:
    def __init__(self):
        self.msgs, self.esc, self.opt, self.processed, self.handoffs = [], set(), set(), set(), []

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

    def is_processed(self, mid):
        return mid in self.processed

    def mark_processed(self, mid):
        self.processed.add(mid)

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


def _msg(cid="c@c.us", body="c'est quoi vos horaires ?", from_me=False, mid="m1"):
    return {"event": "message", "payload": {"from": cid, "body": body, "fromMe": from_me, "id": mid}}


def test_handle_reply():
    ch, store = _Ch(), _Store()
    brain = _Brain(Decision("reply", "On ouvre à 12h.", "horaires"))
    r = handle_message(ch, store, brain, "## Infos", ["s@c.us"], ["s@c.us"], _msg())
    assert r["status"] == "replied"
    assert ("c@c.us", "On ouvre à 12h.") in ch.sent


def test_handle_reply_with_image():
    ch, store = _Ch(), _Store()
    brain = _Brain(Decision("reply", "Voici le plat 😋", "photo", image="/media/x.jpg"))
    r = handle_message(ch, store, brain, "x", [], [], _msg())
    assert r["status"] == "replied"
    img = [s for s in ch.sent if isinstance(s, tuple) and s and s[0] == "IMG"]
    assert img and img[0][2].endswith("/media/x.jpg") and img[0][3] == "Voici le plat 😋"


def test_handle_escalate_then_staff_relay_and_forward():
    ch, store = _Ch(), _Store()
    brain = _Brain(Decision("escalate", "", "réservation"))
    # client escalade
    handle_message(ch, store, brain, "x", ["s@c.us"], ["s@c.us", "sl@lid"], _msg(body="réserver", mid="1"))
    assert store.is_escalated("c@c.us")
    # boss (reconnu par @lid) répond -> relayé au client
    r = handle_message(ch, store, brain, "x", ["s@c.us"], ["s@c.us", "sl@lid"], _msg(cid="sl@lid", body="table à 20h", mid="2"))
    assert r["status"] == "relayed"
    assert ("c@c.us", "table à 20h") in ch.sent
    # message suivant du client -> transmis au staff
    r2 = handle_message(ch, store, brain, "x", ["s@c.us"], ["s@c.us", "sl@lid"], _msg(body="nous serons 5", mid="3"))
    assert r2["status"] == "forwarded"
    assert any(to == "s@c.us" and "nous serons 5" in txt for to, txt in ch.sent)


def test_duplicate_ignored():
    ch, store = _Ch(), _Store()
    brain = _Brain(Decision("reply", "ok", "y"))
    handle_message(ch, store, brain, "x", [], [], _msg(mid="dup"))
    brain.called = False
    r = handle_message(ch, store, brain, "x", [], [], _msg(mid="dup"))
    assert r["status"] == "duplicate"
    assert brain.called is False


# --- Bout-en-bout avec vraie DB ---
def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_dbstore_set_name_upsert():
    """set_name stocke puis met à jour le nom (pushName) d'un contact ; nom vide ignoré.

    (L'unicité par clé (tenant, chat) est garantie par la PK composite du schéma ;
    la visibilité inter-session est propre à Postgres/prod, pas au :memory: des tests.)"""
    from saas.store_db import DbStore

    s = _session()
    st = DbStore(s, 1)
    st.set_name("198406064615659@lid", "Yann")
    assert s.query(models.Contact).filter_by(chat_id="198406064615659@lid").first().name == "Yann"
    st.set_name("198406064615659@lid", "")  # vide -> pas d'écrasement
    st.set_name("198406064615659@lid", "Yann R.")  # mise à jour
    row = s.query(models.Contact).filter_by(chat_id="198406064615659@lid").first()
    assert row.name == "Yann R."


def test_process_incoming_end_to_end_db():
    s = _session()
    _, tenant = auth.signup(s, "a@b.com", "x", "Chez Test")
    tenant.staff_numbers = "s@c.us"
    config_repo.save_config(s, tenant.id, {
        "tables": [{"name": "Menu", "columns": ["Plat", "Prix"], "rows": [{"Plat": "Poulet braisé", "Prix": "3000 FCFA"}]}]
    })
    s.commit()

    ch = _Ch()
    brain = _Brain(Decision("reply", "Le poulet braisé est à 3000 FCFA.", "menu"))
    r = process_incoming(s, ch, brain, tenant, _msg(body="prix poulet ?"))
    assert r["status"] == "replied"
    assert ("c@c.us", "Le poulet braisé est à 3000 FCFA.") in ch.sent
    # persistance en DB
    rows = s.query(models.Conversation).filter_by(tenant_id=tenant.id).all()
    assert any(x.role == "assistant" for x in rows)
