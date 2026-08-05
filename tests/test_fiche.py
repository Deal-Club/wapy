from fiche.loader import flatten, FicheLoader


def test_flatten_contains_sections_and_values():
    text = flatten(
        infos=[["Nom", "Chez Léon"], ["Horaires", "12h-14h / 19h-22h"]],
        menu=[["Entrée", "Salade", "Verte", "8€", "végé"]],
        faq=[["Terrasse ?", "Oui, chauffée"]],
    )
    assert "Chez Léon" in text
    assert "12h-14h" in text
    assert "Salade" in text and "8€" in text
    assert "Terrasse ?" in text and "Oui, chauffée" in text


def test_ficheloader_caches_within_ttl():
    calls = {"n": 0}

    def reader():
        calls["n"] += 1
        return {"infos": [["Nom", "X"]], "menu": [], "faq": []}

    now = {"t": 100.0}
    loader = FicheLoader(reader, ttl_seconds=300, clock=lambda: now["t"])
    loader.load()
    loader.load()
    assert calls["n"] == 1  # 2e appel servi par le cache

    now["t"] = 500.0  # TTL dépassé
    loader.load()
    assert calls["n"] == 2  # rechargé
