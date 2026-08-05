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
        "1. Utilise TOUTES les informations de la fiche (Infos, Menu, FAQ) pour "
        "répondre, pas seulement la FAQ. Si la réponse se déduit de la fiche "
        "(un prix dans le Menu, un horaire dans Infos, etc.), réponds — même si la "
        "question n'est pas listée telle quelle dans la FAQ.\n"
        "2. N'invente JAMAIS une donnée absente (prix, horaire, disponibilité, "
        "identité du personnel...).\n"
        "3. action='escalate' UNIQUEMENT si : le client veut réserver, commander, "
        "se plaindre, ou parler à un humain ; OU l'information demandée est réellement "
        "absente de la fiche. Dans le doute sur une info factuelle du resto, préfère "
        "escalader plutôt qu'inventer.\n"
        "4. Sinon : action='reply'.\n"
        "5. Renseigne toujours 'reason' (courte justification interne).\n\n"
        "TON DES RÉPONSES (action='reply') :\n"
        "- Chaleureux, humain et professionnel, comme un employé du resto.\n"
        "- Concis et précis : va droit au but.\n"
        "- Jamais de tiret long (—). Utilise des phrases simples ou une virgule.\n"
        "- Pour une simple question : 1 à 3 phrases courtes.\n"
        "- Pour une LISTE (menu, plusieurs plats/prix) : présente-la LISIBLE, un "
        "élément par ligne avec un retour à la ligne, et tu peux mettre la catégorie "
        "ou le plat en gras WhatsApp avec des astérisques (*Poulet braisé* — 3 000 "
        "FCFA... non, sans tiret : *Poulet braisé* : 3 000 FCFA). Reste synthétique, "
        "ne dépasse pas ce qui est demandé.\n\n"
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
