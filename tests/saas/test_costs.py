"""Coût IA : tarification, imputation, choix du modèle par tâche, garde-fou de marge."""
import types

from sqlalchemy.orm import sessionmaker

from brain.brain import Brain, lire_conso
from saas import auth, billing, costs, models
from saas.db import Base, make_engine


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def _tenant(s, email="a@b.com", nom="Chez Test"):
    _, t = auth.signup(s, email, "x", nom)
    return t


# --- Tarification ----------------------------------------------------------

def test_cout_applique_les_multiplicateurs_de_cache():
    """Une lecture de cache vaut 0,1x l'entrée, une écriture 2x (TTL 1 h)."""
    conso = {"entree": 1_000_000, "sortie": 0, "cache_lecture": 0, "cache_ecriture": 0}
    plein = costs.cout_micro_usd("claude-opus-5", conso)
    assert plein == 5_000_000  # 5 $ le million en entrée

    lecture = costs.cout_micro_usd(
        "claude-opus-5", {"entree": 0, "cache_lecture": 1_000_000, "sortie": 0, "cache_ecriture": 0}
    )
    assert lecture == plein // 10  # dix fois moins cher : tout l'intérêt du cache

    ecriture = costs.cout_micro_usd(
        "claude-opus-5", {"entree": 0, "cache_lecture": 0, "sortie": 0, "cache_ecriture": 1_000_000}
    )
    assert ecriture == plein * 2


def test_modele_inconnu_facture_au_tarif_le_plus_cher():
    """Une sous-estimation silencieuse serait pire qu'une surestimation."""
    inconnu = costs.cout_micro_usd("claude-futur-9", {"entree": 1_000_000})
    assert inconnu == costs.cout_micro_usd("claude-opus-5", {"entree": 1_000_000})


def test_tous_les_modeles_vendus_ont_un_tarif():
    """Un modèle attribué par un plan ou une tâche doit être tarifé explicitement."""
    vendus = {p["model"] for p in billing.PLANS.values()}
    vendus |= set(billing.MODELES_TACHES.values())
    vendus |= {billing.TRIAL_ENT["model"], billing.EXPIRED_ENT["model"]}
    assert {m for m in vendus if m} <= set(costs.TARIFS)


# --- Imputation ------------------------------------------------------------

def test_enregistrer_cumule_et_ventile_par_tache():
    s = _session()
    t = _tenant(s)
    costs.enregistrer(s, t.id, "brain", "claude-haiku-4-5-20251001", {"entree": 1000, "sortie": 100})
    costs.enregistrer(s, t.id, "brain", "claude-haiku-4-5-20251001", {"entree": 1000, "sortie": 100})
    costs.enregistrer(s, t.id, "vision", "claude-sonnet-5", {"entree": 2000, "sortie": 50})

    detail = costs.detail_du_mois(s, t.id)
    assert detail["appels"] == 3
    assert set(detail["par_tache_xof"]) == {"brain", "vision"}
    assert costs.cout_du_mois(s, t.id) > 0


def test_enregistrer_ignore_une_conso_vide():
    """Un message qui n'atteint pas le cerveau (escalade, opt-out) n'écrit rien."""
    s = _session()
    t = _tenant(s)
    assert costs.enregistrer(s, t.id, "brain", "claude-opus-5", {}) == 0
    assert s.query(models.AiCost).count() == 0


def test_couts_isoles_par_etablissement():
    s = _session()
    t1, t2 = _tenant(s, "a@b.com", "Resto A"), _tenant(s, "c@d.com", "Resto B")
    costs.enregistrer(s, t1.id, "brain", "claude-opus-5", {"entree": 10_000})
    assert costs.cout_du_mois(s, t1.id) > 0
    assert costs.cout_du_mois(s, t2.id) == 0


# --- Modèle par tâche ------------------------------------------------------

def test_les_taches_annexes_ignorent_le_modele_du_plan():
    """Business ne doit pas lire un reçu sur Opus 5 : personne n'entend la différence."""
    assert costs.modele_tache("vision", "claude-opus-5") == "claude-sonnet-5"
    assert costs.modele_tache("learn", "claude-opus-5") == "claude-haiku-4-5-20251001"
    # ... et Starter génère sa fiche sur mieux que Haiku : c'est la première impression.
    assert costs.modele_tache("config", "claude-haiku-4-5-20251001") == "claude-sonnet-5"


