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
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); setAuthed(false); return; }
    setAuthed(true);
    api.me().then(setMe).catch(() => {});
  }, [router]);

  // Évite le "flash" du dashboard avant la redirection / le chargement du profil.
  if (authed !== true) return null;
  if (me === null) return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">Chargement…</main>;
  if (me.must_change_password) return <ChangePasswordGate onDone={() => api.me().then(setMe)} />;

  const isOwner = me.role === "owner" || me.is_admin;
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
    <div className="space-y-5">
      <div className="card space-y-5">
        <ConfigEditor value={config} onChange={setConfig} staff={staff} onStaffChange={setStaff} />
        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
          <button className="btn" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
        </div>
      </div>
      <KnowledgeDocs />
      <GeniusPayConfig />
    </div>
  );
}

function GeniusPayConfig() {
  const [cfg, setCfg] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [mode, setMode] = useState("sandbox");
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPaymentConfig().then((c) => {
      setCfg(c); setApiKey(c.api_key || ""); setMode(c.mode || "sandbox"); setEnabled(!!c.enabled);
    }).catch(() => {});
  }, []);

  async function save() {
    const body: any = { api_key: apiKey, mode, enabled };
    if (apiSecret.trim()) body.api_secret = apiSecret.trim();
    if (webhookSecret.trim()) body.webhook_secret = webhookSecret.trim();
    await api.putPaymentConfig(body);
    setApiSecret(""); setWebhookSecret("");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    api.getPaymentConfig().then(setCfg).catch(() => {});
  }

  if (!cfg) return null;
  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Paiement en ligne (GeniusPay)</h3>
        <p className="text-sm text-muted">
          Activez pour que le bot envoie des liens de paiement (Wave, Orange, MTN, carte).
          Vos clés restent privées ; c'est vous qui encaissez.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Activer le paiement en ligne
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <div className="label">Clé API (pk_...)</div>
          <input className="input w-full" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="pk_live_..." />
        </div>
        <div>
          <div className="label">Mode</div>
          <select className="input w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="sandbox">Test (sandbox)</option>
            <option value="live">Réel (live)</option>
          </select>
        </div>
        <div>
          <div className="label">Clé secrète (sk_...) {cfg.has_secret && <span className="text-emerald-dark">· enregistrée</span>}</div>
          <input className="input w-full" type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder={cfg.has_secret ? "•••••• (laisser vide pour garder)" : "sk_live_..."} />
        </div>
        <div>
          <div className="label">Secret webhook (whsec_...) {cfg.has_webhook_secret && <span className="text-emerald-dark">· enregistré</span>}</div>
          <input className="input w-full" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={cfg.has_webhook_secret ? "•••••• (laisser vide pour garder)" : "whsec_..."} />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
        <div className="label">URL de webhook à coller dans votre tableau de bord GeniusPay</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all text-xs">{cfg.webhook_url}</code>
          <button className="chip text-xs" onClick={() => { navigator.clipboard?.writeText(cfg.webhook_url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save}>Enregistrer</button>
      </div>
    </div>
  );
}

