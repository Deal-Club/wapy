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
        if (c.ok && c.suspended)
          setMsgs([{ role: "assistant", content: "Notre assistant est momentanément indisponible. Merci de revenir un peu plus tard." }]);
        else if (c.ok) setMsgs([{ role: "assistant", content: c.welcome }]);
        // reCAPTCHA v3 invisible : charge le script si l'opérateur a configuré une clé.
        if (c.ok && c.recaptcha_site_key && !(window as any).grecaptcha) {
          const sc = document.createElement("script");
          sc.src = `https://www.google.com/recaptcha/api.js?render=${c.recaptcha_site_key}`;
          sc.async = true;
          document.head.appendChild(sc);
        }
      })
      .catch(() => setCfg({ ok: false }));
  }, []);

  async function captchaToken(): Promise<string> {
    const sk = cfg?.recaptcha_site_key;
    const g = (window as any).grecaptcha;
    if (!sk || !g?.execute) return "";
    try {
      return await new Promise<string>((resolve) => {
        g.ready(() => g.execute(sk, { action: "chat" }).then(resolve).catch(() => resolve("")));
      });
    } catch {
      return "";
    }
  }

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
      const token = await captchaToken();
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: key, session: sess, message: t, token }),
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
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </span>
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

      {!cfg?.suspended && (
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
            style={{ background: color, color: "#fff", border: "none", borderRadius: "50%", width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
