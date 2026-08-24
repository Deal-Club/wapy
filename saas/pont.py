"""Pont WhatsApp pour developpeurs — service distinct de l'assistant.

CE QUE C'EST. Une application tierce (gestion scolaire, boutique en ligne, outil
interne) connecte SON propre numero WhatsApp et obtient une cle d'API. Elle peut
alors faire partir des messages transactionnels depuis ce numero : reçu de
paiement, code a usage unique, confirmation d'inscription. Rien d'autre.

CE QUE CE N'EST PAS. Il n'y a ni fiche, ni cerveau, ni reponse automatique. Le
pont ne lit pas les messages entrants et n'y repond jamais — a une exception
pres, la demande d'arret, qui est une obligation.

POURQUOI UN NUMERO DEDIE. L'envoi sortant vers des gens qui n'ont pas ecrit est
le comportement qui fait bannir un compte WhatsApp. Le pont utilise donc une
session distincte de celle du bot : si le numero de notification tombe,
l'assistant continue de repondre sur le sien. C'est la seule isolation qui
compte vraiment, les autres ne sont que de l'hygiene.

CE QUI N'EST JAMAIS STOCKE. Aucun corps de message, aucun code a usage unique,
aucun numero en clair. La table d'envois ne porte que des metadonnees et une
empreinte HMAC du destinataire — deterministe, donc suffisante pour limiter le
debit par destinataire, inexploitable dans un dump de base.
"""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

from saas import models

PREFIXE = "wapy_pont_"
LONGUEUR_PREFIXE = 18  # « wapy_pont_ » + 8 caracteres : identifiant, pas secret
MAX_TEXTE = 1000
# Plafond du code a usage unique, par destinataire et par heure. Volontairement
# bas : sans cette borne, une cle qui fuit transforme le pont en arme contre un
# numero tiers.
OTP_PAR_HEURE = 2


def _cle_hmac() -> bytes:
    """Clef de l'empreinte des destinataires. Distincte de tout secret applicatif."""
    brute = os.environ.get("WAPY_PONT_HMAC_KEY", "").strip()
    if not brute:
        # Repli sur le secret des jetons : le pont reste fonctionnel, mais changer
        # JWT_SECRET reinitialiserait les compteurs par destinataire. La variable
        # dediee est donc recommandee en production.
        brute = os.environ.get("JWT_SECRET", "")
    return brute.encode()


def _empreinte(valeur: str) -> str:
    return hmac.new(_cle_hmac(), (valeur or "").encode(), hashlib.sha256).hexdigest()


def empreinte(numero: str) -> str:
    """Empreinte stable d'un numero. Jamais reversible, toujours comparable.

    Les chiffres seuls sont retenus : `+229 90 00 00 01`, `22990000001` et
    `22990000001@c.us` designent le meme destinataire et doivent partager un
    plafond. Sans cette normalisation, changer de format contournerait la borne.
    """
    return _empreinte("".join(c for c in (numero or "") if c.isdigit()))


def empreinte_idempotence(cle: str) -> str:
    """Empreinte d'une cle d'idempotence.

    Elle est choisie par l'appelant et porte souvent un identifiant metier : la
    stocker en clair fuiterait sa nomenclature interne sans rien nous apporter.
    """
    return _empreinte((cle or "").strip())


# --- Comptes developpeurs --------------------------------------------------
#
# Authentification distincte de celle des etablissements : un compte de pont
# n'est pas un `Tenant` et n'a rien a faire dans la table des utilisateurs. Le
# jeton porte la revendication `pid`, jamais `tid` — un jeton d'assistant ne
# peut donc pas ouvrir le pont, ni l'inverse.

# Version des conditions. Changer le texte sans changer ce numero laisserait
# croire que d'anciens comptes ont accepte un texte qu'ils n'ont jamais lu.
CONDITIONS_VERSION = "2026-08-24"

# Retention du journal d'envois. Il ne porte que des metadonnees, mais il n'y a
# aucune raison de garder indefiniment de quoi reconstituer le rythme d'activite
# d'un client. Au-dela, on purge.
RETENTION_JOURS = 90


