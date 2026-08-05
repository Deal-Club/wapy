import json
from brain.brain import Brain, build_system_prompt, Decision


def test_system_prompt_embeds_fiche_and_grounding_rule():
    sp = build_system_prompt("## Infos\n- Nom : Chez Léon")
    assert "Chez Léon" in sp
    assert "escalade" in sp.lower()  # règle : ne rien inventer -> escalade


def test_system_prompt_has_tone_rules():
    sp = build_system_prompt("x")
    low = sp.lower()
    assert "chaleureux" in low
    assert "concis" in low
    assert "—" in sp  # la règle mentionne explicitement le tiret long à éviter


class _FakeBlock:
    type = "text"

    def __init__(self, text):
        self.text = text


class _FakeResp:
    def __init__(self, text):
        self.content = [_FakeBlock(text)]


class _FakeMessages:
    def __init__(self, payload):
        self._payload = payload
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return _FakeResp(json.dumps(self._payload))


class _FakeClient:
    def __init__(self, payload):
        self.messages = _FakeMessages(payload)


def test_decide_returns_reply():
    client = _FakeClient(
        {"action": "reply", "message": "Nous ouvrons à 12h.", "reason": "horaires dans la fiche"}
    )
    d = Brain(client, model="claude-opus-4-8").decide(
        fiche_text="## Infos\n- Horaires : 12h",
        history=[],
        incoming_text="Vous ouvrez à quelle heure ?",
    )
    assert isinstance(d, Decision)
    assert d.action == "reply"
    assert d.message == "Nous ouvrons à 12h."


def test_decide_passes_model_history_and_schema():
    client = _FakeClient({"action": "escalate", "message": "", "reason": "réservation"})
    Brain(client, model="claude-haiku-4-5").decide(
        fiche_text="x",
        history=[
            {"role": "user", "content": "salut"},
            {"role": "assistant", "content": "bonjour"},
        ],
        incoming_text="je veux réserver",
    )
    call = client.messages.calls[0]
    assert call["model"] == "claude-haiku-4-5"
    assert call["messages"][-1] == {"role": "user", "content": "je veux réserver"}
    assert call["messages"][0] == {"role": "user", "content": "salut"}
    assert call["output_config"]["format"]["type"] == "json_schema"
    assert "thinking" not in call and "temperature" not in call
