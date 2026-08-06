from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth, config_repo


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_save_get_and_build_fiche_text_with_custom_columns():
    s = _session()
    _, t1 = auth.signup(s, "a@b.com", "x", "T1")
    _, t2 = auth.signup(s, "c@d.com", "y", "T2")

    config_repo.save_config(s, t1.id, {
        "sector": "Salon de coiffure",
        "description": "Salon moderne",
        "infos": [{"label": "Horaires", "value": "9h-19h"}],
        "tables": [{
            "name": "Prestations",
            "columns": ["Prestation", "Durée", "Prix"],
            "rows": [{"Prestation": "Coupe", "Durée": "30min", "Prix": "3000 FCFA"}],
        }],
        "consignes": [{"situation": "Rendez-vous", "action": "Transmettre au responsable"}],
        "faq": [{"question": "Sur RDV ?", "reponse": "Oui"}],
    })
    config_repo.save_config(s, t2.id, {"infos": [{"label": "X", "value": "SECRET-T2"}]})

    text = config_repo.build_fiche_text(s, t1.id)
    assert "Salon de coiffure" in text
    assert "9h-19h" in text
    assert "Prestations" in text and "Coupe" in text and "3000 FCFA" in text
    assert "Rendez-vous" in text  # consigne
    assert "Sur RDV ?" in text
    assert "SECRET-T2" not in text  # isolation


def test_get_config_defaults_empty():
    s = _session()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    cfg = config_repo.get_config(s, t.id)
    assert cfg["sector"] == "" and cfg["infos"] == [] and cfg["tables"] == []
