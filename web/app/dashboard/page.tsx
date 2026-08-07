"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken } from "@/lib/api";
import ConfigEditor, { Config, emptyConfig } from "@/components/ConfigEditor";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import StaffAlertVerify from "@/components/StaffAlertVerify";
import Suggestions from "@/components/Suggestions";
import InstallPrompt from "@/components/InstallPrompt";

type Tab = "conversations" | "records" | "config" | "suggestions" | "whatsapp" | "team" | "billing" | "usage";
const ALL_TABS: { id: Tab; label: string; ownerOnly?: boolean }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "records", label: "Carnet" },
  { id: "config", label: "Configuration", ownerOnly: true },
  { id: "suggestions", label: "Suggestions", ownerOnly: true },
  { id: "whatsapp", label: "WhatsApp", ownerOnly: true },
  { id: "team", label: "Équipe", ownerOnly: true },
  { id: "billing", label: "Abonnement", ownerOnly: true },
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

      <InstallPrompt />
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
        {tab === "billing" && isOwner && <BillingTab />}
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
    </div>
  );
}

function BillingTab() {
  const [b, setB] = useState<any | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  // Sélection (souscription initiale uniquement)
  const [plan, setPlan] = useState("");
  const [addons, setAddons] = useState<string[]>([]);

  useEffect(() => {
    api.getBilling().then((d) => {
      setB(d);
      setPlan(d.plan || d.catalogue?.plans?.[0]?.key || "");
    }).catch(() => {});
  }, []);

  if (!b) return <p className="text-sm text-muted">Chargement…</p>;
  const cat = b.catalogue;
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const featLabel = (f: string) => cat.features[f] || f;
  const statusLabel: Record<string, string> = { active: "Actif ✅", trial: "Essai gratuit", expired: "Expiré ⚠️" };
  const isActive = b.status === "active";

  async function go(fn: () => Promise<any>, key: string) {
    setBusy(key); setMsg("");
    try {
      const r = await fn();
      if (r.checkout_url) window.location.href = r.checkout_url;
      else setMsg("Lien de paiement indisponible.");
    } catch (e: any) { setMsg(e.message || "Échec"); }
    finally { setBusy(""); }
  }

  // --- Vue ABONNÉ ACTIF : upgrade (diff) + options à ajouter (supplément) ---
  const currentPlan = cat.plans.find((p: any) => p.key === b.plan);
  const currentPrice = currentPlan?.price || 0;
  const upgrades = cat.plans.filter((p: any) => p.price > currentPrice);
  const owned = new Set<string>(b.addons || []);
  const planFeats = new Set<string>(currentPlan?.features || []);
  const availableAddons = cat.addons.filter((a: any) => !owned.has(a.key) && !(a.feature && planFeats.has(a.feature)));

  // --- Vue SOUSCRIPTION (essai/expiré) ---
  const selectedPlan = cat.plans.find((p: any) => p.key === plan);
  const selPlanFeats: string[] = selectedPlan?.features || [];
  const total = (selectedPlan?.price || 0) + addons.reduce((sum, k) => sum + (cat.addons.find((a: any) => a.key === k)?.price || 0), 0);
  const toggleAddon = (k: string) => setAddons((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-display text-xl">Votre abonnement</h3>
        <p className="mt-1 text-sm">
          Statut : <b>{statusLabel[b.status] || b.status}</b>
          {b.plan && <> · Formule : <b>{currentPlan?.label || b.plan}</b></>}
          {b.current_period_end && <> · Jusqu'au {b.current_period_end.slice(0, 10)}</>}
        </p>
        {b.status === "trial" && <p className="mt-1 text-sm text-muted">Essai gratuit de {cat.trial_days} jours, tout inclus. Choisissez une formule avant la fin pour ne pas être coupé.</p>}
        {b.features?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {b.features.map((f: string) => <span key={f} className="pill bg-emerald-soft text-emerald-dark text-xs">{featLabel(f)}</span>)}
          </div>
        )}
        {!b.enabled && <p className="mt-2 text-sm text-brand">Le paiement n'est pas encore activé par Wapy.</p>}
      </div>

      {b.enabled && isActive && (
        <>
          {upgrades.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-display text-xl">Passer à une formule supérieure</h3>
              <p className="text-sm text-muted">Vous ne payez que la différence ; votre période en cours est conservée.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {upgrades.map((p: any) => (
                  <div key={p.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                    <div>
                      <div className="font-medium">{p.label} <span className="text-sm text-muted">· {fmt(p.price)} {cat.currency}/mois</span></div>
                      <div className="text-xs text-muted">Différence à payer : <b>{fmt(p.price - currentPrice)} {cat.currency}</b></div>
                    </div>
                    <button className="btn text-sm" onClick={() => go(() => api.upgradePlan(p.key), "up-" + p.key)} disabled={!!busy}>
                      {busy === "up-" + p.key ? "…" : "Passer à " + p.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableAddons.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-display text-xl">Ajouter un service</h3>
              <p className="text-sm text-muted">Vous ne payez que le supplément ; le service est activé immédiatement.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableAddons.map((a: any) => (
                  <div key={a.key} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                    <span>{a.label} <span className="text-muted">· +{fmt(a.price)} {cat.currency}</span></span>
                    <button className="chip" onClick={() => go(() => api.addAddon(a.key), "add-" + a.key)} disabled={!!busy}>
                      {busy === "add-" + a.key ? "…" : "Ajouter"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upgrades.length === 0 && availableAddons.length === 0 && (
            <div className="card text-sm text-muted">Vous bénéficiez déjà de la formule maximale et de toutes les options. 🎉</div>
          )}
        </>
      )}

      {b.enabled && !isActive && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {cat.plans.map((p: any) => (
              <button key={p.key} type="button" onClick={() => setPlan(p.key)}
                className={`card flex flex-col text-left transition ${plan === p.key ? "ring-2 ring-brand" : "hover:border-brand/40"}`}>
                <div className="font-display text-lg">{p.label}</div>
                <div className="mt-1 font-display text-3xl text-brand">{fmt(p.price)} <span className="text-base text-muted">{cat.currency}/mois</span></div>
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {p.features.map((f: string) => <li key={f}>✓ {featLabel(f)}</li>)}
                  <li>✓ {p.limits.conversations ? `${p.limits.conversations} conversations/mois` : "Conversations illimitées"}</li>
                  <li>✓ {p.limits.agents ? `${p.limits.agents} agent(s)` : "Agents illimités"}</li>
                </ul>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="label">Options à la carte</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {cat.addons.map((a: any) => {
                const included = a.feature && selPlanFeats.includes(a.feature);
                return (
                  <label key={a.key} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${included ? "border-line bg-surface/40 opacity-60" : "border-line"}`}>
                    <span className="flex items-center gap-2">
                      <input type="checkbox" disabled={included} checked={included || addons.includes(a.key)} onChange={() => toggleAddon(a.key)} />
                      {a.label} {included && <span className="text-xs text-emerald-dark">· déjà inclus</span>}
                    </span>
                    <span className="text-muted">+{fmt(a.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">Total mensuel</div>
              <div className="font-display text-3xl text-brand">{fmt(total)} <span className="text-base text-muted">{cat.currency}/mois</span></div>
            </div>
            <button className="btn" onClick={() => go(() => api.subscribe(plan, addons), "sub")} disabled={!!busy || !plan}>
              {busy === "sub" ? "…" : "S'abonner et payer"}
            </button>
          </div>
        </>
      )}
      {msg && <p className="text-sm text-brand">{msg}</p>}
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
function initials(s: string): string {
  const parts = (s || "").trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}
const AV_COLORS = ["#1FA463", "#C2502F", "#2563EB", "#8B5CF6", "#EA580C", "#0EA5E9", "#DB2777", "#0D9488"];
function avatarColor(s: string): string {
  let h = 0;
  for (const ch of s || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
function hhmm(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}

function Conversations() {
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [q, setQ] = useState("");
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
  function closeThread() {
    setActive(null);
    activeRef.current = null;
    setThread(null);
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

  const shown = convs.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || (label(c) + " " + (c.last || "")).toLowerCase().includes(s);
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Liste (style WhatsApp) : plein écran sur mobile, masquée quand un fil est ouvert */}
      <div className={`card max-h-[80vh] overflow-hidden p-0 md:col-span-1 md:block ${active ? "hidden" : "block"}`}>
        <div className="border-b border-line bg-surface p-2">
          <input className="input w-full rounded-full text-sm" placeholder="Rechercher une conversation…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="max-h-[72vh] overflow-auto">
          {loading ? <p className="p-4 text-sm text-muted">Chargement…</p>
            : shown.length === 0 ? <p className="p-4 text-sm text-muted">{q ? "Aucun résultat." : "Aucune conversation."}</p>
            : shown.map((c) => (
              <button key={c.chat_id} onClick={() => openThread(c.chat_id)}
                className={`flex w-full items-center gap-3 border-b border-line/60 px-3 py-2.5 text-left transition hover:bg-surface ${active === c.chat_id ? "bg-surface" : ""}`}>
                <Avatar name={label(c)} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{label(c)}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {c.staff && <span className="pill bg-ink/10 text-ink text-[10px]">personnel</span>}
                      {c.escalated && <span className="pill bg-brand-soft text-brand-dark text-[10px]">humain</span>}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted">{c.last}</span>
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Fil (style WhatsApp) : plein écran sur mobile quand ouvert, avec bouton retour */}
      <div className={`card max-h-[80vh] flex-col overflow-hidden p-0 md:col-span-2 md:flex ${active ? "flex" : "hidden md:flex"}`}>
        {!thread ? <p className="m-auto p-6 text-sm text-muted">Sélectionnez une conversation.</p> : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
              <span className="flex items-center gap-2.5">
                <button className="md:hidden -ml-1 mr-0.5 text-xl text-muted" onClick={closeThread} aria-label="Retour">‹</button>
                <Avatar name={label(thread)} size={36} />
                <span>
                  <span className="block font-medium leading-tight">{label(thread)}</span>
                  <span className="block text-xs text-muted">
                    {thread.staff ? "Membre du personnel" : thread.escalated ? "En attente d'un humain" : "Assistant actif"}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                {thread.escalated && <button className="btn-ghost text-xs" onClick={async () => { await api.handoffClose(thread.chat_id); openThread(thread.chat_id); load(); }}>Rendre au bot</button>}
                <button className="btn-ghost text-xs" onClick={toggleStaff}>
                  {thread.staff ? "Retirer du personnel" : "Personnel"}
                </button>
              </span>
            </div>

            <div className="flex-1 space-y-1.5 overflow-auto px-3 py-3" style={{ background: "#efeae2" }}>
              {thread.messages.map((m: any, i: number) => {
                const mine = m.role !== "user"; // sortant (établissement/bot) à droite
                return (
                  <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm ${mine ? "rounded-tr-none bg-[#d9fdd3] text-ink" : "rounded-tl-none bg-white text-ink"}`}>
                      <span className="whitespace-pre-wrap">{m.content}</span>
                      {hhmm(m.at) && <span className="ml-2 inline-block align-bottom text-[10px] text-black/40">{hhmm(m.at)}</span>}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2">
              <input className="input flex-1 rounded-full" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Répondre au client…" />
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald text-white" onClick={sendReply} aria-label="Envoyer">➤</button>
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
    const load = () => api.getRecords().then((r) => setRecords(r.records)).catch(() => {});
    load(); setLoading(false);
    const i = setInterval(load, 8000);
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
