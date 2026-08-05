from sqlalchemy.orm import sessionmaker

from saas.db import Base, make_engine
from saas import auth, config_repo


def _session():
    eng = make_engine("sqlite://")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng, future=True)()


def test_build_fiche_text_and_tenant_isolation():
    s = _session()
    _, t1 = auth.signup(s, "a@b.com", "x", "T1")
    _, t2 = auth.signup(s, "c@d.com", "y", "T2")

    config_repo.set_info(s, t1.id, "Horaires", "11h-23h")
    config_repo.add_menu_item(s, t1.id, categorie="Plat", plat="Poulet braisé", prix="3000 FCFA")
    config_repo.add_faq(s, t1.id, "Vous avez une terrasse ?", "Oui, chauffée")
    config_repo.set_info(s, t2.id, "Horaires", "SECRET-T2")

    text = config_repo.build_fiche_text(s, t1.id)
    assert "11h-23h" in text
    assert "Poulet braisé" in text and "3000 FCFA" in text
    assert "Vous avez une terrasse ?" in text and "Oui, chauffée" in text
    assert "SECRET-T2" not in text  # isolation entre tenants


def test_set_info_updates_existing_rubrique():
    s = _session()
    _, t = auth.signup(s, "a@b.com", "x", "T")
    config_repo.set_info(s, t.id, "Horaires", "11h-23h")
    config_repo.set_info(s, t.id, "Horaires", "12h-22h")
    text = config_repo.build_fiche_text(s, t.id)
    assert "12h-22h" in text and "11h-23h" not in text
