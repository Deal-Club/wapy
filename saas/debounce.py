"""Regroupement des messages envoyés en rafale.

Un client écrit rarement d'un bloc : « 15 au 25 », puis « Août », puis « 200
personnes ». Sans regroupement, chaque message déclenchait son propre cycle
complet — le bot répondait deux fois la même question, et deux threads lisaient
le même historique avant que l'un ait écrit sa réponse.

On attend donc quelques secondes après chaque message. Si un autre arrive
entre-temps, il rejoint le lot et l'attente repart ; seul le dernier message
déclenche le traitement, avec le texte complet.

Le délai varie selon le contenu : un fragment de trois mots annonce presque
toujours une suite, une phrase achevée par un point d'interrogation non.
"""
import asyncio
import copy

# Secondes d'attente avant de traiter. Bornes volontairement basses : au-delà,
# le client croit que personne ne l'écoute.
COURT, DEFAUT, LONG = 2.0, 4.0, 6.0

_FINS_EN_SUSPENS = (",", ":", ";", "…", "...", "-", "et", "ou")


def delai(texte: str) -> float:
    """Combien attendre après ce message avant de répondre."""
    t = (texte or "").strip()
    if not t:
        return DEFAUT
    # Message long : la personne a pris le temps d'écrire, elle a fini.
    if len(t) > 120:
        return COURT
    # Ponctuation terminale sur une phrase de taille suffisante : pensée close.
    if t.endswith(("?", "!", ".")) and len(t) >= 25:
        return COURT
    # Fin en suspens ou fragment très court : la suite arrive.
    if len(t) <= 15 or t.endswith(_FINS_EN_SUSPENS):
        return LONG
    return DEFAUT


def fusionner(payload: dict, textes: list) -> dict:
    """Charge utile portant le texte de tout le lot.

    On repart de la DERNIÈRE reçue : elle porte l'id le plus récent, celui que
    WAHA renverrait en cas de réémission, et c'est lui qui doit être marqué traité.
    """
    if not textes or len(textes) <= 1:
        return payload
    fusion = copy.deepcopy(payload)
    fusion.setdefault("payload", {})["body"] = "\n".join(textes)
    return fusion


class Regroupeur:
    """Tampon par conversation. Un seul lot en vol par conversation à la fois.

    `dormir` est injectable pour que les tests n'attendent pas réellement.
    """

    def __init__(self, dormir=asyncio.sleep, delai_fn=delai, echelle: float = 1.0):
        self._dormir = dormir
        self._delai = delai_fn
        # `echelle=0` supprime l'attente : la suite de tests traverse le vrai
        # chemin webhook sans payer 6 s par message.
        self._echelle = float(echelle)
        self._textes: dict = {}
        # Jeton du dernier arrivant : celui qui le détient encore après l'attente
        # est le seul à traiter le lot. Les autres se retirent.
        self._jetons: dict = {}

    async def soumettre(self, cle, texte: str, executer, avant_attente=None):
        """Ajoute `texte` au lot de `cle` puis, si aucun message plus récent n'est
        arrivé pendant l'attente, appelle `executer(textes)` avec le lot entier.

        Renvoie `{"status": "regroupe"}` pour les messages absorbés par un suivant.
        """
        self._textes.setdefault(cle, []).append(texte)
        jeton = object()
        self._jetons[cle] = jeton
        if avant_attente is not None:
            try:
                avant_attente()
            except Exception:
                pass   # l'indicateur « écrit… » ne doit jamais bloquer une réponse
        await self._dormir(self._echelle * self._delai(texte))
        if self._jetons.get(cle) is not jeton:
            return {"status": "regroupe"}
        textes = self._textes.pop(cle, [])
        self._jetons.pop(cle, None)
        return await executer(textes)
