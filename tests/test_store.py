from store.conversations import ConversationStore


def test_append_and_get_history(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    s.append("33612345678@c.us", "user", "Bonjour")
    s.append("33612345678@c.us", "assistant", "Bonjour, comment aider ?")
    hist = s.get_history("33612345678@c.us", limit=10)
    assert hist == [
        {"role": "user", "content": "Bonjour"},
        {"role": "assistant", "content": "Bonjour, comment aider ?"},
    ]


def test_history_limit_keeps_most_recent_in_order(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    for i in range(5):
        s.append("c@c.us", "user", f"msg{i}")
    hist = s.get_history("c@c.us", limit=2)
    assert [h["content"] for h in hist] == ["msg3", "msg4"]


def test_escalation_flag(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    assert s.is_escalated("c@c.us") is False
    s.set_escalated("c@c.us")
    assert s.is_escalated("c@c.us") is True


def test_optout_flag(tmp_path):
    s = ConversationStore(str(tmp_path / "t.db"))
    assert s.is_optout("c@c.us") is False
    s.set_optout("c@c.us")
    assert s.is_optout("c@c.us") is True
