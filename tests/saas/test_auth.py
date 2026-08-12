import importlib
import os

import pytest
from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth


def _recharge_avec_secret(valeur: str | None):
    """Rejoue l'import de `saas.auth` avec JWT_SECRET fixé à `valeur`.

    Restaure toujours l'environnement et un module sain : le secret est lu au
    chargement du module, donc un test qui le laisse cassé casse les suivants.
    """
    ancien = os.environ.pop("JWT_SECRET", None)
    if valeur is not None:
        os.environ["JWT_SECRET"] = valeur
    try:
        importlib.reload(auth)
    finally:
        os.environ.pop("JWT_SECRET", None)
        if ancien is not None:
            os.environ["JWT_SECRET"] = ancien
        importlib.reload(auth)


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_signup_and_authenticate():
    s = _session()
    user, tenant = auth.signup(s, "Owner@X.com", "secret123", "Chez Test")
    assert tenant.name == "Chez Test"
    assert user.email == "owner@x.com"  # normalisé
    assert auth.authenticate(s, "owner@x.com", "secret123") is not None
    assert auth.authenticate(s, "owner@x.com", "wrong") is None


def test_signup_duplicate_email_raises():
    s = _session()
    auth.signup(s, "a@b.com", "x", "T1")
    with pytest.raises(auth.SignupError):
        auth.signup(s, "A@B.com", "y", "T2")


def test_token_roundtrip():
    tok = auth.create_token(1, 2)
    data = auth.decode_token(tok)
    assert data["uid"] == 1 and data["tid"] == 2


def test_password_hash_not_plaintext():
    h = auth.hash_password("secret123")
    assert h != "secret123"
    assert auth.verify_password("secret123", h)
    assert not auth.verify_password("nope", h)


def test_jwt_secret_absent_empeche_le_demarrage():
    """Sans secret, l'API doit refuser de démarrer plutôt que signer avec un défaut.

    Un défaut permissif signait les jetons avec une chaîne présente dans le
    dépôt : quiconque lisait le code pouvait forger un jeton d'administrateur.
    """
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        _recharge_avec_secret(None)


def test_jwt_secret_vide_empeche_le_demarrage():
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        _recharge_avec_secret("   ")


def test_jwt_secret_ancien_defaut_refuse():
    """La valeur historique est publiée dans l'historique Git : elle ne vaut rien."""
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        _recharge_avec_secret("dev-secret-change-me")


def test_jwt_secret_valide_charge_le_module():
    _recharge_avec_secret("k" * 32)  # ne lève pas
