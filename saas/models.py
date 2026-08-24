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
    Index,
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
    widget_key = Column(String(80), unique=True)  # clé publique du widget web (chatbot iframe)
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


class MonthlyConversation(Base):
    """Une ligne par interlocuteur distinct et par mois : c'est le compteur du quota.

    « Conversation » = un interlocuteur qui a écrit au moins une fois dans le mois,
    pas un échange ni une session. C'est la définition que le client comprend en
    lisant l'offre, et la seule qui ne dépende pas d'un délai d'inactivité
    arbitraire. Un habitué qui écrit chaque semaine compte donc pour un.
    """
    __tablename__ = "monthly_conversations"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    month = Column(String(7), nullable=False)  # AAAA-MM
    chat_id = Column(String(120), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (
        UniqueConstraint("tenant_id", "month", "chat_id", name="uq_monthly_conv"),
    )


class TikTokAccount(Base):
    """Connexion TikTok d'un établissement (compte Business, OAuth).

    Même modèle que `GoogleAuth` : chaque établissement autorise SON propre
    compte, aucun secret opérateur ici. Les jetons sont chiffrés au repos avec
    la clé Fernet de l'opérateur (`saas.connector.encrypt`) — un dump de la base
    ne révèle rien d'exploitable.

    `open_id` est l'identifiant du compte chez TikTok : il sert à router un
    évènement entrant vers le bon établissement, comme `WaSession.session_name`
    le fait pour WhatsApp.
    """
    __tablename__ = "tiktok_accounts"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    open_id = Column(String(120), unique=True, index=True)
    display_name = Column(String(255), default="")
    access_token_enc = Column(Text, default="")
    refresh_token_enc = Column(Text, default="")
    expires_at = Column(DateTime)
    scopes = Column(Text, default="")
    status = Column(String(30), default="disconnected")  # disconnected | connected | expired
    connected_at = Column(DateTime)


class TikTokUsage(Base):
    """Réponses TikTok émises par mois et par établissement.

    On compte les RÉPONSES ÉMISES, pas les interlocuteurs distincts comme pour
    WhatsApp. Deux raisons : sous une vidéo, la même personne commente souvent
    plusieurs fois, et c'est chaque réponse qui coûte un appel au modèle. Compter
    les personnes facturerait mal un canal dont le volume ne vient pas du nombre
    de gens mais du nombre de messages.
    """
    __tablename__ = "tiktok_usage"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    month = Column(String(7), nullable=False)  # AAAA-MM
    kind = Column(String(20), nullable=False, default="comment")  # comment | dm
    count = Column(Integer, default=0)
    __table_args__ = (
        UniqueConstraint("tenant_id", "month", "kind", name="uq_tiktok_usage"),
    )


class PontApp(Base):
    """Compte developpeur du pont WhatsApp — service distinct de l'assistant.

    Un compte de pont n'est PAS un `Tenant` : pas de fiche, pas de cerveau, pas
    d'abonnement. Il n'a qu'une chose, sa propre session WhatsApp, et n'obtient
    qu'une chose, le droit d'y envoyer des messages par HTTP. Les melanger
    exposerait ces comptes aux entitlements, aux quotas de conversation et au
    routage du bot, dont ils n'ont que faire.

    La cle d'API n'est jamais stockee en clair : seul son SHA-256 l'est, avec un
    prefixe court non secret qui sert a la retrouver sans parcourir la table. Un
    dump de la base ne permet donc d'envoyer aucun message.
    """
    __tablename__ = "pont_apps"
    id = Column(Integer, primary_key=True)
    nom = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False, default="")
    # Conditions d'utilisation : tant qu'elles ne sont pas acceptees, aucun envoi.
    # Horodatage et non booleen : en cas de litige, la question est « quand », pas
    # « si ». La version acceptee est figee pour que reediter le texte n'efface
    # pas ce qui a ete accepte.
    conditions_le = Column(DateTime)
    conditions_version = Column(String(20), default="")
    # 18 premiers caracteres de la cle : identifiant, pas secret.
    prefixe_cle = Column(String(16), unique=True, index=True)
    cle_hash = Column(String(64), default="")
    # Session WAHA dediee. Un bannissement de ce numero ne touche aucun bot.
    session_name = Column(String(120), unique=True, nullable=False)
    # Un compte s'inscrit librement mais n'emet rien avant validation : la porte
    # est ouverte, la capacite ne l'est pas. Le developpeur peut donc preparer
    # toute son integration pendant que la demande est examinee.
    statut = Column(String(20), default="en_attente")  # en_attente | actif | suspendu
    # Debits. Le pont est gratuit : ces bornes sont la seule chose qui empeche
    # qu'il devienne un relais de diffusion.
    intervalle_min_s = Column(Integer, default=3)     # lissage : jamais de rafale
    envois_par_heure = Column(Integer, default=60)
    envois_par_jour = Column(Integer, default=500)
    created_at = Column(DateTime, server_default=func.now())


