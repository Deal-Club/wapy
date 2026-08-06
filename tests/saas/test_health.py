from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth, models, health


class _FakeWa:
    def __init__(self, statuses):
        self.statuses = statuses

    def list_sessions(self):
        return [{"name": n, "status": s} for n, s in self.statuses.items()]


def _sf():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


def test_classify():
    assert health.classify("WORKING") == "ok"
    assert health.classify("FAILED") == "down"
    assert health.classify("SCAN_QR_CODE") == "scan"


def test_check_once_logs_incident_on_downgrade():
    sf = _sf()
    s = sf()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    sname = f"t{t.id}"
    s.add(models.WaSession(tenant_id=t.id, session_name=sname, status="WORKING"))
    s.commit()

    n = health.check_once(sf, _FakeWa({sname: "FAILED"}))
    assert n == 1
    s2 = sf()
    inc = s2.query(models.SessionIncident).all()
    assert len(inc) == 1 and inc[0].status == "FAILED"
    assert s2.query(models.WaSession).first().status == "FAILED"


def test_check_once_recovery_sets_last_seen_no_incident():
    sf = _sf()
    s = sf()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    sname = f"t{t.id}"
    s.add(models.WaSession(tenant_id=t.id, session_name=sname, status="FAILED"))
    s.commit()

    n = health.check_once(sf, _FakeWa({sname: "WORKING"}))
    assert n == 0
    row = sf().query(models.WaSession).first()
    assert row.status == "WORKING" and row.last_seen is not None
