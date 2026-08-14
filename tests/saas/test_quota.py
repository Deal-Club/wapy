"""Quota de conversations : comptage, refus, et ce qui doit continuer de passer."""
from sqlalchemy.orm import sessionmaker

from saas import auth, billing, models, usage
from saas.db import Base, make_engine


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def _tenant(s, email="a@b.com", nom="Chez Test"):
    _, t = auth.signup(s, email, "x", nom)
    return t


def test_une_conversation_est_un_interlocuteur_par_mois():
    """Un habitué qui écrit dix fois compte pour une conversation, pas dix."""
    s = _session()
    t = _tenant(s)
    for _ in range(10):
        usage.noter_conversation(s, t.id, "229900@c.us")
    assert usage.conversations_du_mois(s, t.id) == 1


def test_sous_le_quota_rien_n_est_refuse():
    s = _session()
    t = _tenant(s)
    assert usage.quota_atteint(s, t.id, "nouveau@c.us", 5) is False


def test_au_quota_un_nouvel_interlocuteur_est_refuse():
    s = _session()
    t = _tenant(s)
    for i in range(3):
        usage.noter_conversation(s, t.id, f"c{i}@c.us")
    assert usage.quota_atteint(s, t.id, "quatrieme@c.us", 3) is True


def test_au_quota_une_conversation_deja_engagee_passe_toujours():
    """On ne coupe pas quelqu'un au milieu d'un échange sous prétexte de plafond."""
    s = _session()
    t = _tenant(s)
    for i in range(3):
        usage.noter_conversation(s, t.id, f"c{i}@c.us")
    assert usage.quota_atteint(s, t.id, "c1@c.us", 3) is False


def test_limite_zero_vaut_illimite():
    s = _session()
    t = _tenant(s)
    for i in range(50):
        usage.noter_conversation(s, t.id, f"c{i}@c.us")
    assert usage.quota_atteint(s, t.id, "encore@c.us", 0) is False


def test_quotas_isoles_par_etablissement():
    s = _session()
    t1, t2 = _tenant(s, "a@b.com", "Resto A"), _tenant(s, "c@d.com", "Resto B")
    for i in range(5):
        usage.noter_conversation(s, t1.id, f"c{i}@c.us")
    assert usage.conversations_du_mois(s, t1.id) == 5
    assert usage.conversations_du_mois(s, t2.id) == 0
    assert usage.quota_atteint(s, t2.id, "c0@c.us", 5) is False


def test_le_widget_web_consomme_le_meme_quota():
    """Compter le site à part reviendrait à vendre deux fois le même forfait."""
    s = _session()
    t = _tenant(s)
    usage.noter_conversation(s, t.id, "web:abc")
    usage.noter_conversation(s, t.id, "229900@c.us")
    assert usage.conversations_du_mois(s, t.id) == 2


# --- Chemin réel : le quota doit couper AVANT l'appel au modèle ------------

class _Ch:
    def __init__(self):
        self.sent = []

    def parse_incoming(self, payload):
        from channel.base import IncomingMessage

        p = payload["payload"]
        return IncomingMessage(p["from"], p.get("body", ""), False, False, p.get("id", ""))

    def send_text(self, chat_id, text):
        self.sent.append((chat_id, text))
        return "mid"


class _Brain:
    def __init__(self):
        self.appels = 0

    def decide(self, fiche_text, history, incoming_text, channel="whatsapp", extra=""):
        from brain.brain import Decision

        self.appels += 1
        return Decision("reply", "Bonjour !", "ok")


def _payload(cid, body="bonjour", mid="m1"):
    return {"payload": {"from": cid, "body": body, "id": mid}}


def _abonne(s, tenant, plan="essentiel"):
    s.add(models.Subscription(tenant_id=tenant.id, plan=plan, addons=[], status="active"))
    s.commit()


def test_au_quota_le_modele_n_est_jamais_appele():
    """Un refus qui se paie un appel au modèle ne protège de rien."""
    from saas.bot import process_incoming

    s = _session()
    t = _tenant(s)
    _abonne(s, t)
    limite = billing.PLANS["essentiel"]["limits"]["conversations"]
    for i in range(limite):
        s.add(models.MonthlyConversation(
            tenant_id=t.id, month=usage._month(), chat_id=f"deja{i}@c.us"))
    s.commit()

    ch, cerveau = _Ch(), _Brain()
    r = process_incoming(s, ch, cerveau, t, _payload("nouveau@c.us"))

    assert r["status"] == "quota"
    assert cerveau.appels == 0  # le plafond a coupé en amont
    assert ch.sent and "revenons vers vous" in ch.sent[0][1]


def test_sous_le_quota_le_bot_repond_normalement():
    from saas.bot import process_incoming

    s = _session()
    t = _tenant(s)
    _abonne(s, t)
    ch, cerveau = _Ch(), _Brain()
    r = process_incoming(s, ch, cerveau, t, _payload("client@c.us"))

    assert r["status"] == "replied"
    assert cerveau.appels == 1
    assert usage.conversations_du_mois(s, t.id) == 1


# --- Grille tarifaire ------------------------------------------------------

def test_tous_les_plans_ont_un_quota_borne():
    """Aucun plan ne promet l'illimité : c'est le seul poste au coût non borné."""
    for cle, plan in billing.PLANS.items():
        assert plan["limits"]["conversations"] > 0, cle


def test_les_plans_tournent_tous_sur_le_modele_standard():
    """L'éval ne mesure aucun écart entre Haiku et Sonnet 5 sur les cas réels."""
    assert {p["model"] for p in billing.PLANS.values()} == {billing.MODELE_STANDARD}


def test_l_option_modele_avance_change_le_cerveau():
    base = billing.entitlements_for("essentiel")
    avec = billing.entitlements_for("essentiel", ["modele_avance"])
    assert base["model"] == billing.MODELE_STANDARD
    assert avec["model"] == billing.MODELE_AVANCE


def test_l_option_conversations_augmente_le_quota():
    base = billing.entitlements_for("essentiel")["limits"]["conversations"]
    avec = billing.entitlements_for("essentiel", ["conversations_1000"])["limits"]["conversations"]
    assert avec == base + 1000


def test_l_essai_tourne_sur_le_modele_qu_on_vend():
    """Un essai plus performant que le produit se paie d'une déception au 8e jour."""
    assert billing.TRIAL_ENT["model"] == billing.MODELE_STANDARD
    assert billing.TRIAL_ENT["limits"]["conversations"] > 0


def test_le_prix_croit_avec_le_quota():
    ordre = ["essentiel", "pro", "business"]
    prix = [billing.PLANS[p]["price"] for p in ordre]
    quotas = [billing.PLANS[p]["limits"]["conversations"] for p in ordre]
    assert prix == sorted(prix)
    assert quotas == sorted(quotas)
