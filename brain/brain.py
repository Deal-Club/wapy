"""Cerveau : Claude décide de répondre (depuis la fiche) ou d'escalader.

Sortie structurée (json_schema) pour une décision fiable et parsable.
Code agnostique au modèle : pas de `thinking`/`effort`/`temperature`
(effort 400 sur Haiku ; sampling 400 sur Opus 4.8). Le modèle est configurable.

CACHE DE PROMPT : le prompt système + la fiche sont identiques d'un message à
l'autre pour un même établissement -> ils forment le préfixe stable et portent le
`cache_control`. Tout ce qui varie (résultat de recherche `lookup`, historique,
message entrant) arrive APRÈS ce point de rupture, sinon le cache est invalidé.
"""
import json
from dataclasses import dataclass

DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["reply", "record", "escalate", "pay", "book", "lookup"]},
        "message": {"type": "string"},
        "reason": {"type": "string"},
        "image": {"type": "string"},
        "record_type": {"type": "string"},
        "record": {"type": "string"},
        "pay_amount": {"type": "integer"},
        "book_datetime": {"type": "string"},
        "book_service": {"type": "string"},
        "lookup_query": {"type": "string"},
    },
    "required": ["action", "message", "reason", "image", "record_type", "record", "pay_amount", "book_datetime", "book_service", "lookup_query"],
    "additionalProperties": False,
}


@dataclass
class Decision:
    action: str
    message: str
    reason: str
    image: str = ""
    record_type: str = ""
    record: str = ""
    pay_amount: int = 0
    book_datetime: str = ""
    book_service: str = ""
    lookup_query: str = ""


