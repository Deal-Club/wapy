from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth
from saas.store_db import DbStore


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def _two_tenants(s):
    _, t1 = auth.signup(s, "a@b.com", "x", "T1")
    _, t2 = auth.signup(s, "c@d.com", "y", "T2")
    return t1.id, t2.id


def test_history_escalate_optout_processed():
    s = _session()
    t1, _ = _two_tenants(s)
    st = DbStore(s, t1)
    st.append("c@c.us", "user", "Bonjour")
    st.append("c@c.us", "assistant", "Salut")
    assert st.get_history("c@c.us", 10) == [
        {"role": "user", "content": "Bonjour"},
        {"role": "assistant", "content": "Salut"},
    ]
    assert st.is_escalated("c@c.us") is False
    st.set_escalated("c@c.us")
    assert st.is_escalated("c@c.us") is True
    st.clear_escalated("c@c.us")
    assert st.is_escalated("c@c.us") is False
    st.set_optout("c@c.us")
    assert st.is_optout("c@c.us") is True
    assert st.is_processed("m1") is False
    st.mark_processed("m1")
    assert st.is_processed("m1") is True


def test_handoff_lifecycle():
    s = _session()
    t1, _ = _two_tenants(s)
    st = DbStore(s, t1)
    assert st.latest_open_handoff_client() is None
    st.open_handoff("staff@c.us", "client@c.us")
    assert st.latest_open_handoff_client() == "client@c.us"
    st.resolve_handoffs_for_client("client@c.us")
    assert st.latest_open_handoff_client() is None


def test_isolation_between_tenants():
    s = _session()
    t1, t2 = _two_tenants(s)
    DbStore(s, t1).mark_processed("m1")
    DbStore(s, t1).set_escalated("c@c.us")
    # t2 ne voit rien de t1
    assert DbStore(s, t2).is_processed("m1") is False
    assert DbStore(s, t2).is_escalated("c@c.us") is False
    assert DbStore(s, t2).get_history("c@c.us", 10) == []