def inscrire(session, nom: str, email: str, mot_de_passe: str):
    """Cree un compte de pont. Il ne peut rien emettre avant validation."""
    from saas import auth

    email = (email or "").strip().lower()
    if not email or not nom.strip():
        raise ValueError("Nom et adresse électronique obligatoires.")
    if len(mot_de_passe or "") < 8:
        raise ValueError("Mot de passe de 8 caractères au minimum.")
    if session.query(models.PontApp).filter_by(email=email).first():
        raise ValueError("Un compte existe déjà pour cette adresse.")

    app = models.PontApp(
        nom=nom.strip()[:120], email=email,
        password_hash=auth.hash_password(mot_de_passe),
        session_name="", statut="en_attente",
    )
    session.add(app)
    session.flush()
    # Le nom de session derive de l'identifiant : il ne peut donc etre ni devine
    # ni choisi, et ne collisionne jamais avec la convention `t{id}` des tenants.
    app.session_name = f"pont{app.id}"
    session.commit()
    return app


def authentifier(session, email: str, mot_de_passe: str):
    from saas import auth

    app = session.query(models.PontApp).filter_by(email=(email or "").strip().lower()).first()
    if not app or not auth.verify_password(mot_de_passe or "", app.password_hash or ""):
        return None
    return app


def creer_token(app_id: int) -> str:
    import time

    import jwt as _jwt
    from saas import auth

    charge = {"pid": app_id, "iat": int(time.time()), "exp": int(time.time()) + 7 * 24 * 3600}
    return _jwt.encode(charge, auth.JWT_SECRET, algorithm=auth.JWT_ALGO)


def app_pour_token(session, token: str):
    import jwt as _jwt
    from saas import auth

    try:
        charge = _jwt.decode(token, auth.JWT_SECRET, algorithms=[auth.JWT_ALGO])
    except Exception:
        return None
    pid = charge.get("pid")
    return session.get(models.PontApp, pid) if pid else None


def conditions_acceptees(app) -> bool:
    """Vraies conditions, dans leur version courante. Un texte revise doit etre
    re-accepte : sinon on opposerait a un developpeur des regles qu'il n'a pas vues."""
    return bool(app.conditions_le) and (app.conditions_version or "") == CONDITIONS_VERSION


def accepter_conditions(session, app):
    app.conditions_le = datetime.utcnow()
    app.conditions_version = CONDITIONS_VERSION
    session.commit()
    return app


def peut_emettre(app) -> tuple[bool, str]:
    """Trois verrous, dans l'ordre ou le developpeur peut les lever."""
    if not conditions_acceptees(app):
        return False, "conditions-non-acceptees"
    if app.statut == "suspendu":
        return False, "compte-suspendu"
    if app.statut != "actif":
        return False, "compte-non-valide"
    if not (app.prefixe_cle or ""):
        return False, "aucune-cle"
    return True, ""


def purger(session, jours: int = RETENTION_JOURS) -> int:
    """Efface les traces d'envoi au-dela de la retention. Renvoie le nombre efface."""
    limite = datetime.utcnow() - timedelta(days=jours)
    n = (session.query(models.PontEnvoi)
         .filter(models.PontEnvoi.created_at < limite).delete(synchronize_session=False))
    session.commit()
    return n


# --- Cles d'API ------------------------------------------------------------

def generer_cle() -> tuple[str, str, str]:
    """Renvoie (cle en clair, prefixe, empreinte). La cle n'est montree qu'une fois."""
    cle = PREFIXE + secrets.token_urlsafe(32)
    return cle, cle[:LONGUEUR_PREFIXE], hashlib.sha256(cle.encode()).hexdigest()


def app_pour_cle(session, cle: str):
    """Compte correspondant a la cle, ou None. Comparaison a temps constant.

    Le prefixe sert d'index ; l'empreinte complete decide. `compare_digest` evite
    qu'un attaquant deduise la cle du temps de reponse.
    """
    if not cle or not cle.startswith(PREFIXE):
        return None
    app = (session.query(models.PontApp)
           .filter_by(prefixe_cle=cle[:LONGUEUR_PREFIXE]).first())
    if not app:
        return None
    attendu = hashlib.sha256(cle.encode()).hexdigest()
    if not hmac.compare_digest(attendu, app.cle_hash or ""):
        return None
    # Le statut n'est PAS filtré ici : authentifier n'est pas autoriser. Une clé
    # valide sur un compte suspendu doit ouvrir `/statut` pour que son
    # propriétaire lise « suspendu » plutôt qu'un 401 qui lui ferait croire à une
    # clé perdue. Le droit d'émettre se décide dans `peut_emettre`.
    return app