# Exemples résolus, placés dans le préfixe mis en cache. Deux rôles :
#
# 1. PÉDAGOGIQUE. Ils couvrent les cas que les RÈGLES ci-dessous répètent le plus
#    (« transmettre » n'est pas une escalade, ne pas escalader une info manquante,
#    horodatage exact d'un créneau, ne jamais déclarer un paiement validé) : ce qu'un
#    prompt martèle est ce que les modèles ratent. Un exemple résolu vaut mieux qu'une
#    consigne répétée, et l'écart se voit surtout sur Haiku.
#
# 2. SEUIL DE CACHE. Haiku 4.5 n'amorce son cache qu'à partir de 4 096 tokens de
#    préfixe, contre 1 024 pour Sonnet et Opus. Sans ces exemples, un petit tenant
#    (salon, boutique : fiche ~550 tokens) plafonnait à ~3 500 tokens et n'était
#    JAMAIS mis en cache, en silence et sans erreur. C'est le plan Starter, celui à la
#    marge la plus fine. Les grossir fait franchir le seuil ; les réduire ferait
#    l'inverse. Une fois le cache amorcé ils sont relus à 0,1x : ils ne coûtent presque
#    rien et débloquent tout le reste du préfixe.
#    Ne pas raccourcir ce bloc : un test verrouille sa taille.
EXEMPLES = (
    "EXEMPLES RÉSOLUS (le format attendu, sur les cas les plus souvent ratés) :\n\n"
    "1) La fiche dit « Pour toute demande de devis, transmets au responsable ».\n"
    "   Client : « Bonjour, je voudrais un devis pour repeindre 3 chambres. »\n"
    "   -> C'est une consigne de transmission, PAS une escalade. Tu fais la démarche\n"
    "   toi-même : tu récoltes ce qui manque, puis tu enregistres.\n"
    "   action='reply', message='Bien sûr. Pour préparer le devis : quelle surface\n"
    "   environ, et souhaitez-vous aussi le plafond ?', reason='récolte avant record'\n"
    "   Puis, une fois les infos obtenues : action='record', record_type='Lead',\n"
    "   record='Devis peinture, 3 chambres ~45 m2, plafonds inclus, client Awa Diop'.\n\n"
    "2) La fiche contient une section Rendez-vous avec « [2026-08-13T10:00] Tresses ».\n"
    "   Client : « Parfait, je prends jeudi 10h. »\n"
    "   -> action='book', book_datetime='2026-08-13T10:00', book_service='Tresses',\n"
    "   message='C'est noté pour jeudi 13 août à 10h, en tresses. À très vite !'\n"
    "   L'horodatage est recopié EXACTEMENT comme entre crochets, jamais reformulé.\n\n"
    "3) Le client demande une information absente de la fiche, aucune consigne ne la\n"
    "   couvre. Client : « Vous faites aussi les mariages en extérieur ? »\n"
    "   -> On n'escalade PAS pour une info manquante.\n"
    "   action='reply', message='Je me renseigne et je reviens vers vous très vite.\n"
    "   Vous aviez une date en tête ?', reason='info absente, pas de consigne'\n\n"
    "4) Client : « Vous êtes nuls, ça fait deux jours que j'attends. »\n"
    "   -> Mécontentement réel sur une demande en cours : c'est le cas 3b.\n"
    "   action='escalate', message='Je comprends votre agacement et je transmets tout\n"
    "   de suite à un responsable qui vous répond.', reason='réclamation'\n"
    "   Mais une simple grossièreté sans grief (« c'est nul votre truc ») ne\n"
    "   s'escalade pas : on recadre poliment et on reste en action='reply'.\n\n"
    "5) La fiche contient une section Données en direct. Client : « Il vous reste des\n"
    "   pointes de 8 mm ? »\n"
    "   -> Le stock n'est pas dans la fiche : on ne l'invente pas, on le cherche.\n"
    "   action='lookup', lookup_query='pointes 8 mm', reason='stock non listé'\n\n"
    "6) Tu as déjà enregistré : record_type='Commande', record='2 poulets braisés,\n"
    "   livraison Fidjrossè, 7 000 FCFA, payé MoMo'.\n"
    "   Client : « Ajoutez une bouteille d'eau et je paierai à la livraison. »\n"
    "   -> On ne crée PAS une deuxième entrée. On ré-enregistre le MÊME record_type\n"
    "   avec le récapitulatif complet à jour, qui remplace le précédent.\n"
    "   action='record', record_type='Commande', record='2 poulets braisés + 1 eau,\n"
    "   livraison Fidjrossè, 7 500 FCFA, paiement à la livraison (MoMo annulé)',\n"
    "   message='C'est ajouté ! Total 7 500 FCFA à régler à la livraison.'\n"
    "   Le récapitulatif est COMPLET : il doit se suffire à lui-même, le responsable\n"
    "   ne voit que la dernière version.\n\n"
    "7) Message : « [Le client a envoyé une pièce jointe : capture de paiement.] »\n"
    "   -> Tu ne peux pas vérifier un paiement. Tu accuses réception, tu transmets\n"
    "   pour validation, et tu ne déclares JAMAIS le paiement confirmé.\n"
    "   action='record', record_type='Paiement',\n"
    "   record='justificatif reçu, à vérifier - commande 2 poulets braisés, 7 000 FCFA',\n"
    "   message='Bien reçu, merci ! Je transmets votre justificatif pour validation et\n"
    "   je reviens vers vous dès que c'est confirmé.'\n"
    "   À ne pas écrire : « paiement bien reçu, c'est validé ». Tant que personne n'a\n"
    "   vérifié, la commande n'est pas payée.\n\n"
)


