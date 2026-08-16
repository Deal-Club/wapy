import io

from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy.orm import sessionmaker

from channel.base import IncomingMessage
from brain.brain import Decision
from saas.db import Base, make_engine
from saas import auth, config_repo, models, wa
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

    def resolve_chat_id(self, phone):
        return phone + "@c.us"  # identité en test (pas de WAHA)


class _Brain:
    def __init__(self, decision):
        self.decision = decision

    def decide(self, fiche_text, history, incoming_text, channel="whatsapp", extra=""):
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


def test_config_enregistrable_sans_numero_du_responsable():
    """Le numéro se règle à l'écran « Connexion WhatsApp », pas ici.

    L'écran de configuration ne possède plus ce champ : il ne doit donc plus
    l'envoyer, et le serveur doit accepter son absence. Le garde-fou ne vise
    qu'un envoi EXPLICITE à vide, qui effacerait le numéro et rendrait toute
    escalade silencieuse — il ne doit pas bloquer un nouvel inscrit qui n'a pas
    encore atteint l'étape WhatsApp.
    """
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    r = c.put("/api/config", json={"sector": "Salon", "infos": []}, headers=_auth(tok))
    assert r.status_code == 200, r.text
    assert c.get("/api/config", headers=_auth(tok)).json()["sector"] == "Salon"


def test_config_refuse_un_numero_explicitement_vide():
    """L'autre moitié du contrat : effacer le numéro reste interdit."""
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    r = c.put("/api/config", json={"sector": "Salon", "staff_numbers": ""}, headers=_auth(tok))
    assert r.status_code == 400
    assert "responsable" in r.json()["detail"]


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


