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
    "documents": [],  # [{name, text}] : base de connaissances (PDF/texte uploadés)
}

# Longueur max de texte de document injectée dans le prompt (garde-fou coût/latence).
DOC_CHARS = 6000


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


def apply_suggestion(session, tenant_id: int, kind: str, payload: dict) -> None:
    """Fusionne une suggestion validée dans la config (append, sans écraser)."""
    cfg = get_config(session, tenant_id)
    payload = payload or {}
    if kind == "faq":
        cfg["faq"] = cfg.get("faq", []) + [{
            "question": payload.get("question", ""),
            "reponse": payload.get("reponse", ""),
        }]
    elif kind == "info":
        cfg["infos"] = cfg.get("infos", []) + [{
            "label": payload.get("label", ""),
            "value": payload.get("value", ""),
        }]
    elif kind == "consigne":
        cfg["consignes"] = cfg.get("consignes", []) + [{
            "situation": payload.get("situation", ""),
            "action": payload.get("action", ""),
        }]
    elif kind == "table_row":
        name = payload.get("table", "")
        row = payload.get("row", {}) or {}
        for t in cfg.get("tables", []):
            if t.get("name") == name:
                for col in row:
                    if col not in t.get("columns", []):
                        t.setdefault("columns", []).append(col)
                t.setdefault("rows", []).append(row)
                break
    save_config(session, tenant_id, cfg)


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

    docs = c.get("documents", [])
    if docs:
        parts += ["", "## Documents de référence"]
        for d in docs:
            name = (d.get("name") or "Document").strip()
            text = (d.get("text") or "").strip()[:DOC_CHARS]
            if text:
                parts += [f"### {name}", text]

    parts += ["", "## FAQ"]
    for f in c.get("faq", []):
        q = (f.get("question") or "").strip()
        a = (f.get("reponse") or "").strip()
        if q:
            parts.append(f"Q: {q}\nR: {a}")

    return "\n".join(parts)
