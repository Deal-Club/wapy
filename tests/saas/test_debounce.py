import asyncio

from saas.debounce import Regroupeur, delai, COURT, DEFAUT, LONG


def test_delai_long_sur_un_fragment():
    """« 15 au 25 », « Août », « 200 personnes » : le client écrit en rafale,
    la suite arrive dans la seconde. On attend."""
    assert delai("15 au 25") == LONG
    assert delai("Août") == LONG
    assert delai("200 personnes") == LONG


def test_delai_court_sur_une_phrase_achevee():
    assert delai("Il y a un créneau libre de rendez-vous ?") == COURT
    assert delai("x" * 130) == COURT


def test_delai_long_sur_une_phrase_en_suspens():
    assert delai("Je voudrais réserver pour,") == LONG
    assert delai("Voici mes disponibilités :") == LONG


def test_delai_par_defaut():
    assert delai("Bonsoir je veux un rdv.") == DEFAUT


def _lancer(coro):
    return asyncio.run(coro)


def test_regroupe_les_messages_rapproches():
    """Deux messages en rafale ne doivent produire qu'UN seul appel au cerveau,
    portant les deux textes — au lieu de deux réponses redondantes."""
    appels = []

    async def scenario():
        r = Regroupeur(dormir=_dormir_immediat())

        async def executer(textes):
            appels.append(textes)
            return {"status": "replied"}

        t1 = asyncio.create_task(r.soumettre("c1", "200 personnes", executer))
        await asyncio.sleep(0)
        t2 = asyncio.create_task(r.soumettre("c1", "Chambre de luxe", executer))
        return await asyncio.gather(t1, t2)

    r1, r2 = _lancer(scenario())
    assert appels == [["200 personnes", "Chambre de luxe"]]
    assert r1 == {"status": "regroupe"}      # le premier cède la main
    assert r2 == {"status": "replied"}


def test_conversations_distinctes_ne_se_melangent_pas():
    appels = []

    async def scenario():
        r = Regroupeur(dormir=_dormir_immediat())

        async def executer(textes):
            appels.append(textes)
            return {"status": "replied"}

        return await asyncio.gather(
            r.soumettre("c1", "bonjour", executer),
            r.soumettre("c2", "salut", executer),
        )

    _lancer(scenario())
    assert sorted(appels) == [["bonjour"], ["salut"]]


def test_indicateur_ecriture_declenche_avant_l_attente():
    vus = []

    async def scenario():
        r = Regroupeur(dormir=_dormir_immediat())

        async def executer(textes):
            return {"status": "replied"}

        await r.soumettre("c1", "bonjour", executer, avant_attente=lambda: vus.append("typing"))

    _lancer(scenario())
    assert vus == ["typing"]


def _dormir_immediat():
    """Remplace l'attente réelle par un simple passage de main à la boucle :
    les tests restent instantanés tout en conservant l'ordonnancement."""
    async def _d(_secondes):
        await asyncio.sleep(0)
        await asyncio.sleep(0)
    return _d


def test_fusionner_conserve_la_derniere_charge_utile():
    """L'id de la dernière est gardé : c'est celui que WAHA réémettrait, donc
    celui qui doit être marqué traité."""
    from saas.debounce import fusionner
    charge = {"event": "message",
              "payload": {"from": "c@c.us", "body": "Chambre de luxe", "id": "m2"}}
    f = fusionner(charge, ["200 personnes", "Chambre de luxe"])
    assert f["payload"]["body"] == "200 personnes\nChambre de luxe"
    assert f["payload"]["id"] == "m2"
    assert charge["payload"]["body"] == "Chambre de luxe"   # original intact


def test_fusionner_ne_touche_a_rien_pour_un_seul_message():
    from saas.debounce import fusionner
    charge = {"payload": {"body": "bonjour"}}
    assert fusionner(charge, ["bonjour"]) is charge
