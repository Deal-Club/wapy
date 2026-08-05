"""API FastAPI de la plateforme Wapy (P1 : auth + webhook multi-tenant)."""
from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel, EmailStr

from saas.db import SessionLocal, init_db
from saas import auth, wa
from saas.bot import process_incoming


class SignupIn(BaseModel):
    email: EmailStr
    password: str
    resto_nom: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


def create_app(session_factory=None, channel_factory=None, brain=None, init=False):
    app = FastAPI(title="Wapy Platform")
    sf = session_factory or SessionLocal
    if init:
        init_db()

    def db():
        s = sf()
        try:
            yield s
        finally:
            s.close()

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy Platform"}

    @app.post("/auth/signup")
    def signup(body: SignupIn, s=Depends(db)):
        try:
            user, tenant = auth.signup(s, body.email, body.password, body.resto_nom)
        except auth.SignupError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return {
            "token": auth.create_token(user.id, tenant.id),
            "tenant": {"id": tenant.id, "name": tenant.name},
        }

    @app.post("/auth/login")
    def login(body: LoginIn, s=Depends(db)):
        user = auth.authenticate(s, body.email, body.password)
        if not user:
            raise HTTPException(status_code=401, detail="identifiants invalides")
        return {"token": auth.create_token(user.id, user.tenant_id)}

    @app.post("/webhook")
    async def webhook(request: Request, s=Depends(db)):
        payload = await request.json()
        sname = payload.get("session", "")
        tenant = wa.tenant_for_session(s, sname)
        if tenant is None:
            return {"status": "unknown-session"}
        channel = (channel_factory or wa.channel_for)(tenant)
        br = brain
        if br is None:
            import anthropic
            from brain.brain import Brain

            br = Brain(anthropic.Anthropic(), tenant.wapy_model)
        return process_incoming(s, channel, br, tenant, payload)

    return app


app = create_app()
