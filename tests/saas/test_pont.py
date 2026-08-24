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
    """Compte de pont prêt à émettre : validé, conditions acceptées, clé posée.

    Les verrous d'accès (validation, conditions) ont leurs propres tests ; les
    autres n'auraient rien mesuré si chaque appel butait d'abord sur eux.
    """
    from datetime import datetime

    cle, prefixe, empreinte_cle = pont.generer_cle()
    a = models.PontApp(
        nom=kw.get("nom", "Gestion scolaire"),
        email=kw.get("email", f"dev+{kw.get('session_name', 'pont1')}@ecole.bj"),
        password_hash="x",
        conditions_le=kw.get("conditions_le", datetime.utcnow()),
        conditions_version=kw.get("conditions_version", pont.CONDITIONS_VERSION),
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


# --- Parcours du developpeur ----------------------------------------------

def _inscrire(c, email="dev@app.bj"):
    r = c.post("/pont/auth/inscription",
               json={"nom": "Gestion scolaire", "email": email, "mot_de_passe": "motdepasse1"})
    assert r.status_code == 200, r.text
    return r.json()["token"], r.json()["compte"]


def test_inscription_puis_connexion():
    sf = _factory()
    c = _client(sf)
    _, compte = _inscrire(c)
    assert compte["statut"] == "en_attente"
    assert compte["peut_emettre"] is False
    r = c.post("/pont/auth/connexion", json={"email": "dev@app.bj", "mot_de_passe": "motdepasse1"})
    assert r.status_code == 200 and r.json()["token"]


def test_inscription_refuse_un_doublon_et_un_mot_de_passe_court():
    sf = _factory()
    c = _client(sf)
    _inscrire(c)
    assert c.post("/pont/auth/inscription",
                  json={"nom": "Autre", "email": "dev@app.bj", "mot_de_passe": "motdepasse1"}
                  ).status_code == 400
    assert c.post("/pont/auth/inscription",
                  json={"nom": "X", "email": "x@app.bj", "mot_de_passe": "court"}
                  ).status_code == 400


def test_aucune_cle_avant_acceptation_des_conditions():
    """Le verrou demande : on n'obtient rien tant qu'on n'a pas accepte."""
    sf = _factory()
    c = _client(sf)
    token, _ = _inscrire(c)
    ent = {"Authorization": f"Bearer {token}"}
    assert c.post("/pont/v1/cle", headers=ent).status_code == 403
    assert c.post("/pont/v1/whatsapp/connexion", headers=ent).status_code == 403

    assert c.post("/pont/v1/conditions", headers=ent).json()["conditions_acceptees"] is True
    r = c.post("/pont/v1/cle", headers=ent)
    assert r.status_code == 200 and r.json()["cle"].startswith(pont.PREFIXE)


def test_conditions_a_reaccepter_si_le_texte_change(monkeypatch):
    """Un texte revise doit etre re-accepte : on n'oppose pas a un developpeur
    des regles qu'il n'a jamais lues."""
    sf = _factory()
    c = _client(sf)
    token, _ = _inscrire(c)
    ent = {"Authorization": f"Bearer {token}"}
    c.post("/pont/v1/conditions", headers=ent)
    monkeypatch.setattr(pont, "CONDITIONS_VERSION", "2027-01-01")
    assert c.get("/pont/v1/compte", headers=ent).json()["conditions_acceptees"] is False


def test_un_compte_en_attente_ne_peut_rien_emettre():
    """Inscription libre, emission fermee : la porte est ouverte, pas la capacite."""
    sf = _factory()
    c = _client(sf)
    token, _ = _inscrire(c)
    ent = {"Authorization": f"Bearer {token}"}
    c.post("/pont/v1/conditions", headers=ent)
    cle = c.post("/pont/v1/cle", headers=ent).json()["cle"]

    r = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    assert r.status_code == 403 and r.json()["detail"] == "compte-non-valide"
    assert _Canal.envoyes == []

    # Le statut reste consultable : un developpeur bloque doit voir pourquoi.
    st = c.get("/pont/v1/statut", headers={"Authorization": f"Bearer {cle}"})
    assert st.status_code == 200 and st.json()["blocage"] == "compte-non-valide"


def test_une_nouvelle_cle_revoque_la_precedente():
    sf = _factory()
    s = sf()
    a, ancienne = _app_pont(s)
    c = _client(sf)
    token = pont.creer_token(a.id)
    nouvelle = c.post("/pont/v1/cle", headers={"Authorization": f"Bearer {token}"}).json()["cle"]
    assert nouvelle != ancienne
    assert c.post("/pont/v1/messages", json=_corps(),
                  headers=_entetes(ancienne, "x")).status_code == 401
    assert c.post("/pont/v1/messages", json=_corps(),
                  headers=_entetes(nouvelle, "y")).status_code == 200


def test_un_jeton_d_etablissement_n_ouvre_pas_le_pont():
    """Les deux mondes sont etanches : la revendication du jeton diffère."""
    from saas import auth

    sf = _factory()
    s = sf()
    a, _ = _app_pont(s)
    c = _client(sf)
    jeton_tenant = auth.create_token(1, 1)  # porte « uid »/« tid », jamais « pid »
    assert c.get("/pont/v1/compte",
                 headers={"Authorization": f"Bearer {jeton_tenant}"}).status_code == 401


# --- Validation par l'administrateur ---------------------------------------

def _admin(c, sf):
    """Un compte propriétaire dont l'adresse figure dans ADMIN_EMAILS."""
    import os

    from saas import auth

    s = sf()
    _, tenant = auth.signup(s, "patron@wapy.pro", "motdepasse1", "Wapy")
    os.environ["ADMIN_EMAILS"] = "patron@wapy.pro"
    return auth.create_token(
        s.query(models.User).filter_by(email="patron@wapy.pro").first().id, tenant.id
    )


def test_l_admin_valide_un_compte_et_le_pont_s_ouvre():
    sf = _factory()
    c = _client(sf)
    token, _ = _inscrire(c)
    ent = {"Authorization": f"Bearer {token}"}
    c.post("/pont/v1/conditions", headers=ent)
    cle = c.post("/pont/v1/cle", headers=ent).json()["cle"]

    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle)).status_code == 403

    jeton_admin = _admin(c, sf)
    liste = c.get("/api/admin/pont", headers={"Authorization": f"Bearer {jeton_admin}"}).json()
    pid = liste["comptes"][0]["id"]
    r = c.put(f"/api/admin/pont/{pid}", json={"statut": "actif"},
              headers={"Authorization": f"Bearer {jeton_admin}"})
    assert r.status_code == 200 and r.json()["statut"] == "actif"

    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "apres")).status_code == 200


