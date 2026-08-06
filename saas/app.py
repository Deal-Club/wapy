"""API FastAPI de la plateforme Wapy.

P1 : auth + webhook multi-tenant.
P2 : endpoints d'onboarding (config, modèle Excel, import xlsx, WhatsApp connect/qr/status).
"""
import io
import os
import sys

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request, UploadFile, File
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, EmailStr

from saas.db import SessionLocal, init_db
from saas import auth, config_repo, models, sectors, usage, wa
from saas.bot import process_incoming
from saas.store_db import DbStore

# Générateur du modèle Excel (dossier tools/).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from generate_fiche_xlsx import build_workbook  # noqa: E402

WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "http://api:8000/webhook")


# --- Schémas ---
class SignupIn(BaseModel):
    email: EmailStr
    password: str
    resto_nom: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AiGenIn(BaseModel):
    sector: str = ""
    description: str = ""


class SettingsIn(BaseModel):
    staff_numbers: str | None = None
    staff_inbound_ids: str | None = None
    wapy_model: str | None = None


class ReplyIn(BaseModel):
    chat_id: str
    text: str


class CloseIn(BaseModel):
    chat_id: str


# --- Helpers config ---
def parse_workbook(data: bytes) -> dict:
    """Parse un .xlsx en config JSON flexible.

    'Infos' (2 colonnes) -> infos[{label,value}] ; 'FAQ' -> faq ;
    tout autre onglet (hors 'Lisez-moi') -> une table avec ses en-têtes comme colonnes.
    """
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)

    def sheet_rows(name):
        out = []
        for row in wb[name].iter_rows(values_only=True):
            out.append([("" if c is None else str(c)).strip() for c in row])
        return out

    infos, faq, tables = [], [], []
    for name in wb.sheetnames:
        low = name.strip().lower()
        if low in ("lisez-moi", "lisezmoi", "readme"):
            continue
        rows = sheet_rows(name)
        if not rows:
            continue
        header = rows[0]
        body = rows[1:]
        if low == "infos":
            infos = [{"label": r[0], "value": r[1] if len(r) > 1 else ""} for r in body if r and r[0]]
        elif low == "faq":
            faq = [{"question": r[0], "reponse": r[1] if len(r) > 1 else ""} for r in body if r and r[0]]
        else:
            cols = [h for h in header if h] or [f"Col{i+1}" for i in range(len(header))]
            trows = []
            for r in body:
                if not any(r):
                    continue
                trows.append({cols[i]: (r[i] if i < len(r) else "") for i in range(len(cols))})
            tables.append({"name": name, "columns": cols, "rows": trows})
    return {"infos": infos, "tables": tables, "faq": faq, "consignes": []}


