import io

from fastapi.testclient import TestClient
from openpyxl import Workbook
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


# --- Onboarding : config / template / import / WhatsApp ---
class _FakeWa:
    def __init__(self):
        self.started = []

    def session_name(self, tid):
        return f"t{tid}"

    def channel_for(self, tenant):
        return _Ch()

    def tenant_for_session(self, s, sname):
        return wa.tenant_for_session(s, sname)

    def start_session(self, tenant, url):
        self.started.append((tenant.id, url))

    def get_qr(self, tenant):
        return b"PNGDATA"

    def get_status(self, tenant):
        return "SCAN_QR_CODE"


def _token(client):
    r = client.post("/auth/signup", json={"email": "a@b.com", "password": "secret123", "resto_nom": "Chez Test"})
    return r.json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_config_put_then_get():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    body = {
        "infos": [{"rubrique": "Horaires", "contenu": "11h-23h"}],
        "menu": [{"categorie": "Plat", "plat": "Poulet", "prix": "3000 FCFA"}],
        "faq": [{"question": "Terrasse ?", "reponse": "Oui"}],
        "staff_numbers": "22961040461@c.us",
    }
    assert c.put("/api/config", json=body, headers=_auth(tok)).status_code == 200
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert cfg["infos"][0]["contenu"] == "11h-23h"
    assert cfg["menu"][0]["plat"] == "Poulet"
    assert cfg["staff_numbers"] == "22961040461@c.us"


def test_config_requires_auth():
    c = TestClient(create_app(session_factory=_factory()))
    assert c.get("/api/config").status_code == 401


def test_template_download():
    c = TestClient(create_app(session_factory=_factory()))
    r = c.get("/api/template.xlsx")
    assert r.status_code == 200
    assert "spreadsheet" in r.headers["content-type"]
    assert len(r.content) > 1000


def _make_xlsx():
    wb = Workbook()
    ws = wb.active
    ws.title = "Infos"
    ws.append(["Rubrique", "Contenu"])
    ws.append(["Horaires", "11h-23h"])
    m = wb.create_sheet("Menu")
    m.append(["Catégorie", "Plat", "Description", "Prix", "Régime"])
    m.append(["Plat", "Poulet braisé", "grillé", "3000 FCFA", ""])
    f = wb.create_sheet("FAQ")
    f.append(["Question", "Réponse"])
    f.append(["Terrasse ?", "Oui"])
    b = io.BytesIO()
    wb.save(b)
    return b.getvalue()


def test_import_xlsx():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    files = {"file": ("fiche.xlsx", _make_xlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = c.post("/api/import", files=files, headers=_auth(tok))
    assert r.status_code == 200
    assert r.json()["counts"]["menu"] == 1
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert any(m["plat"] == "Poulet braisé" for m in cfg["menu"])


def test_wa_connect_status_qr_with_fake():
    fake = _FakeWa()
    c = TestClient(create_app(session_factory=_factory(), wa_module=fake))
    tok = _token(c)
    r = c.post("/api/wa/connect", headers=_auth(tok))
    assert r.status_code == 200 and r.json()["session"].startswith("t")
    assert len(fake.started) == 1
    assert c.get("/api/wa/status", headers=_auth(tok)).json()["status"] == "SCAN_QR_CODE"
    qr = c.get("/api/wa/qr", headers=_auth(tok))
    assert qr.status_code == 200 and qr.content == b"PNGDATA"


def test_settings_update_without_wiping_config():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    c.put("/api/config", json={"menu": [{"plat": "Poulet", "prix": "3000"}]}, headers=_auth(tok))
    r = c.put("/api/settings", json={"staff_numbers": "229x@c.us"}, headers=_auth(tok))
    assert r.status_code == 200
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert cfg["staff_numbers"] == "229x@c.us"
    assert cfg["menu"][0]["plat"] == "Poulet"  # config préservée
