"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken } from "@/lib/api";
import ConfigEditor, { Config, emptyConfig } from "@/components/ConfigEditor";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import StaffAlertVerify from "@/components/StaffAlertVerify";
import Suggestions from "@/components/Suggestions";

type Tab = "conversations" | "records" | "config" | "suggestions" | "whatsapp" | "team" | "usage";
const ALL_TABS: { id: Tab; label: string; ownerOnly?: boolean }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "records", label: "Carnet" },
  { id: "config", label: "Configuration", ownerOnly: true },
  { id: "suggestions", label: "Suggestions", ownerOnly: true },
  { id: "whatsapp", label: "WhatsApp", ownerOnly: true },
  { id: "team", label: "Équipe", ownerOnly: true },
  { id: "usage", label: "Usage" },
];

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversations");
  const [me, setMe] = useState<any | null>(null);
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api.me().then(setMe).catch(() => {});
  }, [router]);

  const isOwner = !me || me.role === "owner" || me.is_admin;
  const tabs = ALL_TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-display text-2xl font-semibold text-brand">Wapy</div>
        <div className="flex items-center gap-2">
          {me?.is_admin && (
            <a className="btn-ghost text-sm" href="/admin">Admin</a>
          )}
          <button className="btn-ghost text-sm" onClick={() => { clearToken(); router.replace("/login"); }}>Déconnexion</button>
        </div>
      </div>

      <HealthBanner isOwner={isOwner} onGoWhatsApp={() => setTab("whatsapp")} />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
        {tabs.map((t) => (
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
        {tab === "records" && <RecordsTab />}
        {tab === "config" && isOwner && <ConfigTab />}
        {tab === "suggestions" && isOwner && <Suggestions />}
        {tab === "whatsapp" && isOwner && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="card"><WhatsAppConnect /></div>
            <div className="card"><StaffAlertVerify /></div>
          </div>
        )}
        {tab === "team" && isOwner && <TeamTab />}
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

  async function toggleStaff() {
    if (!thread) return;
    if (thread.staff) await api.staffUnexclude(thread.chat_id);
    else await api.staffExclude(thread.chat_id);
    await refreshThread(false);
    load();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card max-h-[72vh] overflow-auto p-2 md:col-span-1">
        {loading ? <p className="p-3 text-sm text-muted">Chargement…</p>
          : convs.length === 0 ? <p className="p-3 text-sm text-muted">Aucune conversation.</p>
          : convs.map((c) => (
            <button key={c.chat_id} onClick={() => openThread(c.chat_id)}
              className={`mb-1 block w-full rounded-xl p-3 text-left transition hover:bg-brand-soft ${active === c.chat_id ? "bg-brand-soft" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{label(c)}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {c.staff && <span className="pill bg-ink/10 text-ink">personnel</span>}
                  {c.escalated && <span className="pill bg-brand-soft text-brand-dark">humain</span>}
                </span>
              </div>
              <div className="truncate text-xs text-muted">{c.last}</div>
            </button>
          ))}
      </div>

      <div className="card flex max-h-[72vh] flex-col md:col-span-2">
        {!thread ? <p className="m-auto text-sm text-muted">Sélectionnez une conversation.</p> : (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-line pb-2">
              <span className="flex items-center gap-2 font-medium">
                {label(thread)}
                {thread.staff && <span className="pill bg-ink/10 text-ink">personnel</span>}
              </span>
              <span className="flex items-center gap-2">
                {thread.escalated && <button className="btn-ghost text-xs" onClick={async () => { await api.handoffClose(thread.chat_id); openThread(thread.chat_id); load(); }}>Rendre au bot</button>}
                <button className="btn-ghost text-xs" onClick={toggleStaff}>
                  {thread.staff ? "Retirer du personnel" : "C'est un membre du personnel"}
                </button>
              </span>
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

function RecordsTab() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getRecords().then((r) => setRecords(r.records)).catch(() => {}).finally(() => setLoading(false));
    const i = setInterval(() => api.getRecords().then((r) => setRecords(r.records)).catch(() => {}), 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-display text-xl">Carnet</h3>
        <p className="text-sm text-muted">
          Réservations, commandes et paiements conclus automatiquement par l'assistant.
          Le responsable est notifié sur WhatsApp à chaque nouvelle entrée.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Rien pour l'instant. Les réservations/commandes prises par le bot apparaîtront ici.
        </p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-surface/60 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="pill bg-emerald-soft text-emerald-dark">{r.kind || "Demande"}</span>
                <span className="text-xs text-muted">{r.created_at?.replace("T", " ").slice(0, 16)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{r.content}</div>
              <div className="mt-1 text-xs text-muted">Client : {r.name || r.chat_id.replace(/@.*/, "")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthBanner({ isOwner, onGoWhatsApp }: { isOwner: boolean; onGoWhatsApp: () => void }) {
  const [h, setH] = useState<any | null>(null);
  useEffect(() => {
    const f = () => api.waHealth().then(setH).catch(() => {});
    f();
    const i = setInterval(f, 30000);
    return () => clearInterval(i);
  }, []);
  if (!h || h.health === "ok" || h.health === "unknown") return null;
  const scan = h.health === "scan";
  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${scan ? "border-brand/40 bg-brand-soft/50" : "border-brand/50 bg-brand-soft/70"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {scan
            ? "⚠️ Votre WhatsApp n'est plus lié (QR à scanner). Le bot ne peut pas répondre tant qu'il n'est pas reconnecté."
            : "🚨 Votre session WhatsApp est hors ligne. Le bot ne reçoit plus les messages."}
        </span>
        {isOwner && (
          <button className="btn text-xs" onClick={onGoWhatsApp}>Reconnecter</button>
        )}
      </div>
    </div>
  );
}

function TeamTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() { try { setMembers((await api.getTeam()).members); } catch {} }
  useEffect(() => { load(); }, []);

  async function invite() {
    setBusy(true); setMsg("");
    try {
      await api.inviteMember(email.trim(), pwd);
      setEmail(""); setPwd(""); await load();
    } catch (e: any) { setMsg(e.message || "Échec"); }
    finally { setBusy(false); }
  }
  async function remove(id: number) { await api.removeMember(id); load(); }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-display text-xl">Votre équipe</h3>
        <p className="text-sm text-muted">
          Invitez des collègues. Un agent gère les conversations et le carnet, mais ne
          voit pas la configuration, la facturation ni la connexion WhatsApp.
        </p>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-4 py-2.5">
            <div>
              <span className="font-medium">{m.email}</span>
              <span className="pill ml-2 bg-brand-soft text-brand-dark">{m.role === "owner" ? "propriétaire" : "agent"}</span>
            </div>
            {m.role !== "owner" && (
              <button className="btn-ghost text-xs" onClick={() => remove(m.id)}>Retirer</button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-4">
        <div className="label">Inviter un agent</div>
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1" type="email" placeholder="email@collegue.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input flex-1" type="password" placeholder="mot de passe temporaire" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <button className="btn" onClick={invite} disabled={busy || !email.trim() || pwd.length < 6}>
            {busy ? "…" : "Inviter"}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-brand">{msg}</p>}
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
