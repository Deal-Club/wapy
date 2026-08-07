"""Modèles SQLAlchemy de la plateforme Wapy (multi-tenant).

Toute table tenant-scoped porte `tenant_id`. Isolation garantie côté requêtes.
"""
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)

from saas.db import Base


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True)
    plan = Column(String(50), default="free")
    status = Column(String(20), default="active")  # active | suspended (géré par le super-admin)
    # Config bot par tenant (numéros @c.us pour envoyer les alertes ;
    # @lid pour reconnaître les messages entrants du staff — cf. WAHA/NOWEB).
    staff_numbers = Column(Text, default="")
    staff_inbound_ids = Column(Text, default="")
    wapy_model = Column(String(80), default="claude-haiku-4-5-20251001")  # le moins cher (multi-tenant)
    created_at = Column(DateTime, server_default=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="owner")
    must_change_password = Column(Boolean, default=False)  # mot de passe auto-généré à changer
    created_at = Column(DateTime, server_default=func.now())


class RestaurantInfo(Base):
    __tablename__ = "restaurant_info"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    rubrique = Column(String(255), nullable=False)
    contenu = Column(Text, default="")


class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    categorie = Column(String(120), default="")
    plat = Column(String(255), default="")
    description = Column(Text, default="")
    prix = Column(String(60), default="")
    regime = Column(String(255), default="")


class Faq(Base):
    __tablename__ = "faq"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    question = Column(Text, default="")
    reponse = Column(Text, default="")


class BusinessConfig(Base):
    """Config flexible de l'établissement (multi-secteurs), stockée en JSON.

    data = {
      "sector": str, "description": str,
      "infos": [{"label", "value"}],
      "tables": [{"name", "columns": [str], "rows": [{col: val}]}],
      "faq": [{"question", "reponse"}],
      "consignes": [{"situation", "action"}]
    }
    """
    __tablename__ = "business_config"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    data = Column(JSON, default=dict)


class WaSession(Base):
    __tablename__ = "wa_sessions"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    session_name = Column(String(120), unique=True, nullable=False)
    status = Column(String(50), default="UNKNOWN")
    linked_number = Column(String(120), default="")
    last_seen = Column(DateTime)  # dernière fois vue WORKING (supervision)


class SessionIncident(Base):
    """Historique des changements d'état problématiques d'une session WhatsApp
    (déconnexion, QR réapparu, échec/ban). Alimente la supervision + les alertes."""
    __tablename__ = "session_incidents"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    status = Column(String(50), default="")
    note = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    chat_id = Column(String(120), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class ConvState(Base):
    __tablename__ = "conv_state"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    chat_id = Column(String(120), nullable=False)
    escalated = Column(Boolean, default=False)
    optout = Column(Boolean, default=False)
    __table_args__ = (UniqueConstraint("tenant_id", "chat_id", name="uq_convstate"),)


class Handoff(Base):
    __tablename__ = "handoffs"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    staff_number = Column(String(120), nullable=False)
    client_id = Column(String(120), nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class StaffAlert(Base):
    """Mappe l'id d'un message envoyé au staff (alerte / message client transféré)
    vers le client concerné. Permet au responsable de répondre au bon client en
    CITANT le message dans WhatsApp, même avec plusieurs conversations en parallèle."""
    __tablename__ = "staff_alerts"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    msg_id = Column(String(255), nullable=False, index=True)
    client_id = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProcessedMessage(Base):
    __tablename__ = "processed_messages"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    msg_id = Column(String(255), nullable=False)
    __table_args__ = (UniqueConstraint("tenant_id", "msg_id", name="uq_processed"),)


class UsageCounter(Base):
    __tablename__ = "usage_counters"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    day = Column(String(10), nullable=False)  # AAAA-MM-JJ
    messages_in = Column(Integer, default=0)
    messages_out = Column(Integer, default=0)
    __table_args__ = (UniqueConstraint("tenant_id", "day", name="uq_usage_day"),)


class Contact(Base):
    """Nom d'affichage d'un interlocuteur (pushName WhatsApp) pour ne pas afficher
    un @lid illisible dans le tableau de bord."""
    __tablename__ = "contacts"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    chat_id = Column(String(120), primary_key=True)
    name = Column(String(255), default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StaffVerification(Base):
    """Code OTP en attente pour confirmer le numéro d'alerte du staff.

    Un seul en cours par tenant (PK = tenant_id). Le code est envoyé sur le WhatsApp
    du numéro saisi : s'il arrive, le numéro reçoit bien -> alertes fiables."""
    __tablename__ = "staff_verifications"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    jid = Column(String(120), default="")
    code = Column(String(12), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Record(Base):
    """Action conclue par le bot en autonomie (réservation, commande, paiement, lead).

    Le bot mène l'échange, enregistre ici le résultat structuré, et NOTIFIE le
    responsable (sans lui passer la main). kind ex. « Réservation », « Commande »."""
    __tablename__ = "records"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    chat_id = Column(String(120), nullable=False, index=True)
    kind = Column(String(60), default="")
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentConfig(Base):
    """Clés GeniusPay d'un établissement (il encaisse ses propres paiements)."""
    __tablename__ = "payment_configs"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    provider = Column(String(30), default="geniuspay")
    api_key = Column(String(255), default="")
    api_secret = Column(String(255), default="")
    webhook_secret = Column(String(255), default="")
    mode = Column(String(20), default="sandbox")  # sandbox | live
    enabled = Column(Boolean, default=False)


class Subscription(Base):
    """Abonnement d'un établissement à Wapy (facturation opérateur via GeniusPay)."""
    __tablename__ = "subscriptions"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    plan = Column(String(40), default="")
    addons = Column(JSON, default=list)  # add-ons souscrits (clés)
    status = Column(String(30), default="trial")  # trial | active | expired
    current_period_end = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Payment(Base):
    """Paiement GeniusPay (abonnement) initié depuis le dashboard, suivi via webhook."""
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    chat_id = Column(String(120), default="")
    reference = Column(String(120), default="", index=True)
    amount = Column(Integer, default=0)
    currency = Column(String(10), default="XOF")
    status = Column(String(30), default="pending")  # pending|completed|failed|cancelled|refunded
    description = Column(Text, default="")
    checkout_url = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Suggestion(Base):
    """Amélioration de config proposée par l'IA à partir des conversations.

    kind ∈ {faq, info, consigne, table_row}. `payload` porte le contenu prêt à
    fusionner. `status` ∈ {pending, accepted, rejected}. Rien n'entre en config
    sans validation du propriétaire (statut accepted)."""
    __tablename__ = "suggestions"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    kind = Column(String(30), nullable=False)
    title = Column(String(255), default="")
    payload = Column(JSON, default=dict)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
