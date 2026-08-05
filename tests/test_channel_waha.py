from channel.waha import WahaProvider


def _provider():
    return WahaProvider(base_url="http://waha:3000", session="default")


def test_parse_incoming_message():
    payload = {
        "event": "message",
        "session": "default",
        "payload": {"from": "33612345678@c.us", "fromMe": False, "body": "Bonjour"},
    }
    msg = _provider().parse_incoming(payload)
    assert msg is not None
    assert msg.chat_id == "33612345678@c.us"
    assert msg.text == "Bonjour"
    assert msg.from_me is False
    assert msg.is_group is False


def test_parse_incoming_group_flag():
    payload = {
        "event": "message",
        "payload": {"from": "123@g.us", "fromMe": False, "body": "hi"},
    }
    msg = _provider().parse_incoming(payload)
    assert msg.is_group is True


def test_parse_incoming_ignores_non_message_event():
    assert _provider().parse_incoming({"event": "session.status", "payload": {}}) is None


def test_parse_incoming_ignores_empty_body():
    payload = {"event": "message", "payload": {"from": "x@c.us", "fromMe": False, "body": ""}}
    assert _provider().parse_incoming(payload) is None


def test_send_text_posts_to_waha_with_api_key(monkeypatch):
    captured = {}

    def fake_post(url, json, headers, timeout):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers

        class R:
            status_code = 201

            def raise_for_status(self):
                pass

        return R()

    import channel.waha as waha
    monkeypatch.setattr(waha.requests, "post", fake_post)
    WahaProvider("http://waha:3000", "default", api_key="secret").send_text(
        "33612345678@c.us", "Bonjour !"
    )
    assert captured["url"] == "http://waha:3000/api/sendText"
    assert captured["json"] == {
        "session": "default",
        "chatId": "33612345678@c.us",
        "text": "Bonjour !",
    }
    assert captured["headers"] == {"X-Api-Key": "secret"}
