"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

function sessionKey(k: string): string {
  const id = "wapy_ws_" + k;
  let v = "";
  try {
    v = localStorage.getItem(id) || "";
    if (!v) {
      v = (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(id, v);
    }
  } catch {
    v = String(Date.now());
  }
  return v;
}

export default function Widget() {
  const [cfg, setCfg] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [key, setKey] = useState("");
  const [sess, setSess] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k") || "";
    setKey(k);
    setSess(sessionKey(k));
    fetch(`/api/widget/config?k=${encodeURIComponent(k)}`)
      .then((r) => r.json())
      .then((c) => {
        setCfg(c);
        if (c.ok) setMsgs([{ role: "assistant", content: c.welcome }]);
      })
      .catch(() => setCfg({ ok: false }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, sending]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setText("");
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setSending(true);
    try {
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: key, session: sess, message: t }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || "…" }]);
    } catch (e: any) {
      const msg =
        e?.message === "429"
          ? "Vous écrivez un peu vite 🙂 réessayez dans un instant."
          : "Désolé, une erreur est survenue. Réessayez.";
      setMsgs((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setSending(false);
    }
  }

  const color = cfg?.color || "#12b76a";

  if (cfg && !cfg.ok) {
    return (
      <div style={{ display: "flex", height: "100dvh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: "#667085", padding: 24, textAlign: "center" }}>
        Ce chat n'est pas disponible pour le moment.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#efeae2", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: color, color: "#fff", padding: "14px 16px", fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</span>
        <span>{cfg?.name || "Assistant"}</span>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#d9fdd3" : "#fff",
              color: "#111",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              boxShadow: "0 1px 1px rgba(0,0,0,.08)",
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: "flex-start", background: "#fff", padding: "8px 12px", borderRadius: 12, color: "#98a2b3", fontSize: 14 }}>
            …
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: 10, background: "#f0f2f5" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Votre message…"
          style={{ flex: 1, border: "none", borderRadius: 20, padding: "10px 14px", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={send}
          disabled={sending}
          aria-label="Envoyer"
          style={{ background: color, color: "#fff", border: "none", borderRadius: "50%", width: 42, height: 42, cursor: "pointer", fontSize: 18 }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
