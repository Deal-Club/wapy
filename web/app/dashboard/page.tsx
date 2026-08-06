"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken } from "@/lib/api";
import ConfigEditor, { Config, emptyConfig } from "@/components/ConfigEditor";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import StaffAlertVerify from "@/components/StaffAlertVerify";
import Suggestions from "@/components/Suggestions";

type Tab = "conversations" | "config" | "suggestions" | "whatsapp" | "usage";
const TABS: { id: Tab; label: string }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "config", label: "Configuration" },
  { id: "suggestions", label: "Suggestions" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "usage", label: "Usage" },
];

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversations");
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-display text-2xl font-semibold text-brand">Wapy</div>
        <button className="btn-ghost text-sm" onClick={() => { clearToken(); router.replace("/login"); }}>Déconnexion</button>
      </div>

      <div className="mb-6 flex gap-1 rounded-full border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-brand text-white shadow-soft" : "text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rise">
        {tab === "conversations" && <Conversations />}
        {tab === "config" && <ConfigTab />}
        {tab === "suggestions" && <Suggestions />}
        {tab === "whatsapp" && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="card"><WhatsAppConnect /></div>
            <div className="card"><StaffAlertVerify /></div>
          </div>
        )}
        {tab === "usage" && <UsageTab />}
      </div>
    </main>
  );
}

function ConfigTab() {
  const [config, setConfig] = useState<Config>(emptyConfig());
  const [staff, setStaff] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig({ ...emptyConfig(), ...c });
      setStaff(c.staff_numbers || "");
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.putConfig({ ...config, staff_numbers: staff });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-5">
      <ConfigEditor value={config} onChange={setConfig} staff={staff} onStaffChange={setStaff} />
      <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
      </div>
    </div>
  );
}

function label(c: any): string {
  return c?.name?.trim() || (c?.chat_id || "").replace(/@.*/, "");
}

function Conversations() {
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  const lenRef = useRef(0);

  async function load() {
    try {
      setConvs((await api.getConversations()).conversations);
    } catch {}
    setLoading(false);
  }
  async function refreshThread(scroll: boolean) {
    const cid = activeRef.current;
    if (!cid) return;
    try {
      const t = await api.getThread(cid);
      const grew = (t.messages?.length || 0) !== lenRef.current;
      lenRef.current = t.messages?.length || 0;
      setThread(t);
      if (scroll || grew) setTimeout(() => endRef.current?.scrollIntoView(), 60);
    } catch {}
  }
  function openThread(cid: string) {
    setActive(cid);
    activeRef.current = cid;
    lenRef.current = 0;
    refreshThread(true);
  }
  // Temps réel : liste + fil actif rafraîchis toutes les 5 s.
  useEffect(() => {
    load();
    const i = setInterval(() => { load(); refreshThread(false); }, 5000);
    return () => clearInterval(i);
  }, []);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    await api.handoffReply(active, reply.trim());
    setReply("");
    refreshThread(true);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card max-h-[72vh] overflow-auto p-2 md:col-span-1">
        {loading ? <p className="p-3 text-sm text-muted">Chargement…</p>
          : convs.length === 0 ? <p className="p-3 text-sm text-muted">Aucune conversation.</p>
          : convs.map((c) => (
            <button key={c.chat_id} onClick={() => openThread(c.chat_id)}
              className={`mb-1 block w-full rounded-xl p-3 text-left transition hover:bg-brand-soft ${active === c.chat_id ? "bg-brand-soft" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{label(c)}</span>
                {c.escalated && <span className="pill bg-brand-soft text-brand-dark">humain</span>}
              </div>
              <div className="truncate text-xs text-muted">{c.last}</div>
            </button>
          ))}
      </div>

      <div className="card flex max-h-[72vh] flex-col md:col-span-2">
        {!thread ? <p className="m-auto text-sm text-muted">Sélectionnez une conversation.</p> : (
          <>
            <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
              <span className="font-medium">{label(thread)}</span>
              {thread.escalated && <button className="btn-ghost text-xs" onClick={async () => { await api.handoffClose(thread.chat_id); openThread(thread.chat_id); load(); }}>Rendre au bot</button>}
            </div>
            <div className="flex-1 space-y-2 overflow-auto py-2">
              {thread.messages.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-cream border border-line" : "bg-emerald text-white"}`}>{m.content}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="mt-2 flex gap-2 border-t border-line pt-2">
              <input className="input flex-1" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Répondre au client…" />
              <button className="btn" onClick={sendReply}>Envoyer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UsageTab() {
  const [u, setU] = useState<any | null>(null);
  useEffect(() => { api.getUsage().then(setU).catch(() => {}); }, []);
  if (!u) return <p className="text-sm text-muted">Chargement…</p>;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card"><div className="font-display text-4xl text-brand">{u.messages_in}</div><div className="text-sm text-muted">Messages reçus</div></div>
        <div className="card"><div className="font-display text-4xl text-emerald-dark">{u.messages_out}</div><div className="text-sm text-muted">Messages envoyés</div></div>
      </div>
      {u.days?.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-lg">Par jour</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted"><th className="pb-2">Jour</th><th>Reçus</th><th>Envoyés</th></tr></thead>
            <tbody>{u.days.map((d: any) => (<tr key={d.day} className="border-t border-line"><td className="py-1.5">{d.day}</td><td>{d.in}</td><td>{d.out}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
