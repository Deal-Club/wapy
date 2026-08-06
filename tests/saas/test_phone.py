from saas import phone


def test_to_jid_appends_cus():
    assert phone.to_jid("22961040461") == "22961040461@c.us"


def test_to_jid_keeps_leading_zero_benin():
    # au Bénin le 01 fait partie du numéro : on ne le retire pas
    assert phone.to_jid("01 61 04 04 61", "229") == "2290161040461@c.us"


def test_to_jid_local_without_country_prepends_dialcode():
    assert phone.to_jid("61040461", "229") == "22961040461@c.us"


def test_candidate_jids_benin_keeps_leading_zero_variant():
    # variante gardant le 0 = celle qui délivre (l'ancien strip la supprimait -> pas d'OTP)
    c = phone.candidate_jids("0161040461", "229")
    assert "2290161040461@c.us" in c
    assert len(c) >= 2  # + une variante sans le 0 de tête


def test_candidate_jids_france_trunk_zero():
    c = phone.candidate_jids("06 12 34 56 78", "33")
    assert "33612345678@c.us" in c  # variante sans le 0 (la vraie ligne FR)


def test_candidate_jids_already_full():
    assert phone.candidate_jids("229 01 61 04 04 61", "229") == ["2290161040461@c.us"]


def test_candidate_jids_passthrough_jid():
    assert phone.candidate_jids("198406064615659@lid") == ["198406064615659@lid"]


def test_to_jid_keeps_number_already_including_dialcode():
    assert phone.to_jid("229 01 61 04 04 61", "229") == "2290161040461@c.us"


def test_to_jid_passthrough_existing_jid():
    assert phone.to_jid("198406064615659@lid") == "198406064615659@lid"
    assert phone.to_jid("22961040461@c.us") == "22961040461@c.us"


def test_to_jid_empty():
    assert phone.to_jid("") == ""
    assert phone.to_jid("   ") == ""


def test_to_jids_csv_normalises_and_dedupes():
    out = phone.to_jids_csv("61040461, 61040461 , 62000000", "229")
    assert out == "22961040461@c.us,22962000000@c.us"


def test_mask():
    assert phone.mask("22961040461@c.us") == "+229…0461"
