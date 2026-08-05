from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import models


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_create_tenant_and_user():
    s = _session()
    t = models.Tenant(name="Chez Test", slug="chez-test")
    s.add(t)
    s.flush()
    s.add(models.User(tenant_id=t.id, email="a@b.com", password_hash="x"))
    s.commit()
    got = s.query(models.User).filter_by(email="a@b.com").one()
    assert got.tenant_id == t.id
    assert got.role == "owner"


def test_tenant_scoped_config_isolation():
    s = _session()
    t1 = models.Tenant(name="T1")
    t2 = models.Tenant(name="T2")
    s.add_all([t1, t2])
    s.flush()
    s.add(models.MenuItem(tenant_id=t1.id, plat="Riz au gras", prix="2500"))
    s.add(models.MenuItem(tenant_id=t2.id, plat="Poulet", prix="3000"))
    s.commit()
    t1_items = s.query(models.MenuItem).filter_by(tenant_id=t1.id).all()
    assert len(t1_items) == 1
    assert t1_items[0].plat == "Riz au gras"
