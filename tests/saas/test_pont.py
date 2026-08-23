"""Pont WhatsApp pour developpeurs : authentification, garde-fous, confidentialite.

Le pont est gratuit et fait partir des messages sortants : ses bornes sont la
seule chose qui l'empeche de devenir un relais de diffusion. Elles sont donc
testees une par une, y compris celles qui ne servent qu'en cas d'abus.
"""
import hashlib

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from saas import models, pont
from saas.app import create_app
from saas.db import Base, make_engine


def _factory():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)


class _Canal:
    """Faux canal WAHA : retient les envois au lieu de contacter WhatsApp."""

    envoyes: list = []

    def __init__(self, *a, **k):
        pass

    def send_text(self, chat_id, texte):
        _Canal.envoyes.append((chat_id, texte))
        return "mid"

    def parse_incoming(self, payload):
        from channel.base import IncomingMessage

        p = payload["payload"]
        return IncomingMessage(p["from"], p.get("body", ""), False, False, p.get("id", ""))


def _app_pont(s, **kw):
    cle, prefixe, empreinte_cle = pont.generer_cle()
    a = models.PontApp(
        nom=kw.get("nom", "Gestion scolaire"), email="dev@ecole.bj",
        prefixe_cle=prefixe, cle_hash=empreinte_cle,
        session_name=kw.get("session_name", "pont1"),
        statut=kw.get("statut", "actif"),
        intervalle_min_s=kw.get("intervalle_min_s", 0),
        envois_par_heure=kw.get("envois_par_heure", 60),
        envois_par_jour=kw.get("envois_par_jour", 500),
    )
    s.add(a)
    s.commit()
    return a, cle


def _client(sf, monkeypatch=None):
    _Canal.envoyes = []
    from saas import wa

    wa.channel_for_session = lambda sname: _Canal()
    return TestClient(create_app(session_factory=sf))


def _entetes(cle, idem="i1"):
    return {"Authorization": f"Bearer {cle}", "Idempotency-Key": idem}


def _corps(dest="+22990000001", texte="Paiement recu : 50 000 FCFA."):
    return {"destinataire": dest, "texte": texte, "consentement": "insc-2026-114"}


# --- Authentification ------------------------------------------------------

def test_sans_cle_rien_ne_part():
    sf = _factory()
    c = _client(sf)
    assert c.post("/pont/v1/messages", json=_corps()).status_code == 401
    assert _Canal.envoyes == []


def test_cle_invalide_refusee():
    sf = _factory()
    s = sf()
    _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(),
               headers=_entetes(pont.PREFIXE + "fausse-cle-totalement-inventee"))
    assert r.status_code == 401


def test_compte_suspendu_refuse():
    """L'interrupteur : couper un compte sans toucher au reste du service."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s, statut="suspendu")
    c = _client(sf)
    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle)).status_code == 401


def test_la_cle_n_est_jamais_stockee_en_clair():
    sf = _factory()
    s = sf()
    a, cle = _app_pont(s)
    assert cle not in (a.cle_hash or "")
    assert a.cle_hash == hashlib.sha256(cle.encode()).hexdigest()
    assert len(a.prefixe_cle) == pont.LONGUEUR_PREFIXE


# --- Envoi ----------------------------------------------------------------

def test_envoi_nominal():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    assert r.status_code == 200, r.text
    assert r.json()["statut"] == "envoye"
    assert len(_Canal.envoyes) == 1


def test_consentement_obligatoire():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    corps = _corps()
    corps.pop("consentement")
    r = c.post("/pont/v1/messages", json=corps, headers=_entetes(cle))
    assert r.status_code == 400
    assert _Canal.envoyes == []


def test_cle_d_idempotence_obligatoire():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(), headers={"Authorization": f"Bearer {cle}"})
    assert r.status_code == 400


def test_un_rejeu_n_envoie_pas_un_second_message():
    """Le garde-fou qui compte le plus : un delai reseau ne doit pas annoncer
    deux fois un paiement au meme parent."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r1 = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "paiement-42"))
    r2 = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "paiement-42"))
    assert r1.status_code == 200 and r2.status_code == 200
    assert r2.json()["rejeu"] is True
    assert len(_Canal.envoyes) == 1


def test_numero_invalide_refuse():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(dest="pas-un-numero"), headers=_entetes(cle))
    assert r.status_code == 400
    assert _Canal.envoyes == []


def test_message_trop_long_refuse():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(texte="x" * (pont.MAX_TEXTE + 1)),
               headers=_entetes(cle))
    assert r.status_code == 400


# --- Debits ---------------------------------------------------------------

def test_plafond_horaire():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s, envois_par_heure=2)
    c = _client(sf)
    for i in range(2):
        assert c.post("/pont/v1/messages", json=_corps(dest=f"+2299000000{i}"),
                      headers=_entetes(cle, f"i{i}")).status_code == 200
    r = c.post("/pont/v1/messages", json=_corps(dest="+22990000009"), headers=_entetes(cle, "trop"))
    assert r.status_code == 429
    assert r.headers.get("Retry-After")
    assert len(_Canal.envoyes) == 2


