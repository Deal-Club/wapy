"""Authentification : hash mot de passe (bcrypt), JWT, signup/login."""
import os
import re
import time

import bcrypt
import jwt

from saas import models

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"
TOKEN_TTL = 60 * 60 * 24 * 7  # 7 jours


class SignupError(Exception):
    pass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: int, tenant_id: int, now: int | None = None) -> str:
    now = now or int(time.time())
    payload = {"uid": user_id, "tid": tenant_id, "iat": now, "exp": now + TOKEN_TTL}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


def admin_emails() -> set[str]:
    """Emails super-admin plateforme (opérateur Wapy), depuis l'env ADMIN_EMAILS."""
    return {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}


def is_admin(email: str) -> bool:
    return (email or "").strip().lower() in admin_emails()


def create_agent(session, tenant_id: int, email: str, password: str):
    """Crée un membre d'équipe (rôle agent) rattaché à un tenant existant."""
    email = email.strip().lower()
    if session.query(models.User).filter_by(email=email).first():
        raise SignupError("email déjà utilisé")
    user = models.User(
        tenant_id=tenant_id, email=email, password_hash=hash_password(password), role="agent"
    )
    session.add(user)
    session.commit()
    return user


def _slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "resto"


def signup(session, email: str, password: str, resto_nom: str):
    email = email.strip().lower()
    if session.query(models.User).filter_by(email=email).first():
        raise SignupError("email déjà utilisé")
    tenant = models.Tenant(name=resto_nom, slug=_slug(resto_nom))
    session.add(tenant)
    session.flush()
    user = models.User(
        tenant_id=tenant.id, email=email, password_hash=hash_password(password)
    )
    session.add(user)
    session.commit()
    return user, tenant


def authenticate(session, email: str, password: str):
    email = email.strip().lower()
    user = session.query(models.User).filter_by(email=email).first()
    if user and verify_password(password, user.password_hash):
        return user
    return None
