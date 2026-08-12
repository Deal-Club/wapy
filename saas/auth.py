"""Authentification : hash mot de passe (bcrypt), JWT, signup/login."""
import os
import re
import time

import bcrypt
import jwt

from saas import models

# Valeur qui servait autrefois de repli. Elle est dans l'historique Git, donc
# publique : elle est refusée explicitement, sans quoi un déploiement qui la
# reprendrait n'aurait aucune sécurité tout en semblant configuré.
_ANCIEN_REPLI = "dev-secret-change-me"


def _lire_jwt_secret() -> str:
    """Secret de signature des jetons. Absent ou trivial : on refuse de démarrer.

    Un repli permissif signait les jetons d'authentification avec une chaîne
    présente dans le dépôt : quiconque lisait le code pouvait forger un jeton
    d'administrateur. Une API qui refuse de démarrer est un incident visible en
    trente secondes ; une API qui démarre avec un secret connu ne se voit pas.
    """
    secret = os.environ.get("JWT_SECRET", "").strip()
    if not secret or secret == _ANCIEN_REPLI:
        raise RuntimeError(
            "JWT_SECRET manquant ou trivial. Renseigne-le dans l'environnement "
            "avec 32 caractères aléatoires ou plus (les jetons d'authentification "
            "sont signés avec) : python -c \"import secrets;print(secrets.token_urlsafe(32))\""
        )
    return secret


JWT_SECRET = _lire_jwt_secret()
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


STATE_TTL = 600  # 10 min : durée d'un aller-retour OAuth


def sign_state(tenant_id: int, user_id: int, purpose: str, now: int | None = None) -> str:
    """Jeton court signé transporté dans un flux OAuth (paramètre `state`)."""
    now = now or int(time.time())
    payload = {"tid": tenant_id, "uid": user_id, "purpose": purpose,
               "iat": now, "exp": now + STATE_TTL}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def verify_state(token: str, purpose: str) -> dict:
    """Valide un `state` OAuth (signature, expiration, finalité). Lève en cas d'échec."""
    d = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    if d.get("purpose") != purpose:
        raise ValueError("state: finalité invalide")
    return d


def admin_emails() -> set[str]:
    """Emails super-admin plateforme (opérateur Wapy), depuis l'env ADMIN_EMAILS."""
    return {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}


def is_admin(email: str) -> bool:
    return (email or "").strip().lower() in admin_emails()


def create_agent(session, tenant_id: int, email: str, password: str, must_change: bool = True):
    """Crée un membre d'équipe (rôle agent) rattaché à un tenant existant."""
    email = email.strip().lower()
    if session.query(models.User).filter_by(email=email).first():
        raise SignupError("email déjà utilisé")
    user = models.User(
        tenant_id=tenant_id, email=email, password_hash=hash_password(password),
        role="agent", must_change_password=must_change,
    )
    session.add(user)
    session.commit()
    return user


def set_password(session, user, new_password: str) -> None:
    """Change le mot de passe et lève l'obligation de changement."""
    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    session.commit()


def gen_password(n: int = 10) -> str:
    """Mot de passe temporaire lisible (sans caractères ambigus)."""
    import secrets
    alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(n))


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