def test_lissage_des_rafales():
    """Cinquante paiements a midi ne doivent pas produire cinquante envois en
    dix secondes : c'est le motif d'automatisation le plus visible."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s, intervalle_min_s=30)
    c = _client(sf)
    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "a")).status_code == 200
    r = c.post("/pont/v1/messages", json=_corps(dest="+22990000002"), headers=_entetes(cle, "b"))
    assert r.status_code == 429 and r.json()["detail"] == "trop-rapide"


def test_otp_plafonne_par_destinataire():
    """Sans cette borne, une cle qui fuit devient une arme contre un numero tiers."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    for i in range(pont.OTP_PAR_HEURE):
        r = c.post("/pont/v1/otp", json={"destinataire": "+22990000001", "code": "123456"},
                   headers=_entetes(cle, f"otp{i}"))
        assert r.status_code == 200, r.text
    r = c.post("/pont/v1/otp", json={"destinataire": "+22990000001", "code": "999999"},
               headers=_entetes(cle, "otp-trop"))
    assert r.status_code == 429 and r.json()["detail"] == "plafond-otp-destinataire"


def test_le_plafond_otp_est_par_destinataire_pas_global():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    for i in range(pont.OTP_PAR_HEURE):
        c.post("/pont/v1/otp", json={"destinataire": "+22990000001", "code": "111111"},
               headers=_entetes(cle, f"a{i}"))
    r = c.post("/pont/v1/otp", json={"destinataire": "+22990000002", "code": "222222"},
               headers=_entetes(cle, "autre"))
    assert r.status_code == 200


# --- Confidentialite -------------------------------------------------------

def test_aucun_contenu_ni_numero_en_clair_en_base():
    """La regle qui gouverne tout le module : la base ne doit rien porter
    d'exploitable si elle fuit."""
    sf = _factory()
    s = sf()
    a, cle = _app_pont(s)
    c = _client(sf)
    c.post("/pont/v1/otp", json={"destinataire": "+22990000001", "code": "424242"},
           headers=_entetes(cle, "o1"))

    ligne = s.query(models.PontEnvoi).first()
    assert ligne is not None and ligne.statut == "envoye"
    colonnes = {col.name for col in models.PontEnvoi.__table__.columns}
    assert "texte" not in colonnes and "contenu" not in colonnes and "code" not in colonnes
    # Le destinataire n'est present que sous forme d'empreinte.
    assert "22990000001" not in ligne.destinataire_hmac
    assert ligne.destinataire_hmac == pont.empreinte("+22990000001")


def test_le_code_otp_ne_revient_pas_dans_la_reponse():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    r = c.post("/pont/v1/otp", json={"destinataire": "+22990000001", "code": "424242"},
               headers=_entetes(cle, "o1"))
    assert "424242" not in r.text


def test_le_gabarit_otp_est_impose():
    """Le corps est compose par nous : ce point d'entree, au plafond plus
    permissif, ne doit pas servir a faire passer autre chose qu'un code."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    c.post("/pont/v1/otp",
           json={"destinataire": "+22990000001", "code": "424242", "texte": "Achetez maintenant !"},
           headers=_entetes(cle, "o1"))
    _, envoye = _Canal.envoyes[0]
    assert "424242" in envoye and "Achetez maintenant" not in envoye


# --- Desabonnement ---------------------------------------------------------

def test_un_desabonne_ne_recoit_plus_rien():
    sf = _factory()
    s = sf()
    a, cle = _app_pont(s)
    pont.bloquer(s, a.id, "+22990000001")
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    assert r.status_code == 403 and r.json()["detail"] == "destinataire-desabonne"
    assert _Canal.envoyes == []


def test_le_webhook_du_pont_n_appelle_jamais_le_cerveau_et_entend_stop():
    sf = _factory()
    s = sf()
    a, _ = _app_pont(s, session_name="pont7")
    c = _client(sf)
    r = c.post("/webhook", json={"session": "pont7",
                                 "payload": {"from": "22990000001@c.us", "body": "STOP", "id": "m1"}})
    assert r.status_code == 200 and r.json()["status"] == "pont-desabonne"
    assert pont.est_bloque(s, a.id, pont.empreinte("22990000001@c.us"))


def test_le_webhook_du_pont_ignore_le_reste():
    sf = _factory()
    s = sf()
    _app_pont(s, session_name="pont8")
    c = _client(sf)
    r = c.post("/webhook", json={"session": "pont8",
                                 "payload": {"from": "22990000001@c.us", "body": "Bonjour", "id": "m2"}})
    assert r.json()["status"] == "pont-ignore"
    assert _Canal.envoyes == []


# --- Isolation -------------------------------------------------------------

def test_les_comptes_sont_etanches():
    sf = _factory()
    s = sf()
    a1, cle1 = _app_pont(s, nom="A", session_name="pontA")
    a2, cle2 = _app_pont(s, nom="B", session_name="pontB")
    pont.bloquer(s, a1.id, "+22990000001")
    c = _client(sf)
    # Bloque chez A, toujours joignable chez B.
    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle1)).status_code == 403
    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle2)).status_code == 200


def test_statut_ne_divulgue_aucun_destinataire():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    r = c.get("/pont/v1/statut", headers={"Authorization": f"Bearer {cle}"})
    assert r.status_code == 200
    assert "22990000001" not in r.text
    assert r.json()["consommation"]["derniere_heure"] == 1
