import json
from brain.brain import (
    Brain, build_messages, build_system_blocks, build_system_prompt, Decision,
    EXEMPLES, HISTORY_CACHE_MAX,
)


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


# --- Second point de rupture : l'historique -----------------------------------
# L'historique vit dans `messages`, donc après le préfixe système : il était repayé
# plein tarif à chaque appel alors qu'il grossit à chaque tour. Le cache étant un
# PRÉFIXE, ce second point de rupture ne vaut que sous deux conditions, et les deux
# gardes valent de l'argent : sans elles on achète une écriture (2x) jamais relue.

def _historique(n):
    return [{"role": "user" if i % 2 == 0 else "assistant", "content": f"m{i}"}
            for i in range(n)]


def _porte_le_cache(message):
    contenu = message["content"]
    return isinstance(contenu, list) and "cache_control" in contenu[-1]


def test_historique_porte_le_second_point_de_rupture():
    messages = build_messages(_historique(4), "et vos horaires ?")
    assert _porte_le_cache(messages[-2])           # dernier message de l'historique
    assert messages[-2]["content"][-1]["text"] == "m3"
    assert messages[-2]["content"][-1]["cache_control"]["ttl"] == "1h"


def test_le_message_entrant_ne_porte_jamais_le_cache():
    """Il est différent à chaque appel : le marquer n'écrirait que des caches morts."""
    messages = build_messages(_historique(4), "et vos horaires ?")
    assert messages[-1] == {"role": "user", "content": "et vos horaires ?"}


def test_pas_de_point_de_rupture_si_un_bloc_volatil_precede():
    """`extra` (créneaux du moment, résultat de recherche) est placé AVANT
    l'historique et change à chaque message : tout ce qui suit est invalidé."""
    messages = build_messages(_historique(4), "?", extra="## Rendez-vous\n[10:00]")
    assert not any(_porte_le_cache(m) for m in messages)


def test_pas_de_point_de_rupture_quand_la_fenetre_glisse():
    """Fenêtre pleine : l'appelant jette le plus ancien à chaque tour, donc le
    préfixe change à chaque tour et le cache ne serait jamais relu."""
    messages = build_messages(_historique(HISTORY_CACHE_MAX), "?")
    assert not any(_porte_le_cache(m) for m in messages)


def test_historique_trop_court_pas_de_cache():
    assert not any(_porte_le_cache(m) for m in build_messages(_historique(1), "?"))


def test_historique_vide_ne_casse_rien():
    assert build_messages([], "bonjour") == [{"role": "user", "content": "bonjour"}]


def test_message_vide_ignore_plutot_que_de_produire_un_bloc_invalide():
    histo = _historique(3) + [{"role": "assistant", "content": "   "}]
    messages = build_messages(histo, "?")
    assert not any(_porte_le_cache(m) for m in messages)


def test_fenetre_de_cache_egale_a_celle_des_appelants():
    """Si un appelant élargit sa fenêtre sans toucher à HISTORY_CACHE_MAX, le
    glissement reprend en silence et chaque message paie une écriture."""
    from saas.bot import HISTORY_LIMIT as limite_bot
    from saas.webchat import HISTORY_LIMIT as limite_webchat
    assert HISTORY_CACHE_MAX == limite_bot == limite_webchat


# --- Seuil de cache de Haiku ---------------------------------------------------

def test_les_exemples_maintiennent_les_petits_tenants_au_dessus_du_seuil_haiku():
    """Haiku 4.5 n'amorce son cache qu'à 4 096 tokens de préfixe (Sonnet : 1 024),
    et l'échec est SILENCIEUX : aucune erreur, juste 0 token mis en cache.
    Frontière mesurée sur l'API : 4 088 -> rien, 4 174 -> cache OK.

    Calibration : le prompt système sans les exemples a été mesuré à 2 539 tokens
    par count_tokens (Haiku 4.5, canal WhatsApp). On en déduit un ratio pour CE
    texte, qui sert de garde-fou hors ligne. Ce n'est pas un compteur de tokens :
    c'est une alarme si quelqu'un raccourcit le bloc d'exemples, ce qui replongerait
    les petits tenants sous le seuil sans que rien ne casse.
    """
    exemples = len(EXEMPLES)
    ratio = (len(build_system_prompt("", "whatsapp")) - exemples) / 2539
    schema = 400  # le json_schema s'ajoute au préfixe cacheable
    # Fiche d'un salon minimal mais réel : 5 prestations, 4 questions, horaires.
    fiche_petite = "x" * 1266
    total = (len(build_system_prompt(fiche_petite, "whatsapp")) / ratio) + schema
    assert total > 4174, (
        f"préfixe estimé à {total:.0f} tokens : sous la frontière mesurée du cache "
        f"Haiku. Les exemples ({exemples} car.) ont-ils été raccourcis ?"
    )
