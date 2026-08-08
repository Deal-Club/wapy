from brain.brain import Decision, decide_with_lookup


class _SeqBrain:
    """Renvoie une suite de décisions et enregistre les fiches reçues."""
    def __init__(self, decisions):
        self.decisions = list(decisions)
        self.fiches = []

    def decide(self, fiche, history, text, channel="whatsapp"):
        self.fiches.append(fiche)
        return self.decisions.pop(0)


def test_lookup_loop_feeds_result_then_replies():
    br = _SeqBrain([
        Decision("lookup", "", "cherche", lookup_query="perceuse"),
        Decision("reply", "Il en reste 5 à 3000 F.", "ok"),
    ])
    seen = {}

    def lookup(q):
        seen["q"] = q
        return '{"stock": 5}'

    d = decide_with_lookup(br, "FICHE", [], "avez-vous des perceuses ?", lookup)
    assert d.action == "reply" and "5" in d.message
    assert seen["q"] == "perceuse"
    # le 2e appel au cerveau contient le résultat injecté
    assert "Résultat de la recherche" in br.fiches[1]


def test_lookup_without_connector_is_noop():
    br = _SeqBrain([Decision("lookup", "", "cherche", lookup_query="x")])
    d = decide_with_lookup(br, "FICHE", [], "test", lookup_fn=None)
    # pas de connecteur -> on ne boucle pas, on retombe sur reply
    assert d.action == "reply"


def test_lookup_loop_capped():
    # le cerveau demande toujours un lookup -> on plafonne et on répond quand même
    br = _SeqBrain([Decision("lookup", "", "c", lookup_query="a")] * 5)
    d = decide_with_lookup(br, "F", [], "t", lambda q: "rien", max_loops=2)
    assert d.action == "reply"
    assert len(br.fiches) == 3  # 1 initial + 2 boucles