class PontEnvoi(Base):
    """Trace d'un envoi du pont. AUCUN CONTENU DE MESSAGE.

    On stocke de quoi compter, facturer un jour, et arbitrer un litige : qui,
    quand, quel genre, quelle taille, quelle issue. Jamais le texte, jamais le
    code a usage unique, et le destinataire uniquement sous forme d'empreinte
    HMAC — deterministe, donc suffisante pour limiter le debit par destinataire,
    mais inexploitable dans un dump.
    """
    __tablename__ = "pont_envois"
    id = Column(Integer, primary_key=True)
    app_id = Column(Integer, ForeignKey("pont_apps.id"), nullable=False, index=True)
    # Cle d'idempotence, sous forme d'empreinte : elle est choisie par l'appelant
    # et porte souvent un identifiant metier (« paiement-2026-114 »). La stocker
    # en clair fuiterait sa nomenclature interne sans rien nous apporter — la
    # comparaison d'egalite suffit, et une empreinte la permet.
    idempotence_hmac = Column(String(64), nullable=False)
    destinataire_hmac = Column(String(64), nullable=False)
    genre = Column(String(20), nullable=False)  # texte | otp
    taille = Column(Integer, default=0)
    statut = Column(String(20), nullable=False)  # envoye | refuse | echec
    motif = Column(String(60), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (
        UniqueConstraint("app_id", "idempotence_hmac", name="uq_pont_idem"),
        # Tous les controles de debit interrogent (compte, date), et le plafond
        # par destinataire y ajoute l'empreinte. Un index composite evite de
        # parcourir l'historique du compte a chaque envoi.
        Index("ix_pont_envois_debit", "app_id", "created_at", "destinataire_hmac"),
    )


class PontBloque(Base):
    """Destinataire ayant demande l'arret sur le numero d'un compte de pont.

    Obligation WhatsApp, et meilleure defense en cas de plainte. Alimente par les
    messages entrants sur la session du pont : le bot n'y repond jamais, mais un
    « STOP » y est toujours entendu.
    """
    __tablename__ = "pont_bloques"
    id = Column(Integer, primary_key=True)
    app_id = Column(Integer, ForeignKey("pont_apps.id"), nullable=False)
    destinataire_hmac = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (
        UniqueConstraint("app_id", "destinataire_hmac", name="uq_pont_bloque"),
    )


class AiCost(Base):
    """Coût IA réel, par établissement / mois / tâche / modèle (cf. saas/costs.py).

    Distinct de `UsageCounter`, qui compte des messages : un message ne dit rien
    de ce qu'il coûte (le modèle et l'état du cache font varier le prix d'un
    facteur cinquante). Ventilé par tâche pour pouvoir répondre à « qu'est-ce qui
    coûte cher chez ce client » sans relire les logs.
    """
    __tablename__ = "ai_costs"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    month = Column(String(7), nullable=False)  # AAAA-MM
    task = Column(String(30), nullable=False)  # brain | vision | config | learn
    model = Column(String(80), nullable=False)
    calls = Column(Integer, default=0)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    tokens_cache_read = Column(Integer, default=0)
    tokens_cache_write = Column(Integer, default=0)
    # Micro-dollars entiers : additionner des flottants sur des milliers d'appels dérive.
    cost_micro_usd = Column(Integer, default=0)
    __table_args__ = (
        UniqueConstraint("tenant_id", "month", "task", "model", name="uq_ai_cost"),
    )


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


class Booking(Base):
    """Réservation / RDV pris par le bot (créneau autonome)."""
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    chat_id = Column(String(120), default="")
    customer_name = Column(String(120), default="")
    service = Column(String(120), default="")
    start = Column(DateTime, index=True)   # UTC
    duration_min = Column(Integer, default=30)
    status = Column(String(20), default="booked")  # booked | cancelled | done
    notes = Column(Text, default="")
    gcal_event_id = Column(String(255), default="")  # synchro Google Calendar (à venir)
    reminded_j1 = Column(Boolean, default=False)
    reminded_h2 = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WebChatSession(Base):
    """Conversation d'un visiteur via le widget web (chatbot sur le site du client).

    Pas de compte WhatsApp : le visiteur est anonyme, identifié par une clé de
    session générée côté navigateur (localStorage). `contact` = tel/e-mail laissé
    volontairement pour un rappel humain.
    """
    __tablename__ = "webchat_sessions"
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    session_key = Column(String(80), index=True)  # uuid navigateur
    contact = Column(String(255), default="")
    escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("tenant_id", "session_key", name="uq_webchat_tenant_session"),)