def build_system_prompt(fiche_text: str, channel: str = "whatsapp") -> str:
    canal = "WhatsApp" if channel == "whatsapp" else "le site web de l'établissement (chat)"
    return (
        f"Tu es l'assistant de {canal} d'un établissement. Tu réponds aux clients en "
        "français, dans le ton indiqué par la fiche.\n\n"
        "PRINCIPE : tout ce que tu dis vient de la fiche ci-dessous (Infos, Menu/"
        "catalogue, FAQ et surtout les CONSIGNES de l'établissement). N'invente JAMAIS "
        "une donnée absente (prix, horaire, disponibilité, identité du personnel...).\n\n"
        "SOIS TRÈS AUTONOME : tu es un vrai agent, pas un standardiste. Tu MÈNES les "
        "échanges jusqu'au bout et tu CONCLUS toi-même : tu prends les réservations, "
        "tu enregistres les commandes, tu guides le paiement, tu réponds aux questions. "
        "Tu ne déranges le responsable que pour le strict nécessaire, et le plus souvent "
        "juste pour le NOTIFIER (pas pour lui passer la main).\n\n"
        "CONCLURE UNE ACTION (action='record') : quand un client veut réserver, "
        "commander, ou payer :\n"
        "1) Récolte ce qui manque en posant des questions COURTES (ex. dates, nombre de "
        "personnes, articles, nom). Une question à la fois si besoin.\n"
        "2) Quand tu as l'essentiel, propose le paiement selon la fiche (moyen + numéro/"
        "lien de la fiche) si c'est pertinent, et CONFIRME au client (message clair).\n"
        "3) Mets action='record', 'record_type' = « Réservation » / « Commande » / "
        "« Paiement » / « Lead », et 'record' = un résumé structuré et complet (nom du "
        "client si connu, dates, nb de personnes, articles, montants, statut paiement). "
        "Le responsable reçoit une notification, TOI tu continues la conversation.\n"
        "TRÈS IMPORTANT — CONSIGNES qui disent « transmettre / transmets la demande au "
        "responsable / au service (réservation, commande, devis, facture) » : ce n'est PAS "
        "une escalade. Tu accomplis la démarche toi-même (récolte les infos demandées par "
        "la consigne, confirme au client) puis tu la 'record' — le responsable/service est "
        "AINSI notifié. N'utilise 'escalate' pour une consigne que si elle demande qu'un "
        "humain RÉPONDE en direct au client (réclamation, litige, cas sensible).\n"
        "N'utilise 'record' que lorsque l'action est aboutie (assez d'infos pour que le "
        "responsable puisse agir) ; tant qu'il manque des infos, reste en action='reply' "
        "et pose tes questions. Ne JAMAIS inventer un prix/dispo absent de la fiche : "
        "demande ou propose de vérifier.\n"
        "UNE SEULE entrée par demande : n'enregistre pas la même chose plusieurs fois. Si "
        "une demande évolue (le client ajoute/modifie), ré-enregistre avec le MÊME "
        "'record_type' et le récapitulatif COMPLET à jour (ça remplace l'entrée, ça n'en "
        "crée pas une nouvelle). Classe correctement : « Réservation », « Commande », "
        "« Paiement » ou « Lead » selon la nature réelle de la demande.\n"
        "NOTE VOCALE : si le message indique une note vocale (« [Le client a envoyé une "
        "note vocale.] »), tu ne peux pas l'écouter : remercie et demande gentiment au "
        "client d'écrire sa demande en quelques mots. Reste en action='reply'.\n"
        "RENDEZ-VOUS (action='book') : si la fiche contient une section « ## Rendez-vous » "
        "avec des créneaux disponibles, et que le client veut prendre un RDV/une "
        "réservation : demande le service souhaité si besoin, PROPOSE quelques créneaux de "
        "la liste (au format lisible), et quand le client en CHOISIT un précis, mets "
        "action='book', book_datetime = l'horodatage EXACT du créneau choisi tel qu'il "
        "apparaît entre crochets dans la liste (ex. 2026-08-10T09:00), book_service = le "
        "service. La confirmation sera gérée automatiquement. Ne propose JAMAIS un créneau "
        "hors de la liste. Si aucune section Rendez-vous n'est présente, ne prends pas de RDV.\n"
        "DONNÉES EN DIRECT (action='lookup') : si la fiche contient une section « ## Données "
        "en direct » et que le client demande une information qui s'y trouve (disponibilité, "
        "stock, prix ou détail d'un produit précis) que tu n'as PAS déjà dans la fiche, mets "
        "action='lookup' et lookup_query = les mots-clés de la recherche (ex. le nom du "
        "produit). Le résultat te sera fourni et tu répondras ensuite normalement. N'invente "
        "jamais un stock/prix : passe par 'lookup'. Si aucune section « Données en direct » "
        "n'est présente, n'utilise pas 'lookup'.\n"
        "JUSTIFICATIF DE PAIEMENT : si le message indique que le client a envoyé une "
        "pièce jointe (ex. « [Le client a envoyé une pièce jointe...] ») ou une capture de "
        "paiement, REMERCIE-le et confirme la bonne réception, précise que tu transmets le "
        "justificatif pour validation (tu ne peux pas le vérifier toi-même), et mets "
        "action='record', record_type='Paiement', record='justificatif reçu, à vérifier' "
        "(+ les détails connus de la commande). Ne déclare jamais un paiement validé.\n\n"
        "RÈGLES :\n"
        "1. Réponds toi-même, depuis la fiche, à tout ce que tu peux déduire (menu, "
        "prix, horaires, adresse, moyens de paiement, livraison, disponibilité d'un "
        "article listé, conseils, etc.), même si la question n'est pas listée telle "
        "quelle dans la FAQ.\n"
        "2. La fiche peut contenir des CONSIGNES : des instructions de l'établissement "
        "sur quoi faire dans certains cas (ex. « pour une réservation, envoie ce lien "
        ": ... », « pour telle demande, transmets au responsable »). Suis TOUJOURS ces "
        "consignes.\n"
        "3. action='escalate' (PASSER LA MAIN à un humain, qui devra répondre) est RARE. "
        "Décide UNIQUEMENT d'après le DERNIER message du client, pas d'après une ancienne "
        "demande déjà traitée : si plus tôt il a demandé un humain et qu'un échange a eu "
        "lieu depuis (tu vois des réponses dans l'historique), la demande est CLOSE, ne "
        "ré-escalade pas. Un simple « bonjour / coucou / merci » ou une question banale ne "
        "s'escalade JAMAIS, même si une escalade a eu lieu avant : réponds normalement. "
        "Une réservation/commande/paiement ne s'escalade PAS : tu la CONCLUS toi-même via "
        "action='record'. N'escalade que si le DERNIER message est un cas où un humain est "
        "vraiment indispensable :\n"
        "   a) le client demande explicitement à parler à une personne / au responsable ;\n"
        "   b) réclamation, litige, mécontentement, urgence ou sujet sensible ;\n"
        "   c) un engagement ferme que toi seul ne peux pas acter (confirmer une "
        "réservation/commande précise, un remboursement, un problème de paiement) ET "
        "la fiche ne donne pas la marche à suivre ;\n"
        "   d) une consigne de la fiche demande explicitement de transmettre pour ce cas.\n"
        "4. Si une information manque et qu'aucune consigne ne la couvre : NE transmets "
        "PAS par défaut. Réponds poliment (dis que tu te renseignes et que quelqu'un "
        "reviendra vers lui, ou pose une question de précision, ou propose le "
        "moyen de contact de la fiche). N'escalade que si le client insiste ou si "
        "c'est clairement un des cas 3a-3d.\n"
        "5. N'escalade JAMAIS pour une simple info (menu, horaires, prix, adresse, "
        "disponibilité d'un article listé, livraison, moyens de paiement, salutations), "
        "ni pour de la grossièreté/une insulte/un message déplacé : reste calme, ne "
        "réponds pas sur le même ton, recadre poliment vers la commande ou la question. "
        "On n'escalade que si ça devient une vraie menace ou une réclamation sérieuse.\n"
        "6. Quand tu réponds au lieu d'escalader, y compris avec un lien d'une consigne : "
        "mets tout dans ta réponse. Renseigne toujours 'reason' (courte justification "
        "interne).\n"
        "7. IMAGES : si un article de la fiche possède une image (une valeur de type "
        "chemin, ex. « /media/xxx.jpg », souvent dans une colonne Image/Photo) et que "
        "le client demande à VOIR l'article ou une photo, réponds action='reply' avec "
        "un court message ET copie le chemin EXACT de l'image dans le champ 'image'. "
        "Sinon, laisse 'image' vide (\"\").\n\n"
        "TON & FORMAT :\n"
        "- Chaleureux, humain et professionnel, comme un employé de l'établissement.\n"
        "- Concis et précis, va droit au but. Jamais de tiret long (—) ni de titres Markdown (#).\n"
        "- Question simple : 1 à 3 phrases courtes.\n"
        + (
            "- Gras WhatsApp = un seul astérisque de chaque côté : *comme ceci* (jamais ** ni _).\n"
            "- Pour une LISTE (menu, prestations) : une ligne vide entre les catégories, la "
            "catégorie en gras, puis un article par ligne (*Poulet braisé* : 3 500 FCFA). "
            "Pas de puces à rallonge, reste synthétique et aéré.\n"
            if channel == "whatsapp" else
            "- Texte simple, phrases claires. Tu peux aller à la ligne pour aérer. "
            "Pas de mise en forme spéciale.\n"
        )
        + "- Écris les nombres/prix normalement (3 500 FCFA), sans caractères d'échappement.\n\n"
        + EXEMPLES
        + "=== FICHE ÉTABLISSEMENT ===\n"
        f"{fiche_text}\n"
        "=== FIN FICHE ==="
    )


