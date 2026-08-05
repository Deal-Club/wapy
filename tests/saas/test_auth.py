import pytest
from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth


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
