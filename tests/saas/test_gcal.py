import os
from datetime import datetime

import pytest

from saas import auth, gcal


@pytest.fixture(autouse=True)
def _oauth_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_ID", "cid.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_SECRET", "secret")
    monkeypatch.setenv("PUBLIC_URL", "https://app.example.com")


def test_enabled_requires_both_creds(monkeypatch):
    assert gcal.enabled() is True
    monkeypatch.delenv("GOOGLE_OAUTH_CLIENT_SECRET")
    assert gcal.enabled() is False


def test_auth_url_carries_offline_consent_and_state():
    url = gcal.auth_url("STATE123")
    assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    assert "access_type=offline" in url and "prompt=consent" in url
    assert "state=STATE123" in url
    assert "redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fgoogle%2Fcallback" in url


def test_auth_url_only_asks_for_non_sensitive_scopes():
    """`calendar.app.created` évite la validation Google (scope non sensible).

    `calendar.events` est sensible : le demander déclenche l'écran « application
    non validée » et plafonne le projet à 100 utilisateurs à vie.
    """
    url = gcal.auth_url("S")
    assert "calendar.app.created" in url
    assert "userinfo.email" in url
    assert "calendar.events" not in url


def test_auth_url_does_not_reclaim_previously_granted_scopes():
    """Sans ce garde-fou, Google réinjecte le `calendar.events` déjà consenti
    par les établissements connectés avant la bascule — et l'écran revient."""
    assert "include_granted_scopes" not in gcal.auth_url("S")


def test_event_body_is_utc_with_computed_end():
    body = gcal._event_body("Coupe — Ali", datetime(2026, 8, 10, 9, 0, 0), 45, "note")
    assert body["start"]["dateTime"] == "2026-08-10T09:00:00Z"
    assert body["end"]["dateTime"] == "2026-08-10T09:45:00Z"
    assert body["summary"] == "Coupe — Ali" and body["description"] == "note"


class _Reponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class _Appels:
    """Enregistre les appels HTTP sortants au lieu de les émettre."""

    def __init__(self, payload=None):
        self.payload = payload or {}
        self.post = []
        self.get = []
        self.delete = []

    def installer(self, monkeypatch):
        def _post(url, **kw):
            self.post.append((url, kw))
            return _Reponse(self.payload)

        def _get(url, **kw):
            self.get.append((url, kw))
            return _Reponse(self.payload)

        def _delete(url, **kw):
            self.delete.append((url, kw))
            return _Reponse({})

        monkeypatch.setattr(gcal.requests, "post", _post)
        monkeypatch.setattr(gcal.requests, "get", _get)
        monkeypatch.setattr(gcal.requests, "delete", _delete)
        return self


def test_create_calendar_cree_un_agenda_dedie(monkeypatch):
    appels = _Appels({"id": "abc123@group.calendar.google.com"}).installer(monkeypatch)
    cid = gcal.create_calendar("TOK", "Wapy — Réservations")
    assert cid == "abc123@group.calendar.google.com"
    url, kw = appels.post[0]
    assert url == f"{gcal.CAL_API}/calendars"
    assert kw["json"]["summary"] == "Wapy — Réservations"
    assert kw["headers"]["Authorization"] == "Bearer TOK"


def test_user_email_lit_le_profil(monkeypatch):
    appels = _Appels({"email": "resto@gmail.com"}).installer(monkeypatch)
    assert gcal.user_email("TOK") == "resto@gmail.com"
    assert appels.get[0][0] == gcal.USERINFO_URI


def test_create_event_vise_l_agenda_dedie(monkeypatch):
    appels = _Appels({"id": "evt1"}).installer(monkeypatch)
    monkeypatch.setattr(gcal, "access_token", lambda _rt: "TOK")
    eid = gcal.create_event("RT", "abc123@group.calendar.google.com", "RDV",
                            datetime(2026, 8, 10, 9, 0, 0), 30)
    assert eid == "evt1"
    assert "abc123%40group.calendar.google.com/events" in appels.post[0][0]


def test_create_event_refuse_sans_agenda(monkeypatch):
    """`primary` est hors de portée du scope `app.created` : pas de repli muet."""
    appels = _Appels({"id": "evt1"}).installer(monkeypatch)
    monkeypatch.setattr(gcal, "access_token", lambda _rt: "TOK")
    assert gcal.create_event("RT", "", "RDV", datetime(2026, 8, 10, 9, 0, 0), 30) == ""
    assert appels.post == []


def test_state_roundtrip_and_purpose_guard():
    tok = auth.sign_state(7, 3, "gcal")
    d = auth.verify_state(tok, "gcal")
    assert d["tid"] == 7 and d["uid"] == 3
    with pytest.raises(Exception):
        auth.verify_state(tok, "autre")
