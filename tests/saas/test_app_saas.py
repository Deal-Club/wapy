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

    def logout(self, tenant):
        self.started.append(("logout", tenant.id))


def _token(client):
    r = client.post("/auth/signup", json={"email": "a@b.com", "password": "secret123", "resto_nom": "Chez Test"})
    return r.json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_config_put_then_get():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    body = {
        "sector": "Restaurant",
        "infos": [{"label": "Horaires", "value": "11h-23h"}],
        "tables": [{"name": "Menu", "columns": ["Plat", "Prix"], "rows": [{"Plat": "Poulet", "Prix": "3000"}]}],
        "faq": [{"question": "Terrasse ?", "reponse": "Oui"}],
        "staff_numbers": "22961040461@c.us",
    }
    assert c.put("/api/config", json=body, headers=_auth(tok)).status_code == 200
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert cfg["sector"] == "Restaurant"
    assert cfg["infos"][0]["value"] == "11h-23h"
    assert cfg["tables"][0]["rows"][0]["Plat"] == "Poulet"
    assert cfg["staff_numbers"] == "22961040461@c.us"


def test_sectors_list():
    c = TestClient(create_app(session_factory=_factory()))
    r = c.get("/api/sectors")
    assert r.status_code == 200 and "Restaurant" in r.json()["sectors"]


def test_ai_generate_config():
    def fake_gen(tenant, sector, description):
        return {"sector": sector, "description": description, "infos": [{"label": "Horaires", "value": "9h-18h"}], "tables": [], "consignes": [], "faq": []}

    c = TestClient(create_app(session_factory=_factory(), ai_generate=fake_gen))
    tok = _token(c)
    r = c.post("/api/ai/generate", json={"sector": "Salon", "description": "moderne"}, headers=_auth(tok))
    assert r.status_code == 200
    cfg = r.json()["config"]
    assert cfg["sector"] == "Salon"
    assert cfg["infos"][0]["value"] == "9h-18h"


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


