from saas import phone


def test_to_jid_appends_cus():
    assert phone.to_jid("22961040461") == "22961040461@c.us"


def test_to_jid_with_dialcode_and_trunk_zero():
    # numéro local avec 0 de tête + indicatif -> E.164
    assert phone.to_jid("06 12 34 56 78", "33") == "33612345678@c.us"


def test_to_jid_local_without_country_prepends_dialcode():
    assert phone.to_jid("61040461", "229") == "22961040461@c.us"


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
