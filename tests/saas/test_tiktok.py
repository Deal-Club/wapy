"""Canal TikTok : droits, quota et economie de l'option.

Ces tests couvrent ce qui ne depend d'AUCUN acces a l'API TikTok : le modele
commercial et le compteur. L'adaptateur de canal et le flux OAuth viendront
quand l'acces sera accorde, et seront testes contre l'API reelle.
"""
from sqlalchemy.orm import sessionmaker

from saas import auth, billing, costs, models, usage
from saas.db import Base, make_engine


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def _tenant(s, email="a@b.com", nom="Chez Test"):
    _, t = auth.signup(s, email, "x", nom)
    return t


# --- Droits ----------------------------------------------------------------

def test_tiktok_n_est_inclus_dans_aucun_plan():
    """Tous les etablissements n'ont pas de compte TikTok : l'inclure ferait
    payer un canal inutilise a ceux qui ne s'en servent pas."""
    for cle, plan in billing.PLANS.items():
        assert "tiktok" not in plan["features"], cle


def test_l_option_ouvre_le_canal_et_accorde_un_quota():
    ent = billing.entitlements_for("essentiel", ["tiktok"])
    assert "tiktok" in ent["features"]
    assert ent["limits"]["tiktok"] == 5000


def test_sans_l_option_aucun_quota_n_est_accorde():
    ent = billing.entitlements_for("essentiel")
    assert "tiktok" not in ent["features"]
    assert ent["limits"].get("tiktok", 0) == 0


def test_une_cle_absente_du_plan_n_est_pas_lue_comme_illimitee():
    """Le piege : `limits.get(k, 0)` vaut 0, que le reste du code lit comme
    « illimite ». Sans le cas explicite, l'option accorderait l'infini."""
    ent = billing.entitlements_for("business", ["tiktok"])
    assert ent["limits"]["tiktok"] == 5000  # et non 0 (= illimite)


def test_l_extension_s_ajoute_au_quota():
    ent = billing.entitlements_for("pro", ["tiktok", "tiktok_5000"])
    assert ent["limits"]["tiktok"] == 10000


def test_l_extension_seule_ne_donne_pas_le_droit():
    """Acheter du volume sans le canal ne doit pas ouvrir le canal."""
    ent = billing.entitlements_for("pro", ["tiktok_5000"])
    assert "tiktok" not in ent["features"]


# --- Compteur --------------------------------------------------------------

def test_on_compte_les_reponses_pas_les_personnes():
    """Sous une video, la meme personne commente souvent plusieurs fois."""
    s = _session()
    t = _tenant(s)
    for _ in range(4):
        usage.noter_reponse_tiktok(s, t.id, "comment")
    assert usage.tiktok_du_mois(s, t.id) == 4


def test_commentaires_et_messages_prives_partagent_le_quota():
    s = _session()
    t = _tenant(s)
    usage.noter_reponse_tiktok(s, t.id, "comment")
    usage.noter_reponse_tiktok(s, t.id, "dm")
    assert usage.tiktok_du_mois(s, t.id) == 2
    assert usage.tiktok_du_mois(s, t.id, "dm") == 1


def test_sans_option_le_canal_est_ferme():
    """`limite <= 0` bloque, a l'inverse de la convention des conversations."""
    s = _session()
    t = _tenant(s)
    assert usage.quota_tiktok_atteint(s, t.id, 0) is True


def test_sous_le_quota_le_canal_repond():
    s = _session()
    t = _tenant(s)
    usage.noter_reponse_tiktok(s, t.id)
    assert usage.quota_tiktok_atteint(s, t.id, 5000) is False


def test_au_quota_le_canal_se_ferme():
    s = _session()
    t = _tenant(s)
    s.add(models.TikTokUsage(tenant_id=t.id, month=usage._month(), kind="comment", count=5000))
    s.commit()
    assert usage.quota_tiktok_atteint(s, t.id, 5000) is True


def test_quotas_tiktok_isoles_par_etablissement():
    s = _session()
    t1, t2 = _tenant(s, "a@b.com", "A"), _tenant(s, "c@d.com", "B")
    for _ in range(10):
        usage.noter_reponse_tiktok(s, t1.id)
    assert usage.tiktok_du_mois(s, t1.id) == 10
    assert usage.tiktok_du_mois(s, t2.id) == 0


def test_le_quota_whatsapp_est_intact():
    """Une reponse TikTok ne doit pas consommer le forfait conversations."""
    s = _session()
    t = _tenant(s)
    for _ in range(50):
        usage.noter_reponse_tiktok(s, t.id)
    assert usage.conversations_du_mois(s, t.id) == 0


# --- Economie --------------------------------------------------------------

def test_l_option_couvre_son_cout():
    """5 000 reponses au tarif mesure doivent laisser une marge, sinon vendre
    l'option revient a acheter des clients."""
    conso_par_reponse = {"entree": 50, "sortie": 60, "cache_lecture": 4400, "cache_ecriture": 0}
    micro = costs.cout_micro_usd(billing.MODELE_STANDARD, conso_par_reponse)
    cout_xof = micro / 1_000_000 * costs.taux_xof() * 5000
    prix = billing.ADDONS["tiktok"]["price"]
    assert cout_xof < prix * 0.6, f"marge trop fine : {cout_xof:.0f} F de cout pour {prix} F"


def test_la_connexion_tiktok_stocke_des_jetons_chiffres():
    """Aucun jeton en clair : meme patron que le connecteur de donnees."""
    colonnes = {c.name for c in models.TikTokAccount.__table__.columns}
    assert "access_token_enc" in colonnes and "refresh_token_enc" in colonnes
    assert "access_token" not in colonnes and "refresh_token" not in colonnes