def test_me_team_invite_password_change_and_gating():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)  # owner a@b.com
    me = c.get("/api/me", headers=_auth(tok)).json()
    assert me["role"] == "owner" and me["is_admin"] is False
    r = c.post("/api/team/invite", json={"email": "agent@b.com"}, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["role"] == "agent"
    pw = r.json()["password"]  # généré, à transmettre / envoyé par WhatsApp
    atok = c.post("/auth/login", json={"email": "agent@b.com", "password": pw}).json()["token"]
    ame = c.get("/api/me", headers=_auth(atok)).json()
    assert ame["role"] == "agent" and ame["must_change_password"] is True
    # 1re connexion : changement de mot de passe obligatoire
    assert c.post("/api/change-password", json={"new_password": "nouveaupass"}, headers=_auth(atok)).status_code == 200
    assert c.get("/api/me", headers=_auth(atok)).json()["must_change_password"] is False
    # agent : lit les conversations, PAS configurer ni inviter
    assert c.get("/api/conversations", headers=_auth(atok)).status_code == 200
    assert c.put("/api/config", json={"sector": "X"}, headers=_auth(atok)).status_code == 403
    assert c.post("/api/team/invite", json={"email": "x@b.com"}, headers=_auth(atok)).status_code == 403


def test_invite_sends_credentials_over_whatsapp():
    sent = []

    class _InvCh:
        def send_text(self, chat_id, text):
            sent.append((chat_id, text))

        def resolve_chat_id(self, ph):
            return ph + "@c.us"

    c = TestClient(create_app(session_factory=_factory(), channel_factory=lambda t: _InvCh()))
    tok = _token(c)
    r = c.post("/api/team/invite", json={"email": "ag@b.com", "phone": "61040461", "dialcode": "229"}, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["sent"] is True
    assert sent and sent[0][0] == "22961040461@c.us"
    assert "provisoire" in sent[0][1] and r.json()["password"] in sent[0][1]


def test_admin_endpoints_require_admin_email(monkeypatch):
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)  # a@b.com
    assert c.get("/api/admin/tenants", headers=_auth(tok)).status_code == 403
    monkeypatch.setenv("ADMIN_EMAILS", "a@b.com")
    r = c.get("/api/admin/tenants", headers=_auth(tok))
    assert r.status_code == 200 and len(r.json()["tenants"]) >= 1
    assert c.get("/api/me", headers=_auth(tok)).json()["is_admin"] is True
    tid = r.json()["tenants"][0]["id"]
    assert c.put(f"/api/admin/tenants/{tid}", json={"status": "suspended"}, headers=_auth(tok)).status_code == 200


def test_webhook_session_status_records_incident():
    sf = _factory()
    app = create_app(session_factory=sf)
    s = sf()
    _, tenant = auth.signup(s, "a@b.com", "x", "T")
    s.add(models.WaSession(tenant_id=tenant.id, session_name=wa.session_name(tenant.id), status="WORKING"))
    s.commit()
    c = TestClient(app)
    r = c.post("/webhook", json={"event": "session.status", "session": wa.session_name(tenant.id), "payload": {"status": "FAILED"}})
    assert r.json()["status"] == "session-status"
    assert len(sf().query(models.SessionIncident).filter_by(tenant_id=tenant.id).all()) == 1


def test_suspended_tenant_webhook_skips():
    sf = _factory()
    ch = _Ch()
    app = create_app(session_factory=sf, channel_factory=lambda t: ch, brain=_Brain(Decision("reply", "hi", "x")))
    s = sf()
    _, tenant = auth.signup(s, "a@b.com", "x", "T")
    tenant.status = "suspended"
    s.add(models.WaSession(tenant_id=tenant.id, session_name=wa.session_name(tenant.id), status="WORKING"))
    s.commit()
    r = TestClient(app).post(
        "/webhook",
        json={"event": "message", "session": wa.session_name(tenant.id), "payload": {"from": "cl@c.us", "body": "hi", "id": "m1"}},
    )
    assert r.json()["status"] == "suspended"
    assert ch.sent == []


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


def test_staff_verify_sends_to_candidate_variants():
    ch = _Ch()
    c = TestClient(create_app(session_factory=_factory(), channel_factory=lambda t: ch))
    tok = _token(c)
    r = c.post("/api/staff/verify/start", json={"number": "0161040461", "dialcode": "229"}, headers=_auth(tok))
    assert r.status_code == 200
    tos = {to for to, _ in ch.sent}
    # la variante qui garde le 0 (celle qui délivre au Bénin) est envoyée
    assert "2290161040461@c.us" in tos and len(tos) >= 2


def test_staff_exclude_marks_conversation_and_config():
    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    tok = _token(c)
    s = sf()
    t = s.query(models.Tenant).first()
    s.add(models.Conversation(tenant_id=t.id, chat_id="70940562067544@lid", role="user", content="salut"))
    s.commit()
    assert c.post("/api/staff/exclude", json={"chat_id": "70940562067544@lid"}, headers=_auth(tok)).status_code == 200
    conv = next(x for x in c.get("/api/conversations", headers=_auth(tok)).json()["conversations"] if x["chat_id"] == "70940562067544@lid")
    assert conv["staff"] is True
    assert "70940562067544@lid" in c.get("/api/config", headers=_auth(tok)).json()["staff_inbound_ids"]
    c.post("/api/staff/exclude/remove", json={"chat_id": "70940562067544@lid"}, headers=_auth(tok))
    assert "70940562067544@lid" not in c.get("/api/config", headers=_auth(tok)).json()["staff_inbound_ids"]


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


def test_billing_subscribe_and_webhook_activates(monkeypatch):
    import hashlib
    import hmac
    import json

    from saas import geniuspay
    monkeypatch.setenv("GENIUSPAY_API_KEY", "pk")
    monkeypatch.setenv("GENIUSPAY_API_SECRET", "sk")
    monkeypatch.setenv("GENIUSPAY_WEBHOOK_SECRET", "whsec_op")
    monkeypatch.setattr(geniuspay, "create_payment",
                        lambda *a, **k: {"reference": "SUB1", "url": "https://pay/sub", "status": "pending"})

    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    tok = _token(c)
    b = c.get("/api/billing", headers=_auth(tok)).json()
    assert b["enabled"] and any(p["key"] == "pro" for p in b["catalogue"]["plans"])
    r = c.post("/api/billing/subscribe", json={"plan": "pro", "addons": ["voice"]}, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["checkout_url"] == "https://pay/sub"

    import time
    tid = sf().query(models.Tenant).first().id
    body = json.dumps({"event": "payment.success", "data": {"reference": "SUB1", "amount": 15000,
                       "metadata": {"tenant_id": tid, "plan": "pro", "addons": ["voice"], "kind": "subscription"}}})
    ts = str(int(time.time()))  # récent (anti-rejeu < 5 min)
    sig = hmac.new(b"whsec_op", f"{ts}.{body}".encode(), hashlib.sha256).hexdigest()
    wr = c.post("/webhook/geniuspay", content=body,
                headers={"X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts, "X-Webhook-Event": "payment.success", "Content-Type": "application/json"})
    assert wr.status_code == 200
    bb = c.get("/api/billing", headers=_auth(tok)).json()
    assert bb["status"] == "active" and bb["plan"] == "pro" and "voice" in bb["addons"]
    # idempotence : un rejeu ne casse rien
    assert c.post("/webhook/geniuspay", content=body,
                  headers={"X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts, "X-Webhook-Event": "payment.success"}).json()["status"] == "already-processed"
    # signature invalide rejetée
    assert c.post("/webhook/geniuspay", content=body, headers={"X-Webhook-Signature": "bad", "X-Webhook-Timestamp": ts}).status_code == 401


def test_billing_upgrade_pays_difference_and_addon_pays_supplement(monkeypatch):
    import hashlib
    import hmac
    import json
    import time
    from datetime import datetime, timedelta

    from saas import geniuspay
    monkeypatch.setenv("GENIUSPAY_API_KEY", "pk")
    monkeypatch.setenv("GENIUSPAY_API_SECRET", "sk")
    monkeypatch.setenv("GENIUSPAY_WEBHOOK_SECRET", "whsec_op")
    cap = {}

    def fake_create(cfg, amount, desc, cust, meta, **k):
        cap["amount"], cap["meta"] = amount, meta
        return {"reference": "R-" + meta["kind"], "url": "https://pay/x", "status": "pending"}

    monkeypatch.setattr(geniuspay, "create_payment", fake_create)
    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    tok = _token(c)
    s = sf()
    tid = s.query(models.Tenant).first().id
    sub = s.get(models.Subscription, tid)
    sub.status, sub.plan, sub.addons = "active", "pro", []
    sub.current_period_end = datetime.utcnow() + timedelta(days=20)
    s.commit()

    def webhook(ref, meta):
        body = json.dumps({"event": "payment.success", "data": {"reference": ref, "metadata": {**meta, "tenant_id": tid}}})
        ts = str(int(time.time()))
        sig = hmac.new(b"whsec_op", f"{ts}.{body}".encode(), hashlib.sha256).hexdigest()
        return c.post("/webhook/geniuspay", content=body, headers={"X-Webhook-Signature": sig, "X-Webhook-Timestamp": ts})

    # Upgrade Pro -> Business : ne paie QUE la différence. Les montants sont lus
    # dans la grille et non recopiés : un changement de prix ne doit pas se
    # traduire par un test rouge sur une logique qui, elle, n'a pas bougé.
    from saas import billing

    diff = billing.PLANS["business"]["price"] - billing.PLANS["pro"]["price"]
    r = c.post("/api/billing/upgrade", json={"plan": "business"}, headers=_auth(tok))
    assert r.status_code == 200 and cap["amount"] == diff and cap["meta"]["kind"] == "upgrade"
    assert webhook("R-upgrade", {"plan": "business", "kind": "upgrade"}).status_code == 200
    assert c.get("/api/billing", headers=_auth(tok)).json()["plan"] == "business"

    # Ajout d'une option : ne paie QUE le supplément, même période
    supplement = billing.ADDONS["conversations_1000"]["price"]
    r2 = c.post("/api/billing/addon", json={"addon": "conversations_1000"}, headers=_auth(tok))
    assert r2.status_code == 200 and cap["amount"] == supplement and cap["meta"]["kind"] == "addon"
    assert webhook("R-addon", {"addon": "conversations_1000", "kind": "addon"}).status_code == 200
    assert "conversations_1000" in c.get("/api/billing", headers=_auth(tok)).json()["addons"]


def test_feature_gating_ai_learn_by_plan():
    fake = lambda t, f, convs: []
    sf = _factory()
    c = TestClient(create_app(session_factory=sf, ai_learn=fake))
    tok = _token(c)
    s = sf()
    tid = s.query(models.Tenant).first().id
    sub = s.get(models.Subscription, tid)
    sub.status, sub.plan, sub.addons = "active", "essentiel", []
    s.commit()
    # Essentiel : suggestions IA non incluses -> 403
    assert c.post("/api/ai/learn", headers=_auth(tok)).status_code == 403
    # add-on "suggestions" -> débloque
    s2 = sf()
    s2.get(models.Subscription, tid).addons = ["suggestions"]
    s2.commit()
    assert c.post("/api/ai/learn", headers=_auth(tok)).status_code == 200


def test_knowledge_upload_list_fiche_and_remove():
    sf = _factory()
    c = TestClient(create_app(session_factory=sf))
    tok = _token(c)
    files = {"file": ("cgv.txt", b"Politique: annulation gratuite jusqu'a 48h avant.", "text/plain")}
    r = c.post("/api/knowledge", files=files, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["chars"] > 0
    lst = c.get("/api/knowledge", headers=_auth(tok)).json()["documents"]
    assert len(lst) == 1 and lst[0]["name"] == "cgv.txt"
    # le texte du document nourrit la fiche du bot
    s = sf()
    tid = s.query(models.Tenant).first().id
    assert "annulation gratuite" in config_repo.build_fiche_text(s, tid)
    # suppression
    assert c.delete("/api/knowledge/0", headers=_auth(tok)).status_code == 200
    assert c.get("/api/knowledge", headers=_auth(tok)).json()["documents"] == []


def test_upload_image_and_reject_non_image():
    c = TestClient(create_app(session_factory=_factory()))
    tok = _token(c)
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    r = c.post("/api/upload", files={"file": ("p.png", png, "image/png")}, headers=_auth(tok))
    assert r.status_code == 200 and r.json()["url"].startswith("/media/")
    r2 = c.post("/api/upload", files={"file": ("x.txt", b"hi", "text/plain")}, headers=_auth(tok))
    assert r2.status_code == 400