def test_on_ne_valide_pas_un_compte_qui_n_a_pas_accepte():
    """Le valider le ferait emettre sous des regles qu'il n'a pas lues — et
    l'ecran mentirait, puisque `peut_emettre` le bloquerait quand meme."""
    sf = _factory()
    c = _client(sf)
    _inscrire(c)
    jeton_admin = _admin(c, sf)
    ent = {"Authorization": f"Bearer {jeton_admin}"}
    pid = c.get("/api/admin/pont", headers=ent).json()["comptes"][0]["id"]
    r = c.put(f"/api/admin/pont/{pid}", json={"statut": "actif"}, headers=ent)
    assert r.status_code == 400


def test_l_admin_suspend_et_l_envoi_cesse():
    sf = _factory()
    s = sf()
    a, cle = _app_pont(s, email="dev@susp.bj")
    c = _client(sf)
    assert c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "avant")).status_code == 200
    jeton_admin = _admin(c, sf)
    c.put(f"/api/admin/pont/{a.id}", json={"statut": "suspendu"},
          headers={"Authorization": f"Bearer {jeton_admin}"})
    r = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "apres"))
    assert r.status_code == 403 and r.json()["detail"] == "compte-suspendu"


def test_la_liste_admin_ne_divulgue_aucun_destinataire():
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s, email="dev@fuite.bj")
    c = _client(sf)
    c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    jeton_admin = _admin(c, sf)
    r = c.get("/api/admin/pont", headers={"Authorization": f"Bearer {jeton_admin}"})
    assert r.status_code == 200
    assert "22990000001" not in r.text
    assert r.json()["comptes"][0]["envois_24h"] == 1


