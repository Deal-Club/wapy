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


def test_parse_incoming_media_classifies_by_mimetype_and_rewrites_host():
    payload = {
        "event": "message",
        "payload": {"from": "c@c.us", "fromMe": False, "body": "", "hasMedia": True,
                    "media": {"url": "http://localhost:3000/api/files/x.oga", "mimetype": "audio/ogg; codecs=opus"},
                    "id": "m1"},
    }
    msg = _provider().parse_incoming(payload)  # base_url = http://waha:3000
    assert msg is not None
    # host réécrit vers le host interne (WAHA renvoie localhost)
    assert msg.media_url == "http://waha:3000/api/files/x.oga"
    assert msg.media_type == "audio/ogg"
    assert "note vocale" in msg.text  # classé par mimetype, pas "pièce jointe"


def test_parse_incoming_reads_quoted_id():
    payload = {
        "event": "message",
        "payload": {"from": "s@c.us", "body": "ok", "replyTo": "alertX", "id": "r1"},
    }
    assert _provider().parse_incoming(payload).quoted_id == "alertX"


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