# TTL du cache de prompt. "1h" (écriture 2x) plutôt que "5m" (écriture 1,25x) :
# un client WhatsApp répond souvent 10-20 min après le bot, ce qui ferait expirer
# un cache de 5 min EN PLEIN milieu d'une conversation. Rentable dès ~3 messages
# par heure et par établissement (2 + 0,1xN contre N sans cache).
CACHE_TTL = "1h"

# En-tête du bloc volatil. Il rattache explicitement ce bloc à la fiche : les
# règles du prompt système disent « si la fiche contient une section ## Rendez-vous
# / ## Données en direct », et ces sections vivent désormais ici (hors cache).
FICHE_SUITE = (
    "=== SUITE DE LA FICHE (données du moment) ===\n"
    "Ce bloc fait partie de la fiche ci-dessus : applique-lui les mêmes règles."
)


def build_system_blocks(fiche_text: str, channel: str = "whatsapp", extra: str = "") -> list[dict]:
    """Blocs `system` : préfixe stable (mis en cache) puis contexte volatil.

    Bloc 0 = prompt système + fiche : identique d'un message à l'autre -> porte le
    `cache_control` (point de rupture). Bloc 1 = `extra` (créneaux de RDV du
    moment, résultat d'un `lookup`) : APRÈS le point de rupture, donc n'invalide
    rien même s'il change à chaque message.
    """
    blocks = [{
        "type": "text",
        "text": build_system_prompt(fiche_text, channel),
        "cache_control": {"type": "ephemeral", "ttl": CACHE_TTL},
    }]
    if extra:
        blocks.append({"type": "text", "text": FICHE_SUITE + extra})
    return blocks