def create_app(session_factory=None, channel_factory=None, brain=None, wa_module=None, ai_generate=None, init=False):
    app = FastAPI(title="Wapy Platform")
    sf = session_factory or SessionLocal
    wam = wa_module or wa

    if init:
        @app.on_event("startup")
        def _startup():
            init_db()

    def db():
        s = sf()
        try:
            yield s
        finally:
            s.close()

    def current_tenant(authorization: str = Header(None), s=Depends(db)):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="token manquant")
        try:
            data = auth.decode_token(authorization[7:])
        except Exception:
            raise HTTPException(status_code=401, detail="token invalide")
        tenant = s.get(models.Tenant, data.get("tid"))
        if not tenant:
            raise HTTPException(status_code=401, detail="tenant introuvable")
        return tenant

    # --- Santé ---
    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy Platform"}

    # --- Auth ---
    @app.post("/auth/signup")
    def signup(body: SignupIn, s=Depends(db)):
        try:
            user, tenant = auth.signup(s, body.email, body.password, body.resto_nom)
        except auth.SignupError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return {"token": auth.create_token(user.id, tenant.id), "tenant": {"id": tenant.id, "name": tenant.name}}

    @app.post("/auth/login")
    def login(body: LoginIn, s=Depends(db)):
        user = auth.authenticate(s, body.email, body.password)
        if not user:
            raise HTTPException(status_code=401, detail="identifiants invalides")
        return {"token": auth.create_token(user.id, user.tenant_id)}

    # --- Secteurs ---
    @app.get("/api/sectors")
    def list_sectors():
        return {"sectors": sectors.SECTORS}

    # --- Config (JSON flexible) ---
    @app.get("/api/config")
    def get_config(tenant=Depends(current_tenant), s=Depends(db)):
        cfg = config_repo.get_config(s, tenant.id)
        cfg["staff_numbers"] = tenant.staff_numbers or ""
        cfg["staff_inbound_ids"] = tenant.staff_inbound_ids or ""
        cfg["wapy_model"] = tenant.wapy_model
        return cfg

    @app.put("/api/config")
    def put_config(body: dict = Body(...), tenant=Depends(current_tenant), s=Depends(db)):
        cfg = {k: body.get(k) for k in ("sector", "description", "infos", "tables", "consignes", "faq") if k in body}
        config_repo.save_config(s, tenant.id, {**config_repo.get_config(s, tenant.id), **cfg})
        if body.get("staff_numbers") is not None:
            tenant.staff_numbers = body["staff_numbers"]
        if body.get("staff_inbound_ids") is not None:
            tenant.staff_inbound_ids = body["staff_inbound_ids"]
        if body.get("wapy_model"):
            tenant.wapy_model = body["wapy_model"]
        s.commit()
        return {"status": "saved"}

    # --- Génération assistée par l'IA ---
    @app.post("/api/ai/generate")
    def ai_generate_config(body: AiGenIn, tenant=Depends(current_tenant)):
        gen = ai_generate
        if gen is None:
            import anthropic
            from saas.ai_config import generate_config

            client = anthropic.Anthropic()
            data = generate_config(client, tenant.wapy_model, body.sector, body.description, tenant.name)
        else:
            data = gen(tenant, body.sector, body.description)
        return {"config": data}

    @app.put("/api/settings")
    def put_settings(body: SettingsIn, tenant=Depends(current_tenant), s=Depends(db)):
        if body.staff_numbers is not None:
            tenant.staff_numbers = body.staff_numbers
        if body.staff_inbound_ids is not None:
            tenant.staff_inbound_ids = body.staff_inbound_ids
        if body.wapy_model:
            tenant.wapy_model = body.wapy_model
        s.commit()
        return {"status": "saved"}

    # --- Modèle Excel ---
    @app.get("/api/template.xlsx")
    def template():
        buf = io.BytesIO()
        build_workbook().save(buf)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=wapy-fiche-modele.xlsx"},
        )

    @app.post("/api/import")
    async def import_xlsx(file: UploadFile = File(...), tenant=Depends(current_tenant), s=Depends(db)):
        data = await file.read()
        try:
            parsed = parse_workbook(data)
        except Exception:
            raise HTTPException(status_code=400, detail="fichier Excel illisible")
        merged = {**config_repo.get_config(s, tenant.id), **parsed}
        config_repo.save_config(s, tenant.id, merged)
        return {"status": "imported", "config": merged}

    # --- Conversations & handoff web ---
    @app.get("/api/conversations")
    def list_conversations(tenant=Depends(current_tenant), s=Depends(db)):
        rows = (
            s.query(models.Conversation)
            .filter_by(tenant_id=tenant.id)
            .order_by(models.Conversation.id.desc())
            .limit(1000)
            .all()
        )
        states = {st.chat_id: st for st in s.query(models.ConvState).filter_by(tenant_id=tenant.id).all()}
        seen: dict = {}
        for r in rows:
            if r.chat_id not in seen:
                st = states.get(r.chat_id)
                seen[r.chat_id] = {
                    "chat_id": r.chat_id,
                    "last": (r.content or "")[:140],
                    "escalated": bool(st and st.escalated),
                }
        return {"conversations": list(seen.values())}

    @app.get("/api/conversations/{chat_id}")
    def conversation_thread(chat_id: str, tenant=Depends(current_tenant), s=Depends(db)):
        rows = (
            s.query(models.Conversation)
            .filter_by(tenant_id=tenant.id, chat_id=chat_id)
            .order_by(models.Conversation.id.asc())
            .all()
        )
        st = s.query(models.ConvState).filter_by(tenant_id=tenant.id, chat_id=chat_id).first()
        return {
            "chat_id": chat_id,
            "escalated": bool(st and st.escalated),
            "messages": [{"role": r.role, "content": r.content} for r in rows],
        }

    @app.post("/api/handoff/reply")
    def handoff_reply(body: ReplyIn, tenant=Depends(current_tenant), s=Depends(db)):
        channel = (channel_factory or wam.channel_for)(tenant)
        channel.send_text(body.chat_id, body.text)
        DbStore(s, tenant.id).append(body.chat_id, "assistant", body.text)
        usage.bump(s, tenant.id, out_delta=1)
        return {"status": "sent"}

    @app.post("/api/handoff/close")
    def handoff_close(body: CloseIn, tenant=Depends(current_tenant), s=Depends(db)):
        st = DbStore(s, tenant.id)
        st.resolve_handoffs_for_client(body.chat_id)
        st.clear_escalated(body.chat_id)
        return {"status": "closed"}

    @app.get("/api/usage")
    def get_usage(tenant=Depends(current_tenant), s=Depends(db)):
        return usage.totals(s, tenant.id)

    # --- WhatsApp ---
    @app.post("/api/wa/connect")
    def wa_connect(tenant=Depends(current_tenant), s=Depends(db)):
        wam.start_session(tenant, WEBHOOK_URL)
        sname = wam.session_name(tenant.id)
        row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
        if row:
            row.session_name = sname
            row.status = "STARTING"
        else:
            s.add(models.WaSession(tenant_id=tenant.id, session_name=sname, status="STARTING"))
        s.commit()
        return {"session": sname}

    @app.get("/api/wa/qr")
    def wa_qr(tenant=Depends(current_tenant)):
        return Response(content=wam.get_qr(tenant), media_type="image/png")

    @app.get("/api/wa/status")
    def wa_status(tenant=Depends(current_tenant), s=Depends(db)):
        status = wam.get_status(tenant)
        row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
        if row:
            row.status = status
            s.commit()
        return {"status": status}

    @app.post("/api/wa/logout")
    def wa_logout(tenant=Depends(current_tenant), s=Depends(db)):
        wam.logout(tenant)
        row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
        if row:
            row.status = "STOPPED"
            row.linked_number = ""
            s.commit()
        return {"status": "logged_out"}

    # --- Webhook WAHA (routé par session -> tenant) ---
    @app.post("/webhook")
    async def webhook(request: Request, s=Depends(db)):
        payload = await request.json()
        tenant = wam.tenant_for_session(s, payload.get("session", ""))
        if tenant is None:
            return {"status": "unknown-session"}
        channel = (channel_factory or wam.channel_for)(tenant)
        br = brain
        if br is None:
            import anthropic
            from brain.brain import Brain

            br = Brain(anthropic.Anthropic(), tenant.wapy_model)
        return process_incoming(s, channel, br, tenant, payload)

    return app


app = create_app(init=True)
