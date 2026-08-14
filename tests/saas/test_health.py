from datetime import datetime, timedelta

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


class _WA:
    def channel_for(self, tenant):
        class _C:
            def send_text(self, *a, **k):
                pass
        return _C()


def test_enforce_subscriptions_suspends_expired():
    sf = _sf()
    s = sf()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    s.add(models.Subscription(tenant_id=t.id, status="trial",
                              current_period_end=datetime.utcnow() - timedelta(days=1)))
    s.commit()
    n = health.enforce_subscriptions(sf, _WA())
    assert n == 1
    s2 = sf()
    assert s2.get(models.Subscription, t.id).status == "expired"
    assert s2.get(models.Tenant, t.id).status == "suspended"


def test_enforce_subscriptions_keeps_valid():
    sf = _sf()
    s = sf()
    _, t = auth.signup(s, "b@b.com", "x", "T2")
    s.add(models.Subscription(tenant_id=t.id, status="active", plan="pro",
                              current_period_end=datetime.utcnow() + timedelta(days=10)))
    s.commit()
    assert health.enforce_subscriptions(sf, _WA()) == 0
    assert sf().get(models.Tenant, t.id).status == "active"


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


def test_send_booking_reminders_ne_leve_pas():
    """`timedelta` manquait à l'import : la fonction levait NameError à chaque
    tour de boucle, donc AUCUN rappel J-1/H-2 n'est jamais parti en production."""
    sf = _sf()
    s = sf()
    t = models.Tenant(name="T", staff_numbers="")
    s.add(t); s.commit()
    s.add(models.Booking(tenant_id=t.id, chat_id="c@c.us", service="Coupe",
                         start=datetime.utcnow() + timedelta(hours=23, minutes=30),
                         duration_min=30, status="booked"))
    s.commit(); s.close()

    envoyes = []

    class _Wa:
        def send_text(self, chat_id, text):
            envoyes.append((chat_id, text))

    assert health.send_booking_reminders(sf, _Wa()) >= 0
