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
    assert "calendar.events" in url


def test_event_body_is_utc_with_computed_end():
    body = gcal._event_body("Coupe — Ali", datetime(2026, 8, 10, 9, 0, 0), 45, "note")
    assert body["start"]["dateTime"] == "2026-08-10T09:00:00Z"
    assert body["end"]["dateTime"] == "2026-08-10T09:45:00Z"
    assert body["summary"] == "Coupe — Ali" and body["description"] == "note"


def test_state_roundtrip_and_purpose_guard():
    tok = auth.sign_state(7, 3, "gcal")
    d = auth.verify_state(tok, "gcal")
    assert d["tid"] == 7 and d["uid"] == 3
    with pytest.raises(Exception):
        auth.verify_state(tok, "autre")