def test_import_xlsx_returns_config():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    files = {"file": ("fiche.xlsx", _make_xlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = c.post("/api/import", files=files, headers=_auth(tok))
    assert r.status_code == 200
    cfg = r.json()["config"]  # renvoyé pour pré-remplir le formulaire
    menu = next(t for t in cfg["tables"] if t["name"] == "Menu")
    assert any(row.get("Plat") == "Poulet braisé" for row in menu["rows"])
    # persisté en base
    got = c.get("/api/config", headers=_auth(tok)).json()
    assert any(t["name"] == "Menu" for t in got["tables"])


def test_wa_connect_status_qr_logout_with_fake():
    fake = _FakeWa()
    c = TestClient(create_app(session_factory=_factory(), wa_module=fake))
    tok = _token(c)
    r = c.post("/api/wa/connect", headers=_auth(tok))
    assert r.status_code == 200 and r.json()["session"].startswith("t")
    assert c.get("/api/wa/status", headers=_auth(tok)).json()["status"] == "SCAN_QR_CODE"
    qr = c.get("/api/wa/qr", headers=_auth(tok))
    assert qr.status_code == 200 and qr.content == b"PNGDATA"
    lo = c.post("/api/wa/logout", headers=_auth(tok))
    assert lo.status_code == 200 and lo.json()["status"] == "logged_out"
    assert ("logout", 1) in fake.started


def test_settings_update_without_wiping_config():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    c.put("/api/config", json={"tables": [{"name": "Menu", "columns": ["Plat"], "rows": [{"Plat": "Poulet"}]}]}, headers=_auth(tok))
    r = c.put("/api/settings", json={"staff_numbers": "229x@c.us"}, headers=_auth(tok))
    assert r.status_code == 200
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert cfg["staff_numbers"] == "229x@c.us"
    assert cfg["tables"][0]["rows"][0]["Plat"] == "Poulet"  # config préservée


def test_conversations_usage_and_handoff_web():
    ch = _Ch()
    app = create_app(
        session_factory=_factory(),
        channel_factory=lambda t: ch,
        brain=_Brain(Decision("reply", "On ouvre à 12h.", "horaires")),
    )
    c = TestClient(app)
    r = c.post("/auth/signup", json={"email": "a@b.com", "password": "secret123", "resto_nom": "T"})
    tok = r.json()["token"]
    tid = r.json()["tenant"]["id"]

    # une conversation via webhook (routage par session t{id})
    c.post("/webhook", json={"event": "message", "session": f"t{tid}", "payload": {"from": "cl@c.us", "body": "horaires ?", "id": "m1"}})

    convs = c.get("/api/conversations", headers=_auth(tok)).json()["conversations"]
    assert any(x["chat_id"] == "cl@c.us" for x in convs)

    thread = c.get("/api/conversations/cl@c.us", headers=_auth(tok)).json()
    assert any(m["role"] == "assistant" for m in thread["messages"])

    u = c.get("/api/usage", headers=_auth(tok)).json()
    assert u["messages_in"] >= 1 and u["messages_out"] >= 1

    r2 = c.post("/api/handoff/reply", json={"chat_id": "cl@c.us", "text": "Bonjour du web"}, headers=_auth(tok))
    assert r2.json()["status"] == "sent"
    assert ("cl@c.us", "Bonjour du web") in ch.sent

    assert c.post("/api/handoff/close", json={"chat_id": "cl@c.us"}, headers=_auth(tok)).json()["status"] == "closed"


def test_staff_verify_otp_flow():
    import re

    ch = _Ch()
    c = TestClient(create_app(session_factory=_factory(), channel_factory=lambda t: ch))
    tok = _token(c)
    r = c.post("/api/staff/verify/start", json={"number": "61040461", "dialcode": "229"}, headers=_auth(tok))
    assert r.status_code == 200
    # le code part sur le WhatsApp du numéro normalisé en JID
    to, text = ch.sent[0]
    assert to == "22961040461@c.us"
    code = re.search(r"(\d{4})", text).group(1)
    # mauvais code -> refusé, numéro pas encore enregistré
    assert c.post("/api/staff/verify/confirm", json={"code": "abcd"}, headers=_auth(tok)).status_code == 400
    # bon code -> numéro vérifié devient le destinataire des alertes
    r2 = c.post("/api/staff/verify/confirm", json={"code": code}, headers=_auth(tok))
    assert r2.status_code == 200 and r2.json()["staff_numbers"] == "22961040461@c.us"
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert cfg["staff_numbers"] == "22961040461@c.us"


def test_staff_verify_confirm_without_start():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    assert c.post("/api/staff/verify/confirm", json={"code": "1234"}, headers=_auth(tok)).status_code == 400


def test_ai_suggestions_flow():
    def fake_learn(tenant, fiche, convos):
        return [{"kind": "faq", "title": "Livraison", "payload": {"question": "Vous livrez ?", "reponse": "Oui, via Gozem."}}]

    c = TestClient(create_app(session_factory=_factory(), ai_learn=fake_learn))
    tok = _token(c)
    assert c.post("/api/ai/learn", headers=_auth(tok)).json()["added"] == 1
    # idempotent : pas de doublon
    assert c.post("/api/ai/learn", headers=_auth(tok)).json()["added"] == 0
    lst = c.get("/api/suggestions", headers=_auth(tok)).json()["suggestions"]
    assert len(lst) == 1 and lst[0]["kind"] == "faq"
    sid = lst[0]["id"]
    assert c.post(f"/api/suggestions/{sid}/accept", headers=_auth(tok)).json()["status"] == "accepted"
    cfg = c.get("/api/config", headers=_auth(tok)).json()
    assert any(f["question"] == "Vous livrez ?" for f in cfg["faq"])
    assert c.get("/api/suggestions", headers=_auth(tok)).json()["suggestions"] == []


def test_conversation_shows_contact_name():
    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    tok = _token(c)
    s = sf()
    t = s.query(models.Tenant).first()
    s.add(models.Conversation(tenant_id=t.id, chat_id="198406064615659@lid", role="user", content="salut"))
    s.add(models.Contact(tenant_id=t.id, chat_id="198406064615659@lid", name="Yann"))
    s.commit()
    convs = c.get("/api/conversations", headers=_auth(tok)).json()["conversations"]
    assert convs[0]["name"] == "Yann"


def test_upload_image_and_reject_non_image():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    r = c.post("/api/upload", files={"file": ("p.png", png, "image/png")}, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["url"].startswith("/media/")
    r2 = c.post("/api/upload", files={"file": ("x.txt", b"hi", "text/plain")}, headers=_auth(tok))
    assert r2.status_code == 400
