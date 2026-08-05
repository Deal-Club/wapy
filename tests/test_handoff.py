from handoff.handoff import escalate_to_staff, CLIENT_ACK


class _FakeChannel:
    def __init__(self):
        self.sent = []

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))


class _FakeStore:
    def __init__(self):
        self.escalated = set()
        self.handoffs = []

    def set_escalated(self, chat_id):
        self.escalated.add(chat_id)

    def open_handoff(self, staff_number, client_id):
        self.handoffs.append((staff_number, client_id))


def test_escalate_notifies_each_staff_opens_handoff_and_acks_client():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(
        ch, st,
        chat_id="33611112222@c.us",
        incoming_text="Je veux réserver pour 4 samedi",
        staff_numbers=["33600000001@c.us", "33600000002@c.us"],
        reason="réservation",
    )
    assert st.escalated == {"33611112222@c.us"}
    # 1 handoff ouvert par numéro staff
    assert ("33600000001@c.us", "33611112222@c.us") in st.handoffs
    assert ("33600000002@c.us", "33611112222@c.us") in st.handoffs
    # chaque staff reçoit l'alerte (contient le message client)
    staff_msgs = [t for to, t in ch.sent if to.startswith("336000000")]
    assert len(staff_msgs) == 2
    assert all("réserver" in t for t in staff_msgs)
    # le client reçoit un accusé
    assert ("33611112222@c.us", CLIENT_ACK) in ch.sent


def test_escalate_no_staff_still_escalates_and_acks_client():
    ch, st = _FakeChannel(), _FakeStore()
    escalate_to_staff(ch, st, "c@c.us", "bonjour", staff_numbers=[], reason="x")
    assert st.escalated == {"c@c.us"}
    assert ch.sent == [("c@c.us", CLIENT_ACK)]
