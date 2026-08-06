"""Config flexible de l'établissement (multi-secteurs), stockée en JSON par tenant.

Structure `data` :
  sector, description,
  infos:    [{label, value}]
  tables:   [{name, columns:[str], rows:[{col: val}]}]   # colonnes personnalisables
  consignes:[{situation, action}]
  faq:      [{question, reponse}]

`build_fiche_text` aplati le tout pour le cerveau (format identique attendu).
"""
from saas import models

EMPTY = {
    "sector": "",
    "description": "",
    "infos": [],
    "tables": [],
    "consignes": [],
    "faq": [],
}


def get_config(session, tenant_id: int) -> dict:
    row = session.get(models.BusinessConfig, tenant_id)
    data = dict(row.data) if row and row.data else {}
    return {**EMPTY, **data}


def save_config(session, tenant_id: int, data: dict) -> None:
    clean = {**EMPTY, **(data or {})}
    row = session.get(models.BusinessConfig, tenant_id)
    if row:
        row.data = clean
    else:
        session.add(models.BusinessConfig(tenant_id=tenant_id, data=clean))
    session.commit()


def build_fiche_text(session, tenant_id: int) -> str:
    c = get_config(session, tenant_id)
    parts = ["# FICHE ÉTABLISSEMENT"]
    if c.get("sector"):
        parts.append(f"Secteur : {c['sector']}")
    if c.get("description"):
        parts.append(f"Description : {c['description']}")

    parts += ["", "## Infos"]
    for i in c.get("infos", []):
        label = (i.get("label") or "").strip()
        val = (i.get("value") or "").strip()
        if label:
            parts.append(f"- {label} : {val}")

    for t in c.get("tables", []):
        name = (t.get("name") or "Table").strip()
        cols = t.get("columns", []) or []
        parts += ["", f"## {name}"]
        for r in t.get("rows", []):
            cells = [
                f"{col}: {str(r.get(col, '')).strip()}"
                for col in cols
                if str(r.get(col, "")).strip()
            ]
            if cells:
                parts.append("- " + " | ".join(cells))

    if c.get("consignes"):
        parts += ["", "## Consignes"]
        for cg in c["consignes"]:
            s = (cg.get("situation") or "").strip()
            a = (cg.get("action") or "").strip()
            if s:
                parts.append(f"- {s} : {a}")

    parts += ["", "## FAQ"]
    for f in c.get("faq", []):
        q = (f.get("question") or "").strip()
        a = (f.get("reponse") or "").strip()
        if q:
            parts.append(f"Q: {q}\nR: {a}")

    return "\n".join(parts)
