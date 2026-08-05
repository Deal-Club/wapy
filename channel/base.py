"""Interface canal WhatsApp — le cerveau ne sait pas quel adaptateur est derrière.
Permet de brancher l'API officielle Meta plus tard sans toucher au reste."""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class IncomingMessage:
    chat_id: str
    text: str
    from_me: bool
    is_group: bool


class WhatsAppChannel(ABC):
    @abstractmethod
    def parse_incoming(self, payload: dict) -> IncomingMessage | None: ...

    @abstractmethod
    def send_text(self, chat_id: str, text: str) -> None: ...

    @abstractmethod
    def session_status(self) -> str: ...
