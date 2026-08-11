from brain.brain import Decision, decide_with_lookup


class _SeqBrain:
    """Renvoie une suite de décisions et enregistre les fiches/extras reçus."""
    def __init__(self, decisions):
        self.decisions = list(decisions)
        self.fiches = []
        self.extras = []

    def decide(self, fiche, history, text, channel="whatsapp", extra=""):
        self.fiches.append(fiche)
        self.extras.append(extra)
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
    # le 2e appel au cerveau contient le résultat injecté...
    assert "Résultat de la recherche" in br.extras[1]
    # ...hors de la fiche : le préfixe mis en cache reste identique octet pour
    # octet entre les deux appels (sinon le 2e appel repaie tout plein tarif).
    assert br.fiches[0] == br.fiches[1] == "FICHE"
    assert br.extras[0] == ""


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