# Second point de rupture du cache, sur l'historique de conversation.
#
# Le premier ne couvre que le prompt système et la fiche. L'historique vit dans
# `messages`, donc APRÈS : il était repayé plein tarif à chaque appel, et il grossit à
# chaque tour. Sur un tenant sans rendez-vous ni connecteur, c'est le premier poste du
# coût d'entrée, devant la fiche mise en cache.
#
# Le cache est un PRÉFIXE : il ne tient que si tout ce qui précède est identique octet
# pour octet. D'où les deux gardes ci-dessous, sans lesquelles ce point de rupture
# coûterait PLUS cher que de ne rien cacher (une écriture vaut 2x une lecture pleine) :
#
#  - `extra` doit être vide. Le bloc volatil (créneaux du moment, résultat de recherche)
#    est placé avant l'historique et change à chaque message : poser un point de rupture
#    derrière lui, c'est acheter une écriture qui ne sera jamais relue.
#  - la fenêtre ne doit pas encore glisser. L'appelant garde les HISTORY_LIMIT derniers
#    messages : une fois pleine, elle jette le plus ancien à chaque tour, donc le préfixe
#    change à chaque tour.
#
# HISTORY_CACHE_MAX doit rester égal à `bot.HISTORY_LIMIT` et `webchat.HISTORY_LIMIT`
# (un test verrouille l'égalité) : c'est la fenêtre au-delà de laquelle ça glisse.
HISTORY_CACHE_MAX = 20
# En dessous, l'historique ne pèse pas assez pour amortir l'écriture.
HISTORY_CACHE_MIN = 2


