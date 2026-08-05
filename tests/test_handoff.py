from handoff.handoff import escalate_to_staff


class _FakeChannel:
    def __init__(self):
        self.sent = []

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _FakeStore:
    def __init__(self):
        self.escalated = set()

    def set_escalated(self, chat_id):
        self.escalated.add(chat_id)


def test_escalate_notifies_each_staff_and_marks_state():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(
        ch, st,
        chat_id="33611112222@c.us",
        incoming_text="Je veux réserver pour 4 samedi",
        staff_numbers=["33600000001@c.us", "33600000002@c.us"],
        reason="réservation",
    )
    assert st.escalated == {"33611112222@c.us"}
    assert len(ch.sent) == 2
    to_first, body_first = ch.sent[0]
    assert to_first == "33600000001@c.us"
    assert "réserver" in body_first  # le message client est repris dans l'alerte


def test_escalate_no_staff_configured_still_marks_state():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(ch, st, "c@c.us", "bonjour", staff_numbers=[], reason="x")
    assert st.escalated == {"c@c.us"}
    assert ch.sent == []
