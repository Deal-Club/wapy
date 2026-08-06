"""Apprentissage : l'IA lit les conversations clients et propose des améliorations
de la configuration (nouvelles FAQ, infos manquantes, consignes).

Rien n'est appliqué automatiquement : chaque proposition est validée (ou rejetée)
par le propriétaire. Objectif : rendre l'assistant plus adapté au fil des échanges.
"""
import json

SYSTEM = (
    "Tu analyses les conversations réelles entre des clients et l'assistant WhatsApp "
    "d'un établissement, en les comparant à sa fiche de configuration actuelle. "
    "Ton but : repérer ce qui manque pour que l'assistant réponde mieux DEMAIN.\n\n"
    "Cherche notamment :\n"
    "- des questions fréquentes SANS bonne réponse (l'assistant a esquivé, escaladé, "
    "ou répondu qu'il ne savait pas) ;\n"
    "- des informations demandées et absentes de la fiche (horaires, livraison, prix, "
    "moyens de paiement, options...) ;\n"
    "- des situations récurrentes qui mériteraient une consigne claire.\n\n"
    "Réponds UNIQUEMENT avec un JSON valide (aucun texte autour, pas de balises de code) :\n"
    '{"suggestions": [{"kind": "faq|info|consigne", "title": str, "reason": str, '
    '"payload": {...}}]}\n'
    "payload selon kind :\n"
    '- faq -> {"question": str, "reponse": str}\n'
    '- info -> {"label": str, "value": str}\n'
    '- consigne -> {"situation": str, "action": str}\n'
    "Règles : propose AU PLUS 6 suggestions, seulement si réellement utiles. "
    "N'invente pas de faits précis (prix, horaires exacts) : si l'info manque, formule "
    "une réponse prudente ou marque-la à compléter. Langue : français. "
    "Si rien de pertinent, renvoie une liste vide."
)


def _extract_json(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.startswith("json"):
            t = t[4:]
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1:
        t = t[start : end + 1]
    return t


def _format_conversations(conversations: list[dict]) -> str:
    """conversations = [{chat_id, messages:[{role, content}]}]."""
    blocks = []
    for c in conversations:
        lines = [f"### Client {c.get('chat_id', '?')}"]
        for m in c.get("messages", []):
            who = "Client" if m.get("role") == "user" else "Assistant"
            lines.append(f"{who}: {m.get('content', '')}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def analyze(client, model: str, fiche_text: str, conversations: list[dict]) -> list[dict]:
    convo_text = _format_conversations(conversations)
    if not convo_text.strip():
        return []
    resp = client.messages.create(
        model=model,
        max_tokens=3072,
        system=SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    f"FICHE ACTUELLE :\n{fiche_text}\n\n"
                    f"CONVERSATIONS RÉCENTES :\n{convo_text}\n\n"
                    "Renvoie le JSON des suggestions."
                ),
            }
        ],
    )
    text = next((b.text for b in resp.content if b.type == "text"), "{}")
    data = json.loads(_extract_json(text))
    out = []
    for s in data.get("suggestions", []):
        kind = s.get("kind")
        if kind in ("faq", "info", "consigne") and isinstance(s.get("payload"), dict):
            out.append({
                "kind": kind,
                "title": (s.get("title") or "").strip()[:255],
                "payload": s["payload"],
            })
    return out
