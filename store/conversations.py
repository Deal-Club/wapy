"""Persistance SQLite : historique de conversation + états (escalade, opt-out)."""
import sqlite3


class ConversationStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_schema()

    def _conn(self):
        return sqlite3.connect(self.db_path)

    def _init_schema(self):
        with self._conn() as c:
            c.execute(
                """CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )"""
            )
            c.execute(
                """CREATE TABLE IF NOT EXISTS conv_state (
                    chat_id TEXT PRIMARY KEY,
                    escalated INTEGER DEFAULT 0,
                    optout INTEGER DEFAULT 0
                )"""
            )

    def append(self, chat_id: str, role: str, text: str) -> None:
        with self._conn() as c:
            c.execute(
                "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
                (chat_id, role, text),
            )

    def get_history(self, chat_id: str, limit: int) -> list[dict]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT role, content FROM messages WHERE chat_id = ? "
                "ORDER BY id DESC LIMIT ?",
                (chat_id, limit),
            ).fetchall()
        return [{"role": r, "content": t} for r, t in reversed(rows)]

    def _set_flag(self, chat_id: str, column: str) -> None:
        with self._conn() as c:
            c.execute(
                f"INSERT INTO conv_state (chat_id, {column}) VALUES (?, 1) "
                f"ON CONFLICT(chat_id) DO UPDATE SET {column}=1",
                (chat_id,),
            )

    def _get_flag(self, chat_id: str, column: str) -> bool:
        with self._conn() as c:
            row = c.execute(
                f"SELECT {column} FROM conv_state WHERE chat_id = ?", (chat_id,)
            ).fetchone()
        return bool(row and row[0])

    def set_escalated(self, chat_id: str) -> None:
        self._set_flag(chat_id, "escalated")

    def is_escalated(self, chat_id: str) -> bool:
        return self._get_flag(chat_id, "escalated")

    def set_optout(self, chat_id: str) -> None:
        self._set_flag(chat_id, "optout")

    def is_optout(self, chat_id: str) -> bool:
        return self._get_flag(chat_id, "optout")
