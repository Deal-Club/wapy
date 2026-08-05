"""Config resto en base + construction de la fiche (aplatie) pour le cerveau.

Remplace Google Sheets : la fiche vit dans la DB, éditable via le dashboard ou
importée depuis un Excel. `build_fiche_text` produit le même format que le cerveau
attend (Infos / Menu / FAQ), scellé au tenant.
"""
from saas import models


def set_info(session, tenant_id: int, rubrique: str, contenu: str) -> None:
    row = (
        session.query(models.RestaurantInfo)
        .filter_by(tenant_id=tenant_id, rubrique=rubrique)
        .first()
    )
    if row:
        row.contenu = contenu
    else:
        session.add(
            models.RestaurantInfo(tenant_id=tenant_id, rubrique=rubrique, contenu=contenu)
        )
    session.commit()


def add_menu_item(session, tenant_id, categorie="", plat="", description="", prix="", regime=""):
    session.add(
        models.MenuItem(
            tenant_id=tenant_id,
            categorie=categorie,
            plat=plat,
            description=description,
            prix=prix,
            regime=regime,
        )
    )
    session.commit()


def add_faq(session, tenant_id: int, question: str, reponse: str) -> None:
    session.add(models.Faq(tenant_id=tenant_id, question=question, reponse=reponse))
    session.commit()


def build_fiche_text(session, tenant_id: int) -> str:
    infos = session.query(models.RestaurantInfo).filter_by(tenant_id=tenant_id).all()
    menu = session.query(models.MenuItem).filter_by(tenant_id=tenant_id).all()
    faq = session.query(models.Faq).filter_by(tenant_id=tenant_id).all()

    parts = ["# FICHE RESTAURANT", "", "## Infos"]
    for i in infos:
        if (i.rubrique or "").strip():
            parts.append(f"- {i.rubrique.strip()} : {(i.contenu or '').strip()}")
    parts += ["", "## Menu"]
    for m in menu:
        cells = [c.strip() for c in (m.categorie, m.plat, m.description, m.prix, m.regime) if (c or "").strip()]
        if cells:
            parts.append("- " + " | ".join(cells))
    parts += ["", "## FAQ"]
    for f in faq:
        if (f.question or "").strip():
            parts.append(f"Q: {f.question.strip()}\nR: {(f.reponse or '').strip()}")
    return "\n".join(parts)
