import pytest
from cryptography.fernet import Fernet

from saas import connector, models


@pytest.fixture(autouse=True)
def _key(monkeypatch):
    monkeypatch.setenv("WAPY_FERNET_KEY", Fernet.generate_key().decode())


def test_encrypt_decrypt_roundtrip():
    assert connector.encryption_ready() is True
    c = connector.encrypt("secret-token")
    assert c and c != "secret-token"
    assert connector.decrypt(c) == "secret-token"


def test_validate_url_rejects_non_https_and_private(monkeypatch):
    ok, _ = connector.validate_url("http://example.com")
    assert ok is False
    # hôte qui résout en IP privée -> bloqué (anti-SSRF)
    monkeypatch.setattr(connector.socket, "getaddrinfo",
                        lambda *a, **k: [(2, 1, 6, "", ("127.0.0.1", 0))])
    ok, reason = connector.validate_url("https://intranet.local")
    assert ok is False and "privée" in reason.lower()
    # hôte public -> accepté
    monkeypatch.setattr(connector.socket, "getaddrinfo",
                        lambda *a, **k: [(2, 1, 6, "", ("8.8.8.8", 0))])
    ok, _ = connector.validate_url("https://api.example.com")
    assert ok is True


def test_fetch_truncates_and_uses_header(monkeypatch):
    monkeypatch.setattr(connector.socket, "getaddrinfo",
                        lambda *a, **k: [(2, 1, 6, "", ("8.8.8.8", 0))])
    captured = {}

    class _Raw:
        def read(self, n, decode_content=True):
            return b'{"stock": 5, "prix": "3000"}'

    class _Resp:
        status_code = 200
        raw = _Raw()

    def fake_get(url, headers=None, timeout=None, stream=None, allow_redirects=None):
        captured["url"] = url
        captured["headers"] = headers
        return _Resp()

    monkeypatch.setattr(connector.requests, "get", fake_get)
    out = connector.fetch("https://api.example.com/p", "X-Token", "abc", "cle 4pouces")
    assert "stock" in out
    assert captured["headers"]["X-Token"] == "abc"
    assert "q=cle+4pouces" in captured["url"]


def test_lookup_fn_and_fiche_note():
    dc = models.DataConnector(tenant_id=1, enabled=False, url="")
    assert connector.lookup_fn_for(dc) is None
    assert connector.fiche_note(dc) == ""
    dc.enabled = True
    dc.url = "https://api.example.com"
    dc.note = "stock produits"
    assert "Données en direct" in connector.fiche_note(dc)
    assert callable(connector.lookup_fn_for(dc))
