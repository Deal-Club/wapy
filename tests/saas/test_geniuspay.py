import hashlib
import hmac

from saas import geniuspay


def _sig(secret, data):
    return hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()


def test_verify_webhook_accepts_both_schemes():
    secret, ts, body = "whsec_x", "123", '{"event":"payment.success"}'
    # schéma doc webhook : HMAC(timestamp + "." + body)
    assert geniuspay.verify_webhook(secret, ts, body, _sig(secret, f"{ts}.{body}"))
    # schéma doc API : HMAC(body)
    assert geniuspay.verify_webhook(secret, ts, body, _sig(secret, body))


def test_verify_webhook_rejects_bad_or_missing():
    assert not geniuspay.verify_webhook("whsec_x", "123", "{}", "deadbeef")
    assert not geniuspay.verify_webhook("", "123", "{}", "anything")
    assert not geniuspay.verify_webhook("whsec_x", "123", "{}", "")


def test_create_payment_calls_api(monkeypatch):
    captured = {}

    class R:
        def raise_for_status(self):
            pass

        def json(self):
            return {"success": True, "data": {"reference": "MTX-1", "checkout_url": "https://pay/x", "status": "pending"}}

    def fake_post(url, headers, json, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return R()

    monkeypatch.setattr(geniuspay.requests, "post", fake_post)

    class _Cfg:
        api_key = "pk_x"
        api_secret = "sk_x"

    out = geniuspay.create_payment(_Cfg(), 15000, "Commande", {}, {"chat_id": "c@c.us"}, "https://ok", "https://ko")
    assert out["reference"] == "MTX-1" and out["url"] == "https://pay/x"
    assert captured["json"]["amount"] == 15000
    assert captured["headers"]["X-API-Key"] == "pk_x"
