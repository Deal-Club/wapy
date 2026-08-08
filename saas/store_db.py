"""Store conversationnel adossé à la DB, scellé à un tenant.

Même interface que `store.conversations.ConversationStore` afin de réutiliser
l'orchestration du bot sans la modifier. Toutes les requêtes filtrent par tenant_id.
"""
from saas import models


class DbStore:
    def __init__(self, session, tenant_id: int):
        self.s = session
        self.tid = tenant_id

    # --- Historique ---
    def append(self, chat_id: str, role: str, text: str) -> None:
        self.s.add(
            models.Conversation(tenant_id=self.tid, chat_id=chat_id, role=role, content=text)
        )
        self.s.commit()

    def set_name(self, chat_id: str, name: str) -> None:
        """Mémorise le nom d'affichage (pushName) d'un interlocuteur."""
        name = (name or "").strip()
        if not name:
            return
        # merge = upsert par clé primaire (tenant_id, chat_id) : insère ou met à jour.
        self.s.merge(models.Contact(tenant_id=self.tid, chat_id=chat_id, name=name))
        self.s.commit()

    def get_history(self, chat_id: str, limit: int) -> list[dict]:
        rows = (
            self.s.query(models.Conversation)
            .filter_by(tenant_id=self.tid, chat_id=chat_id)
            .order_by(models.Conversation.id.desc())
            .limit(limit)
            .all()
        )
        return [{"role": r.role, "content": r.content} for r in reversed(rows)]

    def add_record(self, chat_id: str, kind: str, content: str) -> None:
        """Enregistre une action conclue par le bot (réservation, commande, paiement...).

        Anti-doublon : si une même demande (même client + même type) a été enregistrée
        récemment, on la MET À JOUR au lieu de créer une nouvelle ligne (le bot ré-émet
        souvent l'enregistrement au fil de la conversation)."""
        from datetime import datetime, timedelta

        kind = (kind or "")[:60]
        recent = (
            self.s.query(models.Record)
            .filter_by(tenant_id=self.tid, chat_id=chat_id, kind=kind)
            .filter(models.Record.created_at >= datetime.utcnow() - timedelta(hours=6))
            .order_by(models.Record.id.desc())
            .first()
        )
        if recent:
            recent.content = content or ""
            recent.created_at = datetime.utcnow()
        else:
            self.s.add(models.Record(tenant_id=self.tid, chat_id=chat_id, kind=kind, content=content or ""))
        self.s.commit()

    # --- État de conversation ---
    def _state(self, chat_id: str, create: bool = False):
        st = (
            self.s.query(models.ConvState)
            .filter_by(tenant_id=self.tid, chat_id=chat_id)
            .first()
        )
        if st is None and create:
            st = models.ConvState(
                tenant_id=self.tid, chat_id=chat_id, escalated=False, optout=False
            )
            self.s.add(st)
            self.s.commit()
        return st

    def is_escalated(self, chat_id: str) -> bool:
        st = self._state(chat_id)
        return bool(st and st.escalated)

    def set_escalated(self, chat_id: str) -> None:
        st = self._state(chat_id, create=True)
        st.escalated = True
        self.s.commit()

    def clear_escalated(self, chat_id: str) -> None:
        st = self._state(chat_id)
        if st:
            st.escalated = False
            self.s.commit()

    def is_optout(self, chat_id: str) -> bool:
        st = self._state(chat_id)
        return bool(st and st.optout)

    def set_optout(self, chat_id: str) -> None:
        st = self._state(chat_id, create=True)
        st.optout = True
        self.s.commit()

    # --- Idempotence ---
    def is_processed(self, msg_id: str) -> bool:
        return (
            self.s.query(models.ProcessedMessage)
            .filter_by(tenant_id=self.tid, msg_id=msg_id)
            .first()
            is not None
        )

    def mark_processed(self, msg_id: str) -> None:
        if not self.is_processed(msg_id):
            self.s.add(models.ProcessedMessage(tenant_id=self.tid, msg_id=msg_id))
            self.s.commit()

    # --- Handoff ---
    def open_handoff(self, staff_number: str, client_id: str) -> None:
        self.s.add(
            models.Handoff(
                tenant_id=self.tid,
                staff_number=staff_number,
                client_id=client_id,
                resolved=False,
            )
        )
        self.s.commit()

    def latest_open_handoff_client(self) -> str | None:
        row = (
            self.s.query(models.Handoff)
            .filter_by(tenant_id=self.tid, resolved=False)
            .order_by(models.Handoff.id.desc())
            .first()
        )
        return row.client_id if row else None

    def map_alert(self, msg_id: str, client_id: str) -> None:
        """Associe l'id d'un message envoyé au staff au client concerné."""
        if not msg_id:
            return
        self.s.add(models.StaffAlert(tenant_id=self.tid, msg_id=str(msg_id), client_id=client_id))
        self.s.commit()

    def client_for_alert(self, msg_id: str) -> str | None:
        """Retrouve le client visé quand le staff cite (reply) un message d'alerte.

        Match tolérant : l'id cité entrant peut être la strophe brute (Baileys)
        alors qu'on a stocké l'id sérialisé (`true_...@c.us_STANZA`). On compare
        donc aussi le suffixe après le dernier '_'."""
        if not msg_id:
            return None
        key = str(msg_id)
        stanza = key.split("_")[-1]
        rows = (
            self.s.query(models.StaffAlert)
            .filter_by(tenant_id=self.tid)
            .order_by(models.StaffAlert.id.desc())
            .limit(80)
            .all()
        )
        for r in rows:
            rid = r.msg_id or ""
            if rid == key or (stanza and rid.split("_")[-1] == stanza):
                return r.client_id
        return None

    def resolve_handoffs_for_client(self, client_id: str) -> None:
        for h in (
            self.s.query(models.Handoff)
            .filter_by(tenant_id=self.tid, client_id=client_id)
            .all()
        ):
            h.resolved = True
        self.s.commit()
