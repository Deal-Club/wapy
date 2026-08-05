"""Point d'entrée Wapy — routes + câblage. La logique vit dans les modules."""
import logging
import random

from fastapi import FastAPI, Request

import config
from safety.guards import is_group, is_broadcast, detect_optout
from handoff.handoff import escalate_to_staff

logger = logging.getLogger("wapy")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("%(asctime)s WAPY %(levelname)s %(message)s"))
    logger.addHandler(_h)
    logger.setLevel(logging.INFO)
    logger.propagate = False

# Commandes du boss pour rendre la conversation au bot.
HANDBACK_CMDS = {"/fin", "fin", "/bot", "terminé", "termine"}


def _safe_send(channel, to: str, text: str) -> None:
    try:
        channel.send_text(to, text)
    except Exception:
        pass


def _build_default_deps() -> dict:
    from channel.waha import WahaProvider
    from brain.brain import Brain
    from store.conversations import ConversationStore
    from fiche.loader import FicheLoader, gspread_reader
    import anthropic

    return {
        "channel": WahaProvider(config.WAHA_BASE_URL, config.WAHA_SESSION, config.WAHA_API_KEY),
        "brain": Brain(anthropic.Anthropic(), config.WAPY_MODEL),
        "store": ConversationStore(config.DB_PATH),
        "fiche": FicheLoader(gspread_reader, config.FICHE_TTL_SECONDS),
        "staff_numbers": config.STAFF_WHATSAPP_NUMBERS,
        "staff_recognize": list(
            set(config.STAFF_WHATSAPP_NUMBERS) | set(config.STAFF_INBOUND_IDS)
        ),
        "rng": random.Random(),
    }


def create_app(deps: dict | None = None) -> FastAPI:
    app = FastAPI(title="Wapy")
    app.state.deps = deps  # None => construits paresseusement au 1er webhook

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "Wapy"}

    @app.post("/webhook")
    async def webhook(request: Request):
        if app.state.deps is None:
            app.state.deps = _build_default_deps()
        d = app.state.deps
        channel, brain, store, fiche = d["channel"], d["brain"], d["store"], d["fiche"]

        payload = await request.json()
        msg = channel.parse_incoming(payload)
        if msg is None:
            return {"status": "ignored"}

        # Garde-fous d'entrée
        if msg.from_me or msg.is_group or is_broadcast(msg.chat_id) or is_group(msg.chat_id):
            return {"status": "ignored"}

        # Idempotence : ignorer un message déjà traité (rejeu webhook WAHA)
        if msg.id and store.is_processed(msg.id):
            logger.info("DUPLICATE ignoré id=%s de %s", msg.id, msg.chat_id)
            return {"status": "duplicate"}
        if msg.id:
            store.mark_processed(msg.id)

        logger.info("IN  %s : %s", msg.chat_id, msg.text[:200])

        # Relais boss : un message venant du staff est transmis au client escaladé.
        recognize = d.get("staff_recognize") or d.get("staff_numbers", [])
        if msg.chat_id in recognize:
            client_id = store.latest_open_handoff_client()
            if msg.text.strip().lower() in HANDBACK_CMDS:
                if client_id:
                    store.resolve_handoffs_for_client(client_id)
                    store.clear_escalated(client_id)
                    _safe_send(channel, msg.chat_id, "🔁 Conversation rendue au bot.")
                    logger.info("HANDBACK staff %s -> client %s", msg.chat_id, client_id)
                    return {"status": "handback"}
                _safe_send(channel, msg.chat_id, "Aucune conversation en cours.")
                return {"status": "staff-idle"}
            if client_id:
                channel.send_text(client_id, msg.text)
                logger.info("RELAY staff %s -> client %s", msg.chat_id, client_id)
                return {"status": "relayed"}
            logger.info("staff %s sans handoff ouvert", msg.chat_id)
            return {"status": "staff-idle"}

        if store.is_optout(msg.chat_id):
            return {"status": "handed_off"}
        if detect_optout(msg.text):
            store.set_optout(msg.chat_id)
            store.resolve_handoffs_for_client(msg.chat_id)
            logger.info("OPT-OUT %s", msg.chat_id)
            return {"status": "optout"}

        # Conversation en cours avec un humain : transmettre le message du client
        # au staff (handoff bidirectionnel) au lieu de laisser le bot répondre.
        if store.is_escalated(msg.chat_id):
            label = f"💬 Client {msg.chat_id} :\n{msg.text}"
            for num in d.get("staff_numbers", []):
                _safe_send(channel, num, label)
            logger.info("FORWARD client %s -> staff", msg.chat_id)
            return {"status": "forwarded"}

        # Traitement
        store.append(msg.chat_id, "user", msg.text)
        history = store.get_history(msg.chat_id, config.HISTORY_LIMIT)
        decision = brain.decide(fiche.load(), history, msg.text)
        logger.info("DECISION %s (%s)", decision.action, decision.reason[:120])

        if decision.action == "reply":
            channel.send_text(msg.chat_id, decision.message)
            store.append(msg.chat_id, "assistant", decision.message)
            logger.info("OUT reply -> %s", msg.chat_id)
            return {"status": "replied"}

        escalate_to_staff(
            channel, store, msg.chat_id, msg.text, d["staff_numbers"], decision.reason
        )
        logger.info("OUT escalate -> staff (%s)", d["staff_numbers"])
        return {"status": "escalated"}

    return app


app = create_app()
