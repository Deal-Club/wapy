"""API FastAPI de la plateforme Wapy.

P1 : auth + webhook multi-tenant.
P2 : endpoints d'onboarding (config, modèle Excel, import xlsx, WhatsApp connect/qr/status).
"""
import io
import os
import random
import sys
import uuid
from datetime import datetime, timedelta

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request, UploadFile, File
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

MEDIA_DIR = os.environ.get("MEDIA_DIR", "media")
OTP_TTL = timedelta(minutes=15)

from saas.db import SessionLocal, init_db
from saas import auth, config_repo, models, phone, sectors, usage, wa
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


class StaffVerifyStartIn(BaseModel):
    number: str
    dialcode: str = ""


class StaffVerifyConfirmIn(BaseModel):
    code: str


class StaffExcludeIn(BaseModel):
    chat_id: str


class InviteIn(BaseModel):
    email: EmailStr
    password: str


class AdminTenantIn(BaseModel):
    plan: str | None = None
    status: str | None = None
    wapy_model: str | None = None


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


def create_app(session_factory=None, channel_factory=None, brain=None, wa_module=None, ai_generate=None, ai_learn=None, vision_analyze=None, init=False):
    app = FastAPI(title="Wapy Platform")
    sf = session_factory or SessionLocal
    wam = wa_module or wa

    # Fichiers média (images des catalogues) servis publiquement + accessibles à WAHA.
    os.makedirs(MEDIA_DIR, exist_ok=True)
    app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

    if init:
        @app.on_event("startup")
        def _startup():
            init_db()

        @app.on_event("startup")
        async def _start_health():
            import asyncio
            from saas.health import run_health_loop
            asyncio.create_task(run_health_loop(sf, wam))

    def db():
        s = sf()
        try:
            yield s
        finally:
            s.close()

    def _decode(authorization):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="token manquant")
        try:
            return auth.decode_token(authorization[7:])
        except Exception:
            raise HTTPException(status_code=401, detail="token invalide")

    def current_tenant(authorization: str = Header(None), s=Depends(db)):
        tenant = s.get(models.Tenant, _decode(authorization).get("tid"))
        if not tenant:
            raise HTTPException(status_code=401, detail="tenant introuvable")
        return tenant

    def current_user(authorization: str = Header(None), s=Depends(db)):
        user = s.get(models.User, _decode(authorization).get("uid"))
        if not user:
            raise HTTPException(status_code=401, detail="utilisateur introuvable")
        return user

    def require_owner(user=Depends(current_user)):
        if user.role != "owner" and not auth.is_admin(user.email):
            raise HTTPException(status_code=403, detail="Réservé au propriétaire du compte")
        return user

    def require_admin(user=Depends(current_user)):
        if not auth.is_admin(user.email):
            raise HTTPException(status_code=403, detail="Accès administrateur requis")
        return user

    def owner_tenant(tenant=Depends(current_tenant), user=Depends(current_user)):
        """Tenant courant, mais réservé au propriétaire (les agents ne configurent pas)."""
        if user.role != "owner" and not auth.is_admin(user.email):
            raise HTTPException(status_code=403, detail="Réservé au propriétaire du compte")
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

    @app.get("/api/me")
    def me(user=Depends(current_user), s=Depends(db)):
        tenant = s.get(models.Tenant, user.tenant_id)
        return {
            "email": user.email,
            "role": user.role,
            "is_admin": auth.is_admin(user.email),
            "tenant": {"id": tenant.id, "name": tenant.name} if tenant else None,
        }

    # --- Équipe (owner invite des agents) ---
    @app.get("/api/team")
    def list_team(user=Depends(require_owner), s=Depends(db)):
        rows = s.query(models.User).filter_by(tenant_id=user.tenant_id).order_by(models.User.id).all()
        return {"members": [{"id": u.id, "email": u.email, "role": u.role} for u in rows]}

    @app.post("/api/team/invite")
    def invite_member(body: InviteIn, user=Depends(require_owner), s=Depends(db)):
        try:
            agent = auth.create_agent(s, user.tenant_id, body.email, body.password)
        except auth.SignupError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return {"id": agent.id, "email": agent.email, "role": agent.role}

    @app.delete("/api/team/{uid}")
    def remove_member(uid: int, user=Depends(require_owner), s=Depends(db)):
        target = s.get(models.User, uid)
        if not target or target.tenant_id != user.tenant_id:
            raise HTTPException(status_code=404, detail="Membre introuvable")
        if target.id == user.id:
            raise HTTPException(status_code=400, detail="Impossible de se retirer soi-même")
        s.delete(target)
        s.commit()
        return {"status": "removed"}

    # --- Super-admin plateforme (opérateur Wapy) ---
    @app.get("/api/admin/tenants")
    def admin_tenants(_=Depends(require_admin), s=Depends(db)):
        out = []
        for t in s.query(models.Tenant).order_by(models.Tenant.id).all():
            u = usage.totals(s, t.id)
            sess = s.query(models.WaSession).filter_by(tenant_id=t.id).first()
            owner = s.query(models.User).filter_by(tenant_id=t.id, role="owner").first()
            out.append({
                "id": t.id, "name": t.name,
                "plan": t.plan, "status": getattr(t, "status", "active") or "active",
                "model": t.wapy_model,
                "owner": owner.email if owner else "",
                "messages_in": u.get("messages_in", 0), "messages_out": u.get("messages_out", 0),
                "wa_status": sess.status if sess else "—",
                "last_seen": sess.last_seen.isoformat() if sess and sess.last_seen else "",
                "staff_ok": bool(t.staff_numbers),
            })
        return {"tenants": out}

    @app.get("/api/admin/incidents")
    def admin_incidents(_=Depends(require_admin), s=Depends(db)):
        names = {t.id: t.name for t in s.query(models.Tenant).all()}
        rows = (
            s.query(models.SessionIncident)
            .order_by(models.SessionIncident.id.desc()).limit(100).all()
        )
        return {"incidents": [
            {"tenant": names.get(r.tenant_id, str(r.tenant_id)), "status": r.status,
             "note": r.note, "at": r.created_at.isoformat() if r.created_at else ""}
            for r in rows
        ]}

    @app.put("/api/admin/tenants/{tid}")
    def admin_update_tenant(tid: int, body: AdminTenantIn, _=Depends(require_admin), s=Depends(db)):
        t = s.get(models.Tenant, tid)
        if not t:
            raise HTTPException(status_code=404, detail="Tenant introuvable")
        if body.plan is not None:
            t.plan = body.plan
        if body.status is not None:
            t.status = body.status
        if body.wapy_model is not None:
            t.wapy_model = body.wapy_model
        s.commit()
        return {"status": "saved"}

    @app.get("/api/admin/tenants/{tid}/conversations")
    def admin_tenant_conversations(tid: int, _=Depends(require_admin), s=Depends(db)):
        t = s.get(models.Tenant, tid)
        if not t:
            raise HTTPException(status_code=404, detail="Tenant introuvable")
        rows = (
            s.query(models.Conversation).filter_by(tenant_id=tid)
            .order_by(models.Conversation.id.desc()).limit(400).all()
        )
        seen: dict = {}
        for r in rows:
            if r.chat_id not in seen:
                seen[r.chat_id] = {"chat_id": r.chat_id, "last": (r.content or "")[:140]}
        return {"conversations": list(seen.values())}

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
    def put_config(body: dict = Body(...), tenant=Depends(owner_tenant), s=Depends(db)):
        cfg = {k: body.get(k) for k in ("sector", "description", "infos", "tables", "consignes", "faq") if k in body}
        config_repo.save_config(s, tenant.id, {**config_repo.get_config(s, tenant.id), **cfg})
        if body.get("staff_numbers") is not None:
            tenant.staff_numbers = phone.to_jids_csv(body["staff_numbers"])
        if body.get("staff_inbound_ids") is not None:
            tenant.staff_inbound_ids = body["staff_inbound_ids"]
        if body.get("wapy_model"):
            tenant.wapy_model = body["wapy_model"]
        s.commit()
        return {"status": "saved"}

    # --- Génération assistée par l'IA ---
    @app.post("/api/ai/generate")
    def ai_generate_config(body: AiGenIn, tenant=Depends(owner_tenant)):
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
    def put_settings(body: SettingsIn, tenant=Depends(owner_tenant), s=Depends(db)):
        if body.staff_numbers is not None:
            tenant.staff_numbers = phone.to_jids_csv(body.staff_numbers)
        if body.staff_inbound_ids is not None:
            tenant.staff_inbound_ids = body.staff_inbound_ids
        if body.wapy_model:
            tenant.wapy_model = body.wapy_model
        s.commit()
        return {"status": "saved"}

    # --- Vérification du numéro staff par code (OTP envoyé sur WhatsApp) ---
    @app.post("/api/staff/verify/start")
    def staff_verify_start(body: StaffVerifyStartIn, tenant=Depends(owner_tenant), s=Depends(db)):
        channel = (channel_factory or wam.channel_for)(tenant)
        # Résout le VRAI chatId via WAHA (WhatsApp normalise ; ex. Bénin 229... -> 8 chiffres).
        # Envoyer au chatId canonique = délivrance garantie, sans deviner le format.
        resolved: list[str] = []
        for num in phone.candidate_numbers(body.number, body.dialcode):
            jid = None
            if hasattr(channel, "resolve_chat_id"):
                jid = channel.resolve_chat_id(num)
            jid = jid or (num + "@c.us")  # repli si WAHA ne répond pas
            if jid not in resolved:
                resolved.append(jid)
        if not resolved:
            raise HTTPException(status_code=400, detail="Numéro invalide")
        code = f"{random.randint(0, 9999):04d}"
        row = s.get(models.StaffVerification, tenant.id)
        if row:
            row.jid, row.code, row.created_at = ",".join(resolved), code, datetime.utcnow()
        else:
            s.add(models.StaffVerification(tenant_id=tenant.id, jid=",".join(resolved), code=code))
        s.commit()
        sent = 0
        for jid in resolved:
            try:
                channel.send_text(
                    jid,
                    f"🔐 Votre code Wapy est : {code}\n"
                    "Saisissez-le dans votre tableau de bord pour activer les alertes.",
                )
                sent += 1
            except Exception:
                pass
        if sent == 0:
            raise HTTPException(
                status_code=400,
                detail="Impossible d'envoyer le code. Vérifiez que WhatsApp est connecté et que le numéro est correct.",
            )
        return {"status": "sent", "masked": phone.mask(resolved[0])}

    @app.post("/api/staff/verify/confirm")
    def staff_verify_confirm(body: StaffVerifyConfirmIn, tenant=Depends(owner_tenant), s=Depends(db)):
        row = s.get(models.StaffVerification, tenant.id)
        if not row or not row.code:
            raise HTTPException(status_code=400, detail="Aucun code en attente. Renvoyez un code.")
        if datetime.utcnow() - row.created_at > OTP_TTL:
            raise HTTPException(status_code=400, detail="Code expiré. Renvoyez un code.")
        if body.code.strip() != row.code:
            raise HTTPException(status_code=400, detail="Code incorrect.")
        tenant.staff_numbers = row.jid  # numéro vérifié = seul destinataire des alertes
        s.delete(row)
        s.commit()
        return {"status": "verified", "staff_numbers": tenant.staff_numbers}

    # --- Personnel à exclure (numéros/@lid du staff : jamais traités comme clients) ---
    def _inbound_set(tenant) -> list[str]:
        return [x.strip() for x in (tenant.staff_inbound_ids or "").split(",") if x.strip()]

    @app.post("/api/staff/exclude")
    def staff_exclude(body: StaffExcludeIn, tenant=Depends(owner_tenant), s=Depends(db)):
        ids = _inbound_set(tenant)
        if body.chat_id and body.chat_id not in ids:
            ids.append(body.chat_id)
        tenant.staff_inbound_ids = ",".join(ids)
        # Un membre du personnel ne doit pas rester "escaladé" comme un client.
        DbStore(s, tenant.id).clear_escalated(body.chat_id)
        s.commit()
        return {"status": "excluded", "staff_inbound_ids": tenant.staff_inbound_ids}

    @app.post("/api/staff/exclude/remove")
    def staff_unexclude(body: StaffExcludeIn, tenant=Depends(owner_tenant), s=Depends(db)):
        ids = [x for x in _inbound_set(tenant) if x != body.chat_id]
        tenant.staff_inbound_ids = ",".join(ids)
        s.commit()
        return {"status": "removed", "staff_inbound_ids": tenant.staff_inbound_ids}

    # --- Suggestions IA (l'assistant apprend des conversations, tu valides) ---
    @app.post("/api/ai/learn")
    def ai_learn_run(tenant=Depends(owner_tenant), s=Depends(db)):
        # Rassemble les dernières conversations (clients uniquement).
        rows = (
            s.query(models.Conversation)
            .filter_by(tenant_id=tenant.id)
            .order_by(models.Conversation.id.desc())
            .limit(400)
            .all()
        )
        convos: dict = {}
        for r in reversed(rows):
            convos.setdefault(r.chat_id, []).append({"role": r.role, "content": r.content})
        conversations = [{"chat_id": k, "messages": v} for k, v in convos.items()]
        fiche = config_repo.build_fiche_text(s, tenant.id)

        learn = ai_learn
        if learn is None:
            import anthropic
            from saas.ai_learn import analyze

            learn = lambda t, fiche_text, convs: analyze(  # noqa: E731
                anthropic.Anthropic(), t.wapy_model, fiche_text, convs
            )
        suggestions = learn(tenant, fiche, conversations)

        existing = {
            (x.kind, x.title)
            for x in s.query(models.Suggestion)
            .filter_by(tenant_id=tenant.id, status="pending")
            .all()
        }
        added = 0
        for sug in suggestions:
            key = (sug.get("kind"), sug.get("title"))
            if key in existing:
                continue
            s.add(models.Suggestion(
                tenant_id=tenant.id,
                kind=sug.get("kind"),
                title=sug.get("title", ""),
                payload=sug.get("payload", {}),
            ))
            existing.add(key)
            added += 1
        s.commit()
        return {"added": added}

    @app.get("/api/suggestions")
    def list_suggestions(tenant=Depends(current_tenant), s=Depends(db)):
        rows = (
            s.query(models.Suggestion)
            .filter_by(tenant_id=tenant.id, status="pending")
            .order_by(models.Suggestion.id.desc())
            .all()
        )
        return {"suggestions": [
            {"id": r.id, "kind": r.kind, "title": r.title, "payload": r.payload}
            for r in rows
        ]}

    @app.post("/api/suggestions/{sid}/accept")
    def accept_suggestion(sid: int, tenant=Depends(owner_tenant), s=Depends(db)):
        row = s.get(models.Suggestion, sid)
        if not row or row.tenant_id != tenant.id:
            raise HTTPException(status_code=404, detail="Suggestion introuvable")
        config_repo.apply_suggestion(s, tenant.id, row.kind, row.payload)
        row.status = "accepted"
        s.commit()
        return {"status": "accepted"}

    @app.post("/api/suggestions/{sid}/reject")
    def reject_suggestion(sid: int, tenant=Depends(owner_tenant), s=Depends(db)):
        row = s.get(models.Suggestion, sid)
        if not row or row.tenant_id != tenant.id:
            raise HTTPException(status_code=404, detail="Suggestion introuvable")
        row.status = "rejected"
        s.commit()
        return {"status": "rejected"}

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

    @app.post("/api/upload")
    async def upload_image(file: UploadFile = File(...), tenant=Depends(owner_tenant)):
        ct = (file.content_type or "").lower()
        if not ct.startswith("image/"):
            raise HTTPException(status_code=400, detail="Seules les images sont acceptées")
        ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
        if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
            ext = ".jpg"
        name = f"{tenant.id}_{uuid.uuid4().hex}{ext}"
        data = await file.read()
        with open(os.path.join(MEDIA_DIR, name), "wb") as f:
            f.write(data)
        return {"url": f"/media/{name}"}

    @app.post("/api/import")
    async def import_xlsx(file: UploadFile = File(...), tenant=Depends(owner_tenant), s=Depends(db)):
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
        names = {c.chat_id: c.name for c in s.query(models.Contact).filter_by(tenant_id=tenant.id).all()}
        staff_ids = set(_inbound_set(tenant))
        seen: dict = {}
        for r in rows:
            if r.chat_id not in seen:
                st = states.get(r.chat_id)
                seen[r.chat_id] = {
                    "chat_id": r.chat_id,
                    "name": names.get(r.chat_id, ""),
                    "last": (r.content or "")[:140],
                    "escalated": bool(st and st.escalated),
                    "staff": r.chat_id in staff_ids,
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
        contact = (
            s.query(models.Contact)
            .filter_by(tenant_id=tenant.id, chat_id=chat_id)
            .first()
        )
        return {
            "chat_id": chat_id,
            "name": contact.name if contact else "",
            "escalated": bool(st and st.escalated),
            "staff": chat_id in set(_inbound_set(tenant)),
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

    # --- Carnet : réservations/commandes/paiements conclus par le bot ---
    @app.get("/api/records")
    def list_records(tenant=Depends(current_tenant), s=Depends(db)):
        names = {c.chat_id: c.name for c in s.query(models.Contact).filter_by(tenant_id=tenant.id).all()}
        rows = (
            s.query(models.Record)
            .filter_by(tenant_id=tenant.id)
            .order_by(models.Record.id.desc())
            .limit(300)
            .all()
        )
        return {"records": [
            {
                "id": r.id,
                "kind": r.kind,
                "content": r.content,
                "chat_id": r.chat_id,
                "name": names.get(r.chat_id, ""),
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ]}

    # --- WhatsApp ---
    @app.post("/api/wa/connect")
    def wa_connect(tenant=Depends(owner_tenant), s=Depends(db)):
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

    @app.get("/api/wa/health")
    def wa_health(tenant=Depends(current_tenant), s=Depends(db)):
        from saas.health import classify
        row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
        status = row.status if row else "UNKNOWN"
        return {
            "status": status,
            "health": classify(status),
            "last_seen": row.last_seen.isoformat() if row and row.last_seen else "",
        }

    @app.get("/api/wa/status")
    def wa_status(tenant=Depends(current_tenant), s=Depends(db)):
        status = wam.get_status(tenant)
        row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
        if row:
            row.status = status
            s.commit()
        return {"status": status}

    @app.post("/api/wa/logout")
    def wa_logout(tenant=Depends(owner_tenant), s=Depends(db)):
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
        # Supervision : WAHA pousse les changements d'état de session.
        if payload.get("event") == "session.status":
            new = (payload.get("payload") or {}).get("status") or ""
            row = s.query(models.WaSession).filter_by(tenant_id=tenant.id).first()
            if row and new:
                if row.status == "WORKING" and new != "WORKING":
                    s.add(models.SessionIncident(tenant_id=tenant.id, status=new, note=f"{row.status} -> {new}"))
                row.status = new
                if new == "WORKING":
                    row.last_seen = datetime.utcnow()
                s.commit()
            return {"status": "session-status"}
        if (getattr(tenant, "status", "active") or "active") != "active":
            return {"status": "suspended"}
        channel = (channel_factory or wam.channel_for)(tenant)
        br = brain
        vision_fn = vision_analyze
        if br is None:
            import anthropic
            from brain.brain import Brain

            client = anthropic.Anthropic()
            br = Brain(client, tenant.wapy_model)
            if vision_fn is None:
                from saas.vision import analyze_image

                def vision_fn(image_bytes, media_type, _c=client, _m=tenant.wapy_model):
                    return analyze_image(_c, _m, image_bytes, media_type)
        return process_incoming(s, channel, br, tenant, payload, vision_analyze=vision_fn)

    return app


app = create_app(init=True)
