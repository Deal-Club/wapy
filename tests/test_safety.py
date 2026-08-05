import random
from safety.guards import (
    is_group, is_broadcast, detect_optout, detect_ban_warning, human_delay,
)


def test_is_group():
    assert is_group("120363000000000000@g.us") is True
    assert is_group("33612345678@c.us") is False


def test_is_broadcast():
    assert is_broadcast("status@broadcast") is True
    assert is_broadcast("33612345678@c.us") is False


def test_detect_optout_matches_keyword_case_insensitive():
    assert detect_optout("STOP merci") is True
    assert detect_optout("Je veux me désabonner") is True
    assert detect_optout("Vous êtes ouverts ce soir ?") is False


def test_detect_ban_warning():
    assert detect_ban_warning("You are sending too many messages") is True
    assert detect_ban_warning("Bonjour, une table pour 2 ?") is False


def test_human_delay_within_bounds():
    d = human_delay(random.Random(42))
    assert 3.0 <= d <= 8.0
