from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth, models, wa


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_session_name_and_channel():
    s = _session()
    _, tenant = auth.signup(s, "a@b.com", "x", "T")
    assert wa.session_name(tenant.id) == f"t{tenant.id}"
    ch = wa.channel_for(tenant)
    assert ch.session == f"t{tenant.id}"


def test_tenant_for_session_via_table_and_fallback():
    s = _session()
    _, tenant = auth.signup(s, "a@b.com", "x", "T")
    sname = wa.session_name(tenant.id)
    # fallback "t{id}" (pas de ligne WaSession)
    assert wa.tenant_for_session(s, sname).id == tenant.id
    # via table WaSession
    s.add(models.WaSession(tenant_id=tenant.id, session_name="custom-x", status="WORKING"))
    s.commit()
    assert wa.tenant_for_session(s, "custom-x").id == tenant.id
    # inconnu
    assert wa.tenant_for_session(s, "nope") is None