# --- Garde-fous ------------------------------------------------------------

def est_bloque(session, app_id: int, emp: str) -> bool:
    return (session.query(models.PontBloque)
            .filter_by(app_id=app_id, destinataire_hmac=emp).first() is not None)


def bloquer(session, app_id: int, numero: str) -> None:
    """Enregistre une demande d'arret. Idempotent."""
    emp = empreinte(numero)
    if est_bloque(session, app_id, emp):
        return
    session.add(models.PontBloque(app_id=app_id, destinataire_hmac=emp))
    try:
        session.commit()
    except Exception:
        session.rollback()


def _compter(session, app_id: int, depuis: datetime, emp: str = "") -> int:
    q = (session.query(models.PontEnvoi)
         .filter(models.PontEnvoi.app_id == app_id,
                 models.PontEnvoi.statut == "envoye",
                 models.PontEnvoi.created_at >= depuis))
    if emp:
        q = q.filter(models.PontEnvoi.destinataire_hmac == emp)
    return q.count()


def verifier(session, app, emp: str, genre: str) -> tuple[bool, str, int]:
    """Autorise ou refuse un envoi. Renvoie (autorise, motif, secondes d'attente).

    L'ordre compte : on refuse d'abord ce qui ne doit jamais partir (arret
    demande), puis les plafonds, puis le lissage. Un appelant qui corrige la
    cause la plus grave en premier a un message d'erreur utile.
    """
    if est_bloque(session, app.id, emp):
        return False, "destinataire-desabonne", 0

    maintenant = datetime.utcnow()

    if genre == "otp" and _compter(session, app.id, maintenant - timedelta(hours=1), emp) >= OTP_PAR_HEURE:
        return False, "plafond-otp-destinataire", 3600

    if _compter(session, app.id, maintenant - timedelta(days=1)) >= (app.envois_par_jour or 0):
        return False, "plafond-journalier", 3600

    if _compter(session, app.id, maintenant - timedelta(hours=1)) >= (app.envois_par_heure or 0):
        return False, "plafond-horaire", 300

    # Lissage. Cinquante paiements encaisses a midi ne doivent pas produire
    # cinquante envois en dix secondes : c'est le motif d'automatisation le plus
    # visible, et l'etaler ne coute rien a personne.
    dernier = (session.query(models.PontEnvoi)
               .filter_by(app_id=app.id, statut="envoye")
               .order_by(models.PontEnvoi.id.desc()).first())
    intervalle = app.intervalle_min_s or 0
    if dernier and dernier.created_at and intervalle:
        ecoule = (maintenant - dernier.created_at).total_seconds()
        if ecoule < intervalle:
            return False, "trop-rapide", max(1, int(intervalle - ecoule) + 1)

    return True, "", 0


# --- Journal ---------------------------------------------------------------

def envoi_existant(session, app_id: int, idempotence: str):
    if not idempotence:
        return None
    return (session.query(models.PontEnvoi)
            .filter_by(app_id=app_id, idempotence_hmac=empreinte_idempotence(idempotence)).first())


def journaliser(session, app_id: int, idempotence: str, emp: str, genre: str,
                taille: int, statut: str, motif: str = ""):
    ligne = models.PontEnvoi(
        app_id=app_id, idempotence_hmac=empreinte_idempotence(idempotence),
        destinataire_hmac=emp, genre=genre, taille=taille, statut=statut, motif=motif,
    )
    session.add(ligne)
    try:
        session.commit()
    except Exception:
        # Course entre deux requetes portant la meme cle d'idempotence :
        # l'unicite a tranche, la premiere a gagne, il n'y a rien a reparer.
        session.rollback()
        return envoi_existant(session, app_id, idempotence)
    return ligne