function KnowledgeDocs() {
  const [docs, setDocs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() { try { setDocs((await api.getKnowledge()).documents); } catch {} }
  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    setBusy(true); setMsg("");
    try { await api.addKnowledge(file); await load(); }
    catch (e: any) { setMsg(e.message || "Échec de l'import"); }
    finally { setBusy(false); }
  }
  async function remove(i: number) { await api.removeKnowledge(i); load(); }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Documents de référence</h3>
        <p className="text-sm text-muted">
          Ajoutez un PDF ou un texte (CGV, brochure, tarifs détaillés, procédures).
          Le bot s'en sert pour répondre, en plus de la fiche ci-dessus.
        </p>
      </div>

      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2 text-sm">
              <span>📄 {d.name} <span className="text-muted">({d.chars} caractères)</span></span>
              <button className="btn-ghost text-xs" onClick={() => remove(i)}>Retirer</button>
            </div>
          ))}
        </div>
      )}

      <label className="chip cursor-pointer">
        {busy ? "Import…" : "+ Ajouter un document (PDF ou .txt)"}
        <input
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </label>
      {msg && <p className="text-sm text-brand">{msg}</p>}
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
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => {
      api.getRecords().then((r) => setRecords(r.records)).catch(() => {});
      api.getPayments().then((r) => setPayments(r.payments)).catch(() => {});
    };
    load(); setLoading(false);
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, []);

  const payBadge = (st: string) =>
    st === "completed" ? "bg-emerald-soft text-emerald-dark" : st === "pending" ? "bg-brand-soft text-brand-dark" : "bg-surface text-muted";

  return (
    <div className="space-y-4">
    {payments.length > 0 && (
      <div className="card space-y-3">
        <h3 className="font-display text-xl">Paiements en ligne</h3>
        <div className="space-y-1.5">
          {payments.map((p, k) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
              <span><b>{p.amount} {p.currency}</b> <span className="text-muted">· {p.name || p.chat_id.replace(/@.*/, "")} · {p.description}</span></span>
              <span className={`pill ${payBadge(p.status)}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    )}
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

function ChangePasswordGate({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (pw.length < 6) { setMsg("6 caractères minimum."); return; }
    if (pw !== pw2) { setMsg("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true); setMsg("");
    try { await api.changePassword(pw); onDone(); }
    catch (e: any) { setMsg(e.message || "Échec"); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="card space-y-4">
        <div>
          <div className="font-display text-2xl font-semibold text-brand">Bienvenue 👋</div>
          <p className="text-sm text-muted">Pour votre sécurité, choisissez un nouveau mot de passe avant de continuer.</p>
        </div>
        <div>
          <div className="label">Nouveau mot de passe</div>
          <input className="input w-full" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <div className="label">Confirmer</div>
          <input className="input w-full" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" />
        </div>
        <button className="btn w-full" onClick={submit} disabled={busy}>{busy ? "…" : "Valider et continuer"}</button>
        {msg && <p className="text-sm text-brand">{msg}</p>}
      </div>
    </main>
  );
}

const TEAM_DIALCODES = ["229", "228", "225", "226", "227", "223", "221", "233", "234", "237", "33", "32", "1"];

function TeamTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dialcode, setDialcode] = useState("229");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { try { setMembers((await api.getTeam()).members); } catch {} }
  useEffect(() => { load(); }, []);

  async function invite() {
    setBusy(true); setMsg(""); setResult(null);
    try {
      const r = await api.inviteMember(email.trim(), phone.trim(), dialcode);
      setResult(r);
      setEmail(""); setPhone(""); await load();
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
        <p className="mb-2 text-xs text-muted">
          Un mot de passe provisoire est généré et envoyé sur le WhatsApp de l'agent.
          Il devra le changer à sa première connexion.
        </p>
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1" type="email" placeholder="email@collegue.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="input max-w-[110px]" value={dialcode} onChange={(e) => setDialcode(e.target.value)}>
            {TEAM_DIALCODES.map((d) => <option key={d} value={d}>+{d}</option>)}
          </select>
          <input className="input flex-1" inputMode="tel" placeholder="numéro WhatsApp de l'agent" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="btn" onClick={invite} disabled={busy || !email.trim()}>
            {busy ? "…" : "Inviter"}
          </button>
        </div>
        {result && (
          <div className="mt-3 rounded-xl border border-emerald/40 bg-emerald-soft/40 px-3 py-2 text-sm">
            Agent créé.{" "}
            {result.sent
              ? "Ses identifiants ont été envoyés sur son WhatsApp. ✅"
              : "⚠️ Envoi WhatsApp impossible (numéro absent ou WhatsApp non connecté)."}
            <div className="mt-1 text-xs text-muted">
              Email : <b>{result.email}</b> · Mot de passe provisoire : <b>{result.password}</b> (à lui transmettre s'il n'a rien reçu)
            </div>
          </div>
        )}
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
