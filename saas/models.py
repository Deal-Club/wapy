"""Modèles SQLAlchemy de la plateforme Wapy (multi-tenant).

Toute table tenant-scoped porte `tenant_id`. Isolation garantie côté requêtes.
"""
from sqlalchemy import (
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
    created_at = Column(DateTime, server_default=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="owner")
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


class WaSession(Base):
    __tablename__ = "wa_sessions"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    session_name = Column(String(120), unique=True, nullable=False)
    status = Column(String(50), default="UNKNOWN")
    linked_number = Column(String(120), default="")


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
