"""Cerveau : Claude décide de répondre (depuis la fiche) ou d'escalader.

Sortie structurée (json_schema) pour une décision fiable et parsable.
Code agnostique au modèle : pas de `thinking`/`effort`/`temperature`
(effort 400 sur Haiku ; sampling 400 sur Opus 4.8). Le modèle est configurable.
"""
import json
from dataclasses import dataclass

DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["reply", "escalate"]},
        "message": {"type": "string"},
        "reason": {"type": "string"},
        "image": {"type": "string"},
    },
    "required": ["action", "message", "reason", "image"],
    "additionalProperties": False,
}


@dataclass
class Decision:
    action: str
    message: str
    reason: str
    image: str = ""


def build_system_prompt(fiche_text: str) -> str:
    return (
        "Tu es l'assistant WhatsApp d'un restaurant. Tu réponds aux clients en "
        "français, dans le ton indiqué par la fiche.\n\n"
        "PRINCIPE : tout ce que tu dis vient de la fiche ci-dessous (Infos, Menu, FAQ "
        "et surtout les CONSIGNES du restaurant). N'invente JAMAIS une donnée absente "
        "(prix, horaire, disponibilité, identité du personnel...).\n\n"
        "RÈGLES :\n"
        "1. Réponds toi-même, depuis la fiche, à tout ce que tu peux déduire (menu, "
        "prix, horaires, adresse, moyens de paiement, disponibilité d'un plat listé, "
        "etc.), même si la question n'est pas listée telle quelle dans la FAQ.\n"
        "2. La fiche peut contenir des CONSIGNES : des instructions du restaurant sur "
        "quoi faire dans certains cas (ex. « pour une réservation, envoie ce lien : "
        "... », « pour telle demande, transmets au responsable »). Suis TOUJOURS ces "
        "consignes du restaurant.\n"
        "3. action='escalate' (transmettre à un humain) UNIQUEMENT si : une consigne "
        "de la fiche demande de transmettre au responsable pour ce cas (ex. la rubrique "
        "« À escalader systématiquement »), OU le client demande explicitement un "
        "humain, OU l'information est absente de la fiche ET aucune consigne ne la "
        "couvre.\n"
        "4. Sinon action='reply' — y compris quand une consigne te dit d'envoyer un "
        "lien ou une info : mets-le dans ta réponse.\n"
        "5. Renseigne toujours 'reason' (courte justification interne).\n"
        "6. IMAGES : si un article de la fiche possède une image (une valeur de type "
        "chemin, ex. « /media/xxx.jpg », souvent dans une colonne Image/Photo) et que "
        "le client demande à VOIR l'article ou une photo, réponds action='reply' avec "
        "un court message ET copie le chemin EXACT de l'image dans le champ 'image'. "
        "Sinon, laisse 'image' vide (\"\").\n\n"
        "TON DES RÉPONSES (action='reply') :\n"
        "- Chaleureux, humain et professionnel, comme un employé du resto.\n"
        "- Concis et précis, va droit au but. Jamais de tiret long (—).\n"
        "- Question simple : 1 à 3 phrases courtes.\n"
        "- Pour une LISTE (menu) : un élément par ligne, catégorie ou plat en gras "
        "WhatsApp avec des astérisques (*Poulet braisé* : 3 000 FCFA). Reste synthétique.\n\n"
        "=== FICHE RESTAURANT ===\n"
        f"{fiche_text}\n"
        "=== FIN FICHE ==="
    )


class Brain:
    def __init__(self, client, model: str):
        self._client = client
        self._model = model

    def decide(self, fiche_text: str, history: list[dict], incoming_text: str) -> Decision:
        messages = list(history) + [{"role": "user", "content": incoming_text}]
        resp = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=build_system_prompt(fiche_text),
            messages=messages,
            output_config={"format": {"type": "json_schema", "schema": DECISION_SCHEMA}},
        )
        text = next(b.text for b in resp.content if b.type == "text")
        data = json.loads(text)
        return Decision(
            action=data["action"],
            message=data["message"],
            reason=data["reason"],
            image=data.get("image", ""),
        )
