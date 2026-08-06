"""Génération assistée par l'IA de la config d'un établissement (multi-secteurs).

Claude produit une config JSON exhaustive à partir du secteur + description.
L'utilisateur pourra ensuite éditer/supprimer côté dashboard.
"""
import json

SYSTEM = (
    "Tu génères la configuration d'un assistant WhatsApp pour un établissement, "
    "quel que soit son secteur. Réponds UNIQUEMENT avec un JSON valide (aucun texte "
    "autour, pas de balises de code), avec EXACTEMENT cette structure :\n"
    '{"sector": str, "description": str, '
    '"infos": [{"label": str, "value": str}], '
    '"tables": [{"name": str, "columns": [str], "rows": [{"<colonne>": "<valeur>"}]}], '
    '"consignes": [{"situation": str, "action": str}], '
    '"faq": [{"question": str, "reponse": str}]}\n\n'
    "Remplis de façon EXHAUSTIVE et RÉALISTE selon le secteur et la description :\n"
    "- infos : horaires, adresse, téléphone, moyens de paiement, etc. pertinents.\n"
    "- tables : adapte au secteur. Restaurant -> table 'Menu' (colonnes Catégorie, "
    "Plat, Description, Prix, Régime). Salon -> 'Prestations' (Prestation, Durée, Prix). "
    "Boutique -> 'Catalogue' (Produit, Description, Prix). Choisis des colonnes utiles.\n"
    "- consignes : quoi faire selon la demande. L'assistant doit être AUTONOME : pour "
    "les réservations/commandes/devis, la consigne doit lui dire de RÉCOLTER les infos "
    "utiles puis de CONCLURE lui-même (il enregistre et notifie le responsable), et NON "
    "de 'transmettre au responsable'. Ne réserve un vrai passage à un humain qu'aux "
    "réclamations, litiges ou cas sensibles. Ex. 'Réservation' -> 'Demander dates, nombre "
    "de personnes et type, confirmer au client et enregistrer la demande'.\n"
    "- faq : questions fréquentes du secteur + réponses.\n"
    "Langue : français. Invente des exemples plausibles, l'utilisateur ajustera."
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


def generate_config(client, model: str, sector: str, description: str, nom: str) -> dict:
    resp = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Nom de l'établissement : {nom}\nSecteur : {sector}\n"
                    f"Description : {description}\n\nGénère la config JSON complète."
                ),
            }
        ],
    )
    text = next((b.text for b in resp.content if b.type == "text"), "{}")
    data = json.loads(_extract_json(text))
    # garde-fous : structure minimale
    data.setdefault("sector", sector)
    data.setdefault("description", description)
    for k in ("infos", "tables", "consignes", "faq"):
        data.setdefault(k, [])
    return data