class WebChatMessage(Base):
    """Un message d'une conversation widget (rôle user/assistant)."""
    __tablename__ = "webchat_messages"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("webchat_sessions.id"), nullable=False, index=True)
    role = Column(String(16), default="user")
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class DataConnector(Base):
    """Connecteur vers la base de l'établissement (endpoint HTTP read-only).

    On ne se connecte JAMAIS directement à la base SQL du client (surface d'attaque
    énorme) : l'établissement expose un endpoint HTTP qui renvoie du JSON. Le token
    d'accès est chiffré au repos (Fernet) — un dump SQL ne le révèle pas.
    """
    __tablename__ = "data_connectors"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    enabled = Column(Boolean, default=False)
    url = Column(String(500), default="")
    header_name = Column(String(120), default="Authorization")
    token_enc = Column(Text, default="")   # token chiffré (Fernet)
    note = Column(Text, default="")         # description de ce que renvoie l'endpoint (pour le cerveau)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GoogleAuth(Base):
    """Connexion Google Calendar d'un établissement (OAuth, un refresh_token / tenant).

    Modèle « option B » : chaque établissement autorise SON propre agenda. Aucun
    secret opérateur ici — uniquement le refresh_token de l'établissement.
    """
    __tablename__ = "google_auth"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    refresh_token = Column(Text, default="")
    # Agenda secondaire « Wapy — Réservations » créé chez l'établissement au
    # moment du consentement. Les lignes antérieures à la bascule vers le scope
    # non sensible portent encore "primary" et continuent de fonctionner avec
    # leur ancien jeton, jusqu'à reconnexion.
    calendar_id = Column(String(255), default="")
    email = Column(String(255), default="")   # e-mail du compte Google, pour affichage
    connected_at = Column(DateTime, default=datetime.utcnow)


class AiGenUsage(Base):
    """Compteur MENSUEL des générations IA de config (garde-fou anti-abus/coût)."""
    __tablename__ = "ai_gen_usage"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True)
    month = Column(String(7), primary_key=True)  # 'YYYY-MM'
    count = Column(Integer, default=0)


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