def test_tache_inconnue_retombe_sur_le_modele_du_plan():
    assert costs.modele_tache("nouvelle", "claude-opus-5") == "claude-opus-5"


# --- Garde-fou de marge ----------------------------------------------------

def _sub(s, tenant_id, plan, statut="active"):
    sub = models.Subscription(tenant_id=tenant_id, plan=plan, addons=[], status=statut)
    s.add(sub)
    s.commit()
    return sub


def test_sous_le_plafond_le_modele_du_plan_est_conserve():
    s = _session()
    t = _tenant(s)
    t.wapy_model = "claude-opus-5"
    sub = _sub(s, t.id, "business")
    assert costs.modele_effectif(s, t, sub) == "claude-opus-5"


def test_au_dela_du_plafond_le_cerveau_descend_d_un_cran():
    s = _session()
    t = _tenant(s)
    t.wapy_model = "claude-opus-5"
    sub = _sub(s, t.id, "business")
    # Plafond Business = 50 % de 40 000 F, soit 20 000 F. On dépasse largement.
    micro = int(30_000 / costs.taux_xof() * 1_000_000)
    s.add(models.AiCost(tenant_id=t.id, month=costs._mois(), task="brain",
                        model="claude-opus-5", calls=1, cost_micro_usd=micro))
    s.commit()
    assert costs.modele_effectif(s, t, sub) == "claude-sonnet-5"


def test_la_degradation_s_arrete_a_haiku():
    """Plancher : on dégrade, on ne coupe jamais le service."""
    assert billing.DEGRADATION.get("claude-haiku-4-5-20251001") is None
    s = _session()
    t = _tenant(s)
    t.wapy_model = "claude-haiku-4-5-20251001"
    sub = _sub(s, t.id, "essentiel")
    micro = int(99_000 / costs.taux_xof() * 1_000_000)
    s.add(models.AiCost(tenant_id=t.id, month=costs._mois(), task="brain",
                        model="claude-haiku-4-5-20251001", calls=1, cost_micro_usd=micro))
    s.commit()
    assert costs.modele_effectif(s, t, sub) == "claude-haiku-4-5-20251001"


def test_un_essai_n_est_jamais_degrade():
    """Ces sept jours décident de l'abonnement : les saboter serait absurde."""
    s = _session()
    t = _tenant(s)
    t.wapy_model = "claude-sonnet-5"
    sub = _sub(s, t.id, "", statut="trial")
    micro = int(99_000 / costs.taux_xof() * 1_000_000)
    s.add(models.AiCost(tenant_id=t.id, month=costs._mois(), task="brain",
                        model="claude-sonnet-5", calls=1, cost_micro_usd=micro))
    s.commit()
    assert costs.modele_effectif(s, t, sub) == "claude-sonnet-5"


# --- Remontée des compteurs depuis l'API -----------------------------------

class _Resp:
    def __init__(self, usage=None):
        self.content = [types.SimpleNamespace(type="text", text='{"action":"reply","message":"ok","reason":"r"}')]
        if usage is not None:
            self.usage = usage


def test_lire_conso_sans_usage_ne_leve_pas():
    """Une télémétrie ne doit jamais faire échouer l'appel qu'elle mesure."""
    assert lire_conso(_Resp()) == {}


def test_le_cerveau_cumule_sur_tout_le_tour_puis_se_vide():
    """Un tour peut coûter plusieurs appels (boucle `lookup`) : on impute le tour."""
    usage = types.SimpleNamespace(input_tokens=10, output_tokens=5,
                                  cache_read_input_tokens=100, cache_creation_input_tokens=0)

    class _Client:
        def __init__(self):
            self.messages = types.SimpleNamespace(create=lambda **kw: _Resp(usage))

    cerveau = Brain(_Client(), "claude-haiku-4-5-20251001")
    cerveau.decide("fiche", [], "bonjour")
    cerveau.decide("fiche", [], "et encore")
    assert cerveau.conso == {"entree": 20, "sortie": 10, "cache_lecture": 200, "cache_ecriture": 0}

    cumul = cerveau.consommer_conso()
    assert cumul["entree"] == 20
    assert cerveau.conso == {}  # le lecteur en est désormais responsable
