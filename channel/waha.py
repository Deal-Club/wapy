"""Adaptateur non-officiel : WAHA (WhatsApp HTTP API, self-host Docker).

Note : la forme exacte du webhook et des endpoints peut varier selon la version
de WAHA (NOWEB/WEBJS). Vérifier contre la version déployée.
"""
import requests

from channel.base import WhatsAppChannel, IncomingMessage


class WahaProvider(WhatsAppChannel):
    def __init__(self, base_url: str, session: str, api_key: str = ""):
        self.base_url = base_url.rstrip("/")
        self.session = session
        # WAHA exige X-Api-Key sur tous les appels quand une clé est configurée.
        self._headers = {"X-Api-Key": api_key} if api_key else {}

    def parse_incoming(self, payload: dict) -> IncomingMessage | None:
        if payload.get("event") != "message":
            return None
        p = payload.get("payload", {})
        chat_id = p.get("from", "")
        body = p.get("body", "")
        if not chat_id or not body:
            return None
        return IncomingMessage(
            chat_id=chat_id,
            text=body,
            from_me=bool(p.get("fromMe", False)),
            is_group=chat_id.endswith("@g.us"),
        )

    def send_text(self, chat_id: str, text: str) -> None:
        r = requests.post(
            f"{self.base_url}/api/sendText",
            json={"session": self.session, "chatId": chat_id, "text": text},
            headers=self._headers,
            timeout=30,
        )
        r.raise_for_status()

    def session_status(self) -> str:
        r = requests.get(
            f"{self.base_url}/api/sessions/{self.session}",
            headers=self._headers,
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("status", "UNKNOWN")