def test_la_liste_admin_est_reservee_aux_administrateurs():
    sf = _factory()
    c = _client(sf)
    assert c.get("/api/admin/pont").status_code == 401


# --- Confidentialite du journal -------------------------------------------

def test_la_cle_d_idempotence_n_est_pas_stockee_en_clair():
    """Elle porte souvent un identifiant metier : « paiement-2026-114 » revele la
    nomenclature interne du client sans rien nous apporter."""
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s)
    c = _client(sf)
    c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle, "paiement-2026-114"))
    ligne = s.query(models.PontEnvoi).first()
    assert "paiement" not in ligne.idempotence_hmac
    assert ligne.idempotence_hmac == pont.empreinte_idempotence("paiement-2026-114")


def test_le_journal_se_purge():
    """Aucune raison de garder indefiniment de quoi reconstituer le rythme
    d'activite d'un client."""
    from datetime import datetime, timedelta

    sf = _factory()
    s = sf()
    a, _ = _app_pont(s)
    s.add(models.PontEnvoi(app_id=a.id, idempotence_hmac="vieux", destinataire_hmac="x",
                           genre="texte", statut="envoye",
                           created_at=datetime.utcnow() - timedelta(days=pont.RETENTION_JOURS + 1)))
    s.add(models.PontEnvoi(app_id=a.id, idempotence_hmac="recent", destinataire_hmac="x",
                           genre="texte", statut="envoye", created_at=datetime.utcnow()))
    s.commit()
    assert pont.purger(s) == 1
    assert s.query(models.PontEnvoi).count() == 1


def test_les_numeros_se_normalisent_avant_comptage():
    """Changer de format ne doit pas contourner un plafond."""
    assert pont.empreinte("+229 90 00 00 01") == pont.empreinte("22990000001@c.us")


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
    """L'interrupteur : couper un compte sans toucher au reste du service.

    403 et non 401 : la clé est valide, c'est le droit d'émettre qui est retiré.
    Répondre 401 ferait chercher une clé perdue au lieu de la vraie cause.
    """
    sf = _factory()
    s = sf()
    _, cle = _app_pont(s, statut="suspendu")
    c = _client(sf)
    r = c.post("/pont/v1/messages", json=_corps(), headers=_entetes(cle))
    assert r.status_code == 403 and r.json()["detail"] == "compte-suspendu"
    assert _Canal.envoyes == []


def test_les_valeurs_generees_tiennent_dans_leurs_colonnes():
    """SQLite n'applique pas les longueurs de VARCHAR, PostgreSQL si.

    Sans ce test, un écart entre une constante et sa colonne ne se voit qu'en
    production, au premier appel réel — c'est exactement ce qui est arrivé avec
    `LONGUEUR_PREFIXE = 18` dans une colonne de 16.
    """
    cle, prefixe, empreinte_cle = pont.generer_cle()
    attendues = {
        (models.PontApp, "prefixe_cle"): prefixe,
        (models.PontApp, "cle_hash"): empreinte_cle,
        (models.PontEnvoi, "destinataire_hmac"): pont.empreinte("+22990000001"),
        (models.PontEnvoi, "idempotence_hmac"): pont.empreinte_idempotence("paiement-2026-114"),
    }
    for (modele, colonne), valeur in attendues.items():
        limite = modele.__table__.columns[colonne].type.length
        assert limite is not None, f"{colonne} sans longueur déclarée"
        assert len(valeur) <= limite, (
            f"{modele.__tablename__}.{colonne} : {len(valeur)} caractères générés "
            f"pour une colonne de {limite}"
        )


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
