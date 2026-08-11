import json
from brain.brain import Brain, build_system_blocks, build_system_prompt, Decision


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


# --- Cache de prompt ---------------------------------------------------------
# Le cache échoue en SILENCE (pas d'erreur, juste 0 token mis en cache) : ces
# tests verrouillent la présence du marqueur ET la position du point de rupture,
# pour qu'une future refonte du prompt ne les fasse pas sauter sans bruit.

def test_system_blocks_marque_le_prefixe_stable_pour_le_cache():
    blocks = build_system_blocks("## Infos\n- Nom : Chez Léon")
    assert len(blocks) == 1
    assert blocks[0]["cache_control"] == {"type": "ephemeral", "ttl": "1h"}
    # le préfixe cacheable contient bien le prompt système ET la fiche
    assert "Chez Léon" in blocks[0]["text"]
    assert blocks[0]["text"] == build_system_prompt("## Infos\n- Nom : Chez Léon")


def test_extra_arrive_apres_le_point_de_rupture():
    stable = build_system_blocks("FICHE")[0]
    blocks = build_system_blocks("FICHE", extra="## Résultat de la recherche\nstock: 5")
    assert len(blocks) == 2
    # bloc 0 inchangé octet pour octet -> il sera relu depuis le cache
    assert blocks[0] == stable
    # bloc 1 = contexte volatil, APRÈS le point de rupture, jamais mis en cache
    assert "stock: 5" in blocks[1]["text"]
    assert "cache_control" not in blocks[1]


def test_rien_de_variable_avant_le_point_de_rupture():
    """Deux constructions identiques doivent donner des octets identiques
    (pas d'horodatage, d'identifiant de session ni de datetime.now())."""
    a = build_system_blocks("FICHE", "whatsapp")
    b = build_system_blocks("FICHE", "whatsapp")
    assert a == b


def test_decide_envoie_le_system_en_blocs_avec_cache_control():
    client = _FakeClient({"action": "reply", "message": "ok", "reason": "x"})
    Brain(client, model="claude-haiku-4-5").decide(
        fiche_text="## Infos\n- Horaires : 12h", history=[], incoming_text="?",
        extra="## Résultat de la recherche\nrien",
    )
    system = client.messages.calls[0]["system"]
    assert isinstance(system, list)
    assert system[0]["cache_control"]["type"] == "ephemeral"
    assert "Horaires : 12h" in system[0]["text"]
    assert "cache_control" not in system[-1]  # l'extra reste hors cache
