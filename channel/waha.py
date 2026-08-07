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
        data = p.get("_data") or {}
        ctx = data.get("contextInfo") or {}
        media = p.get("media") or {}
        media_url = media.get("url", "") if isinstance(media, dict) else ""
        has_media = bool(media_url or p.get("hasMedia") or (p.get("type") and p.get("type") not in ("chat", "text")))
        if not chat_id:
            return None
        if not body and not has_media:
            return None
        if not body and has_media:
            # Message média sans légende : on ne l'ignore plus, on qualifie le type.
            mtype = p.get("type", "")
            if mtype in ("audio", "ptt", "voice"):
                body = "[Le client a envoyé une note vocale.]"
            elif mtype == "image":
                body = "[Le client a envoyé une image, probablement un justificatif de paiement.]"
            else:
                body = "[Le client a envoyé une pièce jointe.]"
        name = p.get("notifyName") or data.get("notifyName") or data.get("pushName") or ""
        quoted = (
            p.get("replyTo") or data.get("quotedStanzaID") or data.get("quotedMsgId")
            or ctx.get("stanzaId") or ""
        )
        if isinstance(quoted, dict):
            quoted = quoted.get("id") or quoted.get("_serialized") or ""
        return IncomingMessage(
            chat_id=chat_id,
            text=body,
            from_me=bool(p.get("fromMe", False)),
            is_group=chat_id.endswith("@g.us"),
            id=str(p.get("id", "")),
            sender_name=str(name),
            media_url=str(media_url or ""),
            quoted_id=str(quoted or ""),
        )

    def send_text(self, chat_id: str, text: str) -> str | None:
        r = requests.post(
            f"{self.base_url}/api/sendText",
            json={"session": self.session, "chatId": chat_id, "text": text},
            headers=self._headers,
            timeout=30,
        )
        r.raise_for_status()
        try:
            d = r.json()
            mid = d.get("id")
            if not mid and isinstance(d.get("key"), dict):
                mid = d["key"].get("id")
            if isinstance(mid, dict):
                mid = mid.get("_serialized") or mid.get("id")
            return str(mid) if mid else None
        except Exception:
            return None

    def send_image(self, chat_id: str, url: str, caption: str = "") -> None:
        r = requests.post(
            f"{self.base_url}/api/sendImage",
            json={
                "session": self.session,
                "chatId": chat_id,
                "file": {"url": url},
                "caption": caption,
            },
            headers=self._headers,
            timeout=60,
        )
        r.raise_for_status()

    def resolve_chat_id(self, phone: str) -> str | None:
        """Résout le vrai chatId WhatsApp d'un numéro via WAHA (check-exists).

        WhatsApp normalise côté serveur (ex. Bénin : 2290161040461 -> 22961040461).
        Envoyer au chatId canonique garantit la délivrance. Renvoie None si le numéro
        n'a pas de compte WhatsApp ou si la vérif échoue."""
        try:
            r = requests.get(
                f"{self.base_url}/api/contacts/check-exists",
                params={"phone": phone, "session": self.session},
                headers=self._headers,
                timeout=25,
            )
            if r.status_code == 200:
                data = r.json()
                if data.get("numberExists"):
                    return data.get("chatId") or (phone + "@c.us")
        except Exception:
            pass
        return None

    def fetch_media(self, url: str):
        """Télécharge une pièce jointe (image) servie par WAHA. Renvoie (bytes, mime) ou None."""
        try:
            r = requests.get(url, headers=self._headers, timeout=30)
            if r.status_code == 200 and r.content:
                return r.content, r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        except Exception:
            pass
        return None

    def resolve_lid(self, lid: str) -> str | None:
        """Résout un @lid (identifiant anonymisé NOWEB) vers le vrai numéro @c.us.

        Nécessite le store NOWEB activé sur la session. Sert à reconnaître le
        personnel qui répond depuis son téléphone (WAHA rapporte son message avec
        un @lid ≠ du @c.us d'envoi). Renvoie None si indisponible."""
        num = "".join(ch for ch in (lid or "") if ch.isdigit())
        if not num:
            return None
        try:
            r = requests.get(
                f"{self.base_url}/api/{self.session}/lids/{num}",
                headers=self._headers,
                timeout=15,
            )
            if r.status_code == 200:
                data = r.json()
                pn = data.get("pn") or data.get("phoneNumber") or data.get("number") or ""
                if pn:
                    return pn if pn.endswith("@c.us") else "".join(c for c in pn if c.isdigit()) + "@c.us"
        except Exception:
            pass
        return None

    def session_status(self) -> str:
        r = requests.get(
            f"{self.base_url}/api/sessions/{self.session}",
            headers=self._headers,
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("status", "UNKNOWN")