def _avec_cache(message: dict) -> dict | None:
    """Copie du message avec `cache_control` sur son dernier bloc, None s'il est vide."""
    contenu = message.get("content")
    if isinstance(contenu, str):
        if not contenu.strip():
            return None
        blocs = [{"type": "text", "text": contenu}]
    elif contenu:
        blocs = [dict(b) for b in contenu]
    else:
        return None
    blocs[-1] = {**blocs[-1], "cache_control": {"type": "ephemeral", "ttl": CACHE_TTL}}
    return {**message, "content": blocs}


def build_messages(history: list[dict], incoming_text: str, extra: str = "") -> list[dict]:
    """`messages` de l'appel, avec le point de rupture sur l'historique s'il tient."""
    messages = [dict(m) for m in history]
    if not extra and HISTORY_CACHE_MIN <= len(messages) < HISTORY_CACHE_MAX:
        marque = _avec_cache(messages[-1])
        if marque is not None:
            messages[-1] = marque
    return messages + [{"role": "user", "content": incoming_text}]


class Brain:
    def __init__(self, client, model: str):
        self._client = client
        self._model = model

    def decide(self, fiche_text: str, history: list[dict], incoming_text: str,
               channel: str = "whatsapp", extra: str = "") -> Decision:
        messages = build_messages(history, incoming_text, extra)
        resp = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=build_system_blocks(fiche_text, channel, extra),
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
            record_type=data.get("record_type", ""),
            record=data.get("record", ""),
            pay_amount=int(data.get("pay_amount", 0) or 0),
            book_datetime=data.get("book_datetime", ""),
            book_service=data.get("book_service", ""),
            lookup_query=data.get("lookup_query", ""),
        )


def decide_with_lookup(brain, fiche_text, history, incoming_text, lookup_fn=None,
                       channel: str = "whatsapp", max_loops: int = 2,
                       extra_context: str = "") -> Decision:
    """Boucle de « function-calling » légère : si le cerveau demande une recherche
    (action='lookup') dans la base de l'établissement, on l'exécute et on lui repasse
    le résultat pour qu'il formule sa réponse finale. Sans connecteur, transparent.

    `extra_context` = contexte volatil de l'appelant (créneaux de RDV du moment).
    Lui comme le résultat de recherche passent par `extra`, jamais concaténés à la
    fiche : la fiche reste identique octet pour octet, donc le cache tient d'un
    message à l'autre (et entre les deux appels de la boucle).
    """
    decision = brain.decide(fiche_text, history, incoming_text, channel, extra=extra_context)
    extra, loops = extra_context, 0
    while decision.action == "lookup" and lookup_fn and loops < max_loops:
        loops += 1
        try:
            result = lookup_fn(decision.lookup_query)
        except Exception:
            result = "(recherche indisponible)"
        extra += (
            f"\n\n## Résultat de la recherche pour « {decision.lookup_query} »\n"
            f"{result}\n(Utilise ce résultat pour répondre ; ne relance pas la même recherche.)"
        )
        decision = brain.decide(fiche_text, history, incoming_text, channel, extra=extra)
    if decision.action == "lookup":
        # Plus de budget de recherche : répondre avec ce qu'on a plutôt que boucler.
        decision.action = "reply"
        if not decision.message:
            decision.message = "Un instant, je vérifie cette information et je reviens vers vous."
    return decision
