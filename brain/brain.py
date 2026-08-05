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
    },
    "required": ["action", "message", "reason"],
    "additionalProperties": False,
}


@dataclass
class Decision:
    action: str
    message: str
    reason: str


def build_system_prompt(fiche_text: str) -> str:
    return (
        "Tu es l'assistant WhatsApp d'un restaurant. Tu réponds aux clients qui "
        "écrivent, en français, dans le ton indiqué par la fiche.\n\n"
        "RÈGLES ABSOLUES :\n"
        "1. Réponds UNIQUEMENT à partir des informations de la fiche ci-dessous.\n"
        "2. Si l'information demandée n'est PAS dans la fiche, ou si le client veut "
        "réserver, commander, se plaindre, ou parler à un humain : action='escalate' "
        "(escalade vers un humain ; n'invente jamais un prix, un horaire, une "
        "disponibilité).\n"
        "3. Sinon : action='reply'.\n"
        "4. Renseigne toujours 'reason' (courte justification interne).\n\n"
        "TON DES RÉPONSES (action='reply') :\n"
        "- Chaleureux, humain et professionnel, comme un employé du resto.\n"
        "- Concis et précis : 1 à 3 phrases courtes, va droit au but.\n"
        "- Jamais de tiret long (—). Utilise des phrases simples ou une virgule.\n"
        "- Pas de listes à puces ni de pavés : c'est une conversation WhatsApp.\n\n"
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
        return Decision(action=data["action"], message=data["message"], reason=data["reason"])
