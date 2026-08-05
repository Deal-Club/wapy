"""API FastAPI de la plateforme Wapy.

P1 : auth + webhook multi-tenant.
P2 : endpoints d'onboarding (config, modèle Excel, import xlsx, WhatsApp connect/qr/status).
"""
import io
import os
import sys

from fastapi import Depends, FastAPI, Header, HTTPException, Request, UploadFile, File
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, EmailStr

from saas.db import SessionLocal, init_db
from saas import auth, models, wa
from saas.bot import process_incoming

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


class InfoRow(BaseModel):
    rubrique: str
    contenu: str = ""


class MenuRow(BaseModel):
    categorie: str = ""
    plat: str = ""
    description: str = ""
    prix: str = ""
    regime: str = ""


class FaqRow(BaseModel):
    question: str
    reponse: str = ""


class ConfigIn(BaseModel):
    infos: list[InfoRow] = []
    menu: list[MenuRow] = []
    faq: list[FaqRow] = []
    staff_numbers: str | None = None
    staff_inbound_ids: str | None = None
    wapy_model: str | None = None


class SettingsIn(BaseModel):
    staff_numbers: str | None = None
    staff_inbound_ids: str | None = None
    wapy_model: str | None = None


# --- Helpers config ---
def _replace_config(s, tenant_id, infos, menu, faq):
    s.query(models.RestaurantInfo).filter_by(tenant_id=tenant_id).delete()
    s.query(models.MenuItem).filter_by(tenant_id=tenant_id).delete()
    s.query(models.Faq).filter_by(tenant_id=tenant_id).delete()
    for r in infos:
        if (r.get("rubrique") or "").strip():
            s.add(models.RestaurantInfo(tenant_id=tenant_id, rubrique=r["rubrique"], contenu=r.get("contenu", "")))
    for m in menu:
        if (m.get("plat") or m.get("categorie") or "").strip():
            s.add(models.MenuItem(
                tenant_id=tenant_id, categorie=m.get("categorie", ""), plat=m.get("plat", ""),
                description=m.get("description", ""), prix=m.get("prix", ""), regime=m.get("regime", "")))
    for f in faq:
        if (f.get("question") or "").strip():
            s.add(models.Faq(tenant_id=tenant_id, question=f["question"], reponse=f.get("reponse", "")))
    s.commit()


def _read_config(s, tenant_id):
    infos = s.query(models.RestaurantInfo).filter_by(tenant_id=tenant_id).all()
    menu = s.query(models.MenuItem).filter_by(tenant_id=tenant_id).all()
    faq = s.query(models.Faq).filter_by(tenant_id=tenant_id).all()
    return {
        "infos": [{"rubrique": i.rubrique, "contenu": i.contenu or ""} for i in infos],
        "menu": [{"categorie": m.categorie, "plat": m.plat, "description": m.description, "prix": m.prix, "regime": m.regime} for m in menu],
        "faq": [{"question": f.question, "reponse": f.reponse} for f in faq],
    }


def parse_workbook(data: bytes) -> dict:
    """Parse un .xlsx (onglets Infos/Menu/FAQ) en config."""
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)

    def rows(name):
        if name not in wb.sheetnames:
            return []
        out = []
        for row in wb[name].iter_rows(min_row=2, values_only=True):
            out.append([("" if c is None else str(c)).strip() for c in row])
        return out

    def cell(r, i):
        return r[i] if i < len(r) else ""

    infos = [{"rubrique": cell(r, 0), "contenu": cell(r, 1)} for r in rows("Infos") if cell(r, 0)]
    menu = [
        {"categorie": cell(r, 0), "plat": cell(r, 1), "description": cell(r, 2), "prix": cell(r, 3), "regime": cell(r, 4)}
        for r in rows("Menu") if any(cell(r, i) for i in range(5))
    ]
    faq = [{"question": cell(r, 0), "reponse": cell(r, 1)} for r in rows("FAQ") if cell(r, 0)]
    return {"infos": infos, "menu": menu, "faq": faq}


def create_app(session_factory=None, channel_factory=None, brain=None, wa_module=None, init=False):
    app = FastAPI(title="Wapy Platform")
    sf = session_factory or SessionLocal
    wam = wa_module or wa
    if init:
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

    # --- Config ---
    @app.get("/api/config")
    def get_config(tenant=Depends(current_tenant), s=Depends(db)):
        cfg = _read_config(s, tenant.id)
        cfg["staff_numbers"] = tenant.staff_numbers or ""
        cfg["staff_inbound_ids"] = tenant.staff_inbound_ids or ""
        cfg["wapy_model"] = tenant.wapy_model
        return cfg

    @app.put("/api/config")
    def put_config(body: ConfigIn, tenant=Depends(current_tenant), s=Depends(db)):
        _replace_config(
            s, tenant.id,
            [r.model_dump() for r in body.infos],
            [m.model_dump() for m in body.menu],
            [f.model_dump() for f in body.faq],
        )
        if body.staff_numbers is not None:
            tenant.staff_numbers = body.staff_numbers
        if body.staff_inbound_ids is not None:
            tenant.staff_inbound_ids = body.staff_inbound_ids
        if body.wapy_model:
            tenant.wapy_model = body.wapy_model
        s.commit()
        return {"status": "saved"}

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
            cfg = parse_workbook(data)
        except Exception:
            raise HTTPException(status_code=400, detail="fichier Excel illisible")
        _replace_config(s, tenant.id, cfg["infos"], cfg["menu"], cfg["faq"])
        return {"status": "imported", "counts": {k: len(v) for k, v in cfg.items()}}

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


app = create_app()
