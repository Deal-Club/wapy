"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon, Store, BookOpen, CalendarDays, MessageCircle,
  Database, Ban, Smartphone, Sparkles, Users, CreditCard, Send,
  AlertTriangle, CheckCircle2, PartyPopper, type LucideIcon,
} from "lucide-react";
import { api, getToken, clearToken } from "@/lib/api";
import ConfigEditor, { Config, emptyConfig } from "@/components/ConfigEditor";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import StaffAlertVerify from "@/components/StaffAlertVerify";
import Suggestions from "@/components/Suggestions";
import InstallPrompt from "@/components/InstallPrompt";
import WapyMarque from "@/components/WapyMarque";

type Tab = "conversations" | "records" | "rdv" | "usage";
const ALL_TABS: { id: Tab; label: string }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "records", label: "Carnet" },
  { id: "rdv", label: "Rendez-vous" },
  { id: "usage", label: "Usage" },
];

// Sections de la page Paramètres (accessible via l'icône Paramètres, propriétaire).
type SettingsSection = { id: string; label: string; Icon: LucideIcon };
const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "etablissement", label: "Établissement", Icon: Store },
  { id: "connaissances", label: "Base de connaissances", Icon: BookOpen },
  { id: "rdv", label: "Rendez-vous", Icon: CalendarDays },
  { id: "chatbot", label: "Chatbot web", Icon: MessageCircle },
  { id: "connecteur", label: "Base de données", Icon: Database },
  { id: "exclus", label: "Numéros exclus", Icon: Ban },
  { id: "whatsapp", label: "Connexion WhatsApp", Icon: Smartphone },
  { id: "suggestions", label: "Suggestions IA", Icon: Sparkles },
  { id: "equipe", label: "Équipe", Icon: Users },
  { id: "abonnement", label: "Abonnement", Icon: CreditCard },
];

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.26);
  } catch { /* noop */ }
}

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversations");
  const [settings, setSettings] = useState<string | null>(null); // section id ou null (= dashboard)
  const [me, setMe] = useState<any | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [notif, setNotif] = useState<{ esc: number; newRecords: number }>({ esc: 0, newRecords: 0 });
  const seenRecordsRef = useRef<number>(0);
  const prevAttentionRef = useRef<number>(-1);
  const tabRef = useRef<Tab>("conversations");
  tabRef.current = tab;

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); setAuthed(false); return; }
    setAuthed(true);
    api.me().then(setMe).catch(() => {});
    seenRecordsRef.current = Number(localStorage.getItem("wapy_seen_records") || "0");
    // Retour du flux OAuth Google : ouvrir directement les Paramètres (section RDV).
    const q = new URLSearchParams(window.location.search);
    if (q.get("gcal")) setSettings("rdv");
    else if (q.get("tab") === "config") setSettings("etablissement");
  }, [router]);

  // Notifications : escalades (attention client) + nouvelles entrées Carnet.
  useEffect(() => {
    if (authed !== true) return;
    let stop = false;
    async function poll() {
      try {
        const [cv, rc] = await Promise.all([api.getConversations(), api.getRecords()]);
        const esc = (cv.conversations || []).filter((c: any) => c.escalated).length;
        const records = (rc.records || []).length;
        // Si on est sur le Carnet, tout est "vu".
        if (tabRef.current === "records") {
          seenRecordsRef.current = records;
          localStorage.setItem("wapy_seen_records", String(records));
        }
        const newRecords = Math.max(0, records - seenRecordsRef.current);
        if (!stop) setNotif({ esc, newRecords });
        const attention = esc + newRecords;
        if (prevAttentionRef.current >= 0 && attention > prevAttentionRef.current) beep();
        prevAttentionRef.current = attention;
        try {
          const nav: any = navigator;
          if (attention > 0 && nav.setAppBadge) nav.setAppBadge(attention);
          else if (nav.clearAppBadge) nav.clearAppBadge();
        } catch { /* noop */ }
      } catch { /* noop */ }
    }
    poll();
    const i = setInterval(poll, 15000);
    return () => { stop = true; clearInterval(i); };
  }, [authed]);

  // Évite le "flash" du dashboard avant la redirection / le chargement du profil.
  if (authed !== true) return null;
  if (me === null) return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">Chargement…</main>;
  if (me.must_change_password) return <ChangePasswordGate onDone={() => api.me().then(setMe)} />;

  const isOwner = me.role === "owner" || me.is_admin;
  const tabs = ALL_TABS;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button className="flex items-center gap-2 font-display text-2xl font-semibold text-brand" onClick={() => setSettings(null)}>
          <WapyMarque className="h-7 w-7" />
          Wapy
        </button>
        <div className="flex items-center gap-2">
          {me?.is_admin && (
            <a className="btn-ghost text-sm" href="/admin">Admin</a>
          )}
          {isOwner && (
            <button
              className={`btn-ghost flex items-center gap-1.5 text-sm ${settings ? "text-brand" : ""}`}
              onClick={() => setSettings(settings ? null : "etablissement")}
              aria-label="Paramètres"
            >
              <SettingsIcon className="h-4 w-4" /> Paramètres
            </button>
          )}
          <button className="btn-ghost text-sm" onClick={() => { clearToken(); router.replace("/login"); }}>Déconnexion</button>
        </div>
      </div>

      {settings && isOwner ? (
        <SettingsView section={settings} setSection={setSettings} onExit={() => setSettings(null)} />
      ) : (
        <>
          <InstallPrompt />
          <HealthBanner isOwner={isOwner} onGoWhatsApp={() => setSettings("whatsapp")} />

          <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
            {tabs.map((t) => {
              const badge = t.id === "conversations" ? notif.esc : t.id === "records" ? notif.newRecords : 0;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id === "records") { seenRecordsRef.current += notif.newRecords; localStorage.setItem("wapy_seen_records", String(seenRecordsRef.current)); setNotif((n) => ({ ...n, newRecords: 0 })); }
                  }}
                  className={`relative flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-brand text-white shadow-soft" : "text-muted hover:text-ink"}`}
                >
                  {t.label}
                  {badge > 0 && (
                    <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white align-middle">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rise">
            {tab === "conversations" && <Conversations />}
            {tab === "records" && <RecordsTab />}
            {tab === "rdv" && <BookingsTab isOwner={isOwner} />}
            {tab === "usage" && <UsageTab />}
          </div>
        </>
      )}
    </main>
  );
}

function SettingsView({ section, setSection, onExit }: { section: string; setSection: (s: string) => void; onExit: () => void }) {
  const current = SETTINGS_SECTIONS.find((s) => s.id === section) || SETTINGS_SECTIONS[0];
  return (
    <div className="rise">
      <div className="mb-4 flex items-center gap-3">
        <button className="btn-ghost text-sm" onClick={onExit}>← Retour</button>
        <h1 className="font-display text-2xl">Paramètres</h1>
      </div>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        {/* Navigation latérale des sections */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl2 border border-line bg-surface p-2 md:sticky md:top-4 md:max-h-[calc(100dvh-2rem)] md:flex-col md:self-start md:overflow-y-auto">
          {SETTINGS_SECTIONS.map((s) => {
            const Icon = s.Icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex min-w-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition md:whitespace-normal ${section === s.id ? "bg-brand text-white shadow-soft" : "text-muted hover:bg-brand-soft/40 hover:text-ink"}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" /> <span className="hidden min-w-0 sm:inline">{s.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Contenu de la section */}
        <div className="min-w-0 space-y-5">
          <div className="hidden items-center gap-2.5 md:flex">
            <current.Icon className="h-5 w-5 text-brand" />
            <h2 className="font-display text-xl">{current.label}</h2>
          </div>
          {section === "etablissement" && <EstablishmentSection />}
          {section === "connaissances" && <KnowledgeDocs />}
          {section === "rdv" && <BookingConfig />}
          {section === "chatbot" && <WidgetConfig />}
          {section === "connecteur" && <ConnectorConfig />}
          {section === "exclus" && <BlocklistConfig />}
          {section === "whatsapp" && (
            <div className="space-y-4">
              <div className="card"><WhatsAppConnect /></div>
              <div className="card"><StaffAlertVerify /></div>
            </div>
          )}
          {section === "suggestions" && <Suggestions />}
          {section === "equipe" && <TeamTab />}
          {section === "abonnement" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function EstablishmentSection() {
  const [config, setConfig] = useState<Config>(emptyConfig());
  const [ai, setAi] = useState<{ remaining?: number; limit?: number }>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig({ ...emptyConfig(), ...c });
      setAi({ remaining: c.ai_remaining, limit: c.ai_limit });
    }).catch(() => {});
  }, []);

  async function save() {
    setErr("");
    setSaving(true);
    setSaved(false);
    try {
      // `booking` et `documents` sont gérés par leurs propres cartes (sauvegardes
      // dédiées) : on ne les renvoie pas ici, sinon un état périmé les écraserait.
      // Le numéro du responsable est géré dans « Connexion WhatsApp » (vérif OTP).
      const { booking, documents, ...rest } = config as any;
      await api.putConfig(rest);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message || "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-5">
      <ConfigEditor value={config} onChange={setConfig} aiRemaining={ai.remaining} aiLimit={ai.limit} />
      <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
        {err && <span className="text-sm text-brand">{err}</span>}
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
      </div>
    </div>
  );
}

function BlocklistConfig() {
  const [nums, setNums] = useState<string[]>([]);
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getBlocklist().then((r) => setNums(r.numbers || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function persist(next: string[]) {
    setNums(next);
    try { await api.saveBlocklist(next); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch { /* noop */ }
  }
  function add() {
    const v = val.trim();
    if (!v || nums.includes(v)) { setVal(""); return; }
    persist([...nums, v]); setVal("");
  }

  if (loading) return null;
  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Numéros exclus</h3>
        <p className="text-sm text-muted">Le bot ne répondra <b>jamais</b> aux numéros de cette liste (démarcheurs, spams, contacts internes…). Saisissez le numéro au format international.</p>
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Ex. 22961040461" value={val}
          onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <button className="btn" onClick={add}>Ajouter</button>
        {saved && <span className="self-center text-sm text-emerald-dark">✓</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {nums.map((n) => (
          <span key={n} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/50 px-3 py-1 text-sm">
            {n}
            <button className="text-muted hover:text-brand" onClick={() => persist(nums.filter((x) => x !== n))} aria-label="Retirer">×</button>
          </span>
        ))}
        {nums.length === 0 && <p className="text-sm text-muted">Aucun numéro exclu.</p>}
      </div>
    </div>
  );
}

function WidgetConfig() {
  const [w, setW] = useState<any | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { api.getWidget().then(setW).catch(() => setW({ available: false })); }, []);
  if (!w) return null;
  const set = (patch: any) => setW({ ...w, ...patch });

  if (!w.available) {
    return (
      <div className="card space-y-1">
        <h3 className="font-display text-xl">Chatbot pour votre site web</h3>
        <p className="text-sm text-muted">Un assistant à intégrer sur votre site (bulle en bas à droite), qui répond à partir de votre fiche. Inclus dans la formule Pro, ou en option.</p>
      </div>
    );
  }

  async function save() {
    const r = await api.setupWidget({ enabled: w.enabled, name: w.name, welcome: w.welcome, color: w.color });
    setW({ ...w, key: r.key, snippet: r.snippet });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Chatbot pour votre site web</h3>
        <p className="text-sm text-muted">Une bulle de discussion s'affiche en bas à droite de votre site. Le bot répond avec les mêmes infos que sur WhatsApp, et prévient un responsable si le visiteur veut parler à un humain.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!w.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Activer le chatbot web
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-sm">Nom affiché
          <input className="input mt-1 w-full" value={w.name || ""} onChange={(e) => set({ name: e.target.value })} /></label>
        <label className="text-sm sm:col-span-2">Message d'accueil
          <input className="input mt-1 w-full" value={w.welcome || ""} onChange={(e) => set({ welcome: e.target.value })} /></label>
        <label className="text-sm">Couleur
          <input className="input mt-1 h-10 w-full" type="color" value={w.color || "#12b76a"} onChange={(e) => set({ color: e.target.value })} /></label>
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save}>Enregistrer le chatbot</button>
      </div>
      {w.snippet && (
        <div className="rounded-lg border border-line bg-paper/50 p-3">
          <div className="label">Code à coller sur votre site (avant &lt;/body&gt;)</div>
          <code className="block break-all rounded bg-ink/5 p-2 text-xs">{w.snippet}</code>
          <button className="chip mt-2 text-sm" onClick={() => { navigator.clipboard?.writeText(w.snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? "Copié ✓" : "Copier le code"}
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectorConfig() {
  const [c, setC] = useState<any | null>(null);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [testing, setTesting] = useState(false);
  useEffect(() => { api.getConnector().then(setC).catch(() => setC({ available: false })); }, []);
  if (!c) return null;
  const set = (patch: any) => setC({ ...c, ...patch });

  if (!c.available) {
    return (
      <div className="card space-y-1">
        <h3 className="font-display text-xl">Connexion à la base de votre entreprise</h3>
        <p className="text-sm text-muted">Laissez le bot consulter votre stock/produits en direct pour donner des infos fiables. Inclus dans la formule Business, ou en option.</p>
      </div>
    );
  }

  async function save() {
    const payload: any = { enabled: c.enabled, url: c.url, header_name: c.header_name, note: c.note };
    if (token) payload.token = token;
    try {
      await api.saveConnector(payload);
      setToken("");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      api.getConnector().then(setC);
    } catch (e: any) { alert(e.message || "Erreur"); }
  }
  async function test() {
    setTesting(true); setResult("");
    try { const r = await api.testConnector(query || "test"); setResult(r.result || ""); }
    catch (e: any) { setResult("Erreur : " + (e.message || "")); }
    finally { setTesting(false); }
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Connexion à la base de votre entreprise</h3>
        <p className="text-sm text-muted">
          Le bot peut interroger en direct votre système (stock, produits, prix) via une adresse web
          que vous exposez. On ne se connecte jamais directement à votre base : vous gardez la main.
          Votre jeton d'accès est chiffré chez nous.
        </p>
      </div>
      {!c.encryption_ready && <p className="flex items-center gap-1.5 text-sm text-amber-600"><AlertTriangle className="h-4 w-4 shrink-0" /> Chiffrement non encore activé côté serveur — le jeton ne pourra pas être enregistré.</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!c.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Activer la connexion
      </label>
      <label className="block text-sm">Adresse de l'endpoint (HTTPS)
        <input className="input mt-1 w-full" placeholder="https://votre-systeme.com/api/produits" value={c.url || ""} onChange={(e) => set({ url: e.target.value })} /></label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">Nom de l'en-tête d'authentification
          <input className="input mt-1 w-full" placeholder="Authorization" value={c.header_name || ""} onChange={(e) => set({ header_name: e.target.value })} /></label>
        <label className="text-sm">Jeton d'accès {c.token_set && <span className="text-xs text-muted">(déjà enregistré — laissez vide pour garder)</span>}
          <input className="input mt-1 w-full" type="password" placeholder={c.token_set ? "••••••••" : "collez votre jeton"} value={token} onChange={(e) => setToken(e.target.value)} /></label>
      </div>
      <label className="block text-sm">Que renvoie cet endpoint ? (pour guider le bot)
        <textarea className="input mt-1 w-full" rows={2} placeholder="Ex. Recherche un produit par nom et renvoie prix + stock disponible." value={c.note || ""} onChange={(e) => set({ note: e.target.value })} /></label>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save}>Enregistrer le connecteur</button>
      </div>
      <div className="rounded-lg border border-line bg-paper/50 p-3">
        <div className="label">Tester la connexion</div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="mot-clé (ex. nom d'un produit)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn-ghost text-sm" onClick={test} disabled={testing}>{testing ? "…" : "Tester"}</button>
        </div>
        {result && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-ink/5 p-2 text-xs">{result}</pre>}
      </div>
    </div>
  );
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function BookingConfig() {
  const [b, setB] = useState<any | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getConfig().then((c) => {
      const bk = c.booking || {};
      setB({
        enabled: !!bk.enabled, offset: bk.offset ?? 1, slot_min: bk.slot_min ?? 30,
        capacity: bk.capacity ?? 1, horizon_days: bk.horizon_days ?? 14,
        hours: bk.hours || {}, services: bk.services || [],
      });
    }).catch(() => {});
  }, []);

  if (!b) return null;
  const set = (patch: any) => setB({ ...b, ...patch });
  const dayRange = (i: number) => (b.hours[String(i)]?.[0]) || ["", ""];
  const dayRange2 = (i: number) => (b.hours[String(i)]?.[1]) || ["", ""];
  function setDay(i: number, idx: number, pos: number, val: string) {
    const key = String(i);
    const cur = (b.hours[key] || [["", ""], ["", ""]]).map((r: any) => [...r]);
    while (cur.length < 2) cur.push(["", ""]);
    cur[idx][pos] = val;
    set({ hours: { ...b.hours, [key]: cur } });
  }
  function toggleClosed(i: number, closed: boolean) {
    const h = { ...b.hours };
    if (closed) delete h[String(i)]; else h[String(i)] = [["09:00", "18:00"], ["", ""]];
    set({ hours: h });
  }
  const setSvc = (arr: any[]) => set({ services: arr });

  async function save() {
    // nettoie les créneaux vides
    const hours: any = {};
    for (let i = 0; i < 7; i++) {
      const rows = (b.hours[String(i)] || []).filter((r: any) => r[0] && r[1]);
      if (rows.length) hours[String(i)] = rows;
    }
    await api.putConfig({ booking: { ...b, hours, services: b.services.filter((s: any) => (s.name || "").trim()) } });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Rendez-vous / réservations</h3>
        <p className="text-sm text-muted">
          Activez pour que le bot propose des créneaux et prenne les RDV automatiquement,
          avec rappels WhatsApp J-1 et H-2. (Inclus dans les formules Pro et Business, ou en option.)
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={b.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Activer la prise de rendez-vous
      </label>

      <div className="grid gap-2 sm:grid-cols-4">
        <label className="text-sm">Durée d'un créneau (min)
          <input className="input mt-1 w-full" type="number" value={b.slot_min} onChange={(e) => set({ slot_min: +e.target.value })} /></label>
        <label className="text-sm">RDV en parallèle
          <input className="input mt-1 w-full" type="number" value={b.capacity} onChange={(e) => set({ capacity: +e.target.value })} /></label>
        <label className="text-sm">Réservable jusqu'à (jours)
          <input className="input mt-1 w-full" type="number" value={b.horizon_days} onChange={(e) => set({ horizon_days: +e.target.value })} /></label>
        <label className="text-sm">Décalage horaire (UTC+)
          <input className="input mt-1 w-full" type="number" value={b.offset} onChange={(e) => set({ offset: +e.target.value })} /></label>
      </div>

      <div>
        <div className="label">Horaires d'ouverture</div>
        <div className="space-y-1.5">
          {DAYS.map((d, i) => {
            const closed = !b.hours[String(i)];
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-24">{d}</span>
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input type="checkbox" checked={closed} onChange={(e) => toggleClosed(i, e.target.checked)} /> fermé
                </label>
                {!closed && (
                  <>
                    <input className="input w-24" type="time" value={dayRange(i)[0]} onChange={(e) => setDay(i, 0, 0, e.target.value)} />
                    <span>-</span>
                    <input className="input w-24" type="time" value={dayRange(i)[1]} onChange={(e) => setDay(i, 0, 1, e.target.value)} />
                    <span className="text-muted">et</span>
                    <input className="input w-24" type="time" value={dayRange2(i)[0]} onChange={(e) => setDay(i, 1, 0, e.target.value)} />
                    <span>-</span>
                    <input className="input w-24" type="time" value={dayRange2(i)[1]} onChange={(e) => setDay(i, 1, 1, e.target.value)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted">Deux plages possibles par jour (ex. matin et après-midi). Laissez la 2e vide si pas de pause.</p>
      </div>

      <div>
        <div className="label">Prestations réservables</div>
        <div className="space-y-1.5">
          {b.services.map((sv: any, k: number) => (
            <div key={k} className="flex flex-wrap items-center gap-2">
              <input className="input flex-1" placeholder="Nom (ex. Coupe)" value={sv.name || ""} onChange={(e) => setSvc(b.services.map((x: any, j: number) => j === k ? { ...x, name: e.target.value } : x))} />
              <input className="input w-28" type="number" placeholder="durée (min)" value={sv.duration || ""} onChange={(e) => setSvc(b.services.map((x: any, j: number) => j === k ? { ...x, duration: +e.target.value } : x))} />
              <input className="input w-28" placeholder="prix" value={sv.price || ""} onChange={(e) => setSvc(b.services.map((x: any, j: number) => j === k ? { ...x, price: e.target.value } : x))} />
              <button className="btn-ghost text-xs" onClick={() => setSvc(b.services.filter((_: any, j: number) => j !== k))}>Retirer</button>
            </div>
          ))}
        </div>
        <button className="chip mt-2 text-sm" onClick={() => setSvc([...b.services, { name: "", duration: b.slot_min, price: "" }])}>+ Ajouter une prestation</button>
      </div>

      <GoogleCalendarCard />

      <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
        {saved && <span className="text-sm text-emerald-dark">✓ Enregistré</span>}
        <button className="btn" onClick={save}>Enregistrer les RDV</button>
      </div>
    </div>
  );
}

function GoogleCalendarCard() {
  const [st, setSt] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  function load() { api.googleStatus().then(setSt).catch(() => setSt({ available: false })); }
  useEffect(() => {
    load();
    // Retour du flux OAuth : ?gcal=ok|error|noconsent
    const p = new URLSearchParams(window.location.search);
    if (p.get("gcal")) {
      const map: any = { ok: "Google Agenda connecté ✅", error: "Échec de la connexion Google, réessayez.", noconsent: "Connexion déjà autorisée — réessayez en révoquant l'accès dans votre compte Google." };
      alert(map[p.get("gcal")!] || "");
      p.delete("gcal"); p.delete("tab");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (!st) return null;
  if (!st.available) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper/50 p-3 text-sm text-muted">
        <CalendarDays className="h-4 w-4 shrink-0" /> Synchro Google Agenda bientôt disponible.
      </div>
    );
  }

  async function connect() {
    setBusy(true);
    try { const r = await api.googleConnect(); window.location.href = r.url; }
    catch { alert("Impossible de démarrer la connexion Google."); setBusy(false); }
  }
  async function disconnect() {
    if (!confirm("Déconnecter votre Google Agenda ? Les prochains RDV ne s'y ajouteront plus.")) return;
    setBusy(true);
    try { await api.googleDisconnect(); load(); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-line bg-paper/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">Google Agenda</div>
          <div className="text-xs text-muted">
            {st.connected
              ? <>Connecté{st.email ? ` — ${st.email}` : ""}. Chaque RDV s'ajoute à votre agenda.</>
              : "Connectez votre agenda : chaque RDV pris par le bot s'y ajoute automatiquement."}
          </div>
        </div>
        {st.connected
          ? <button className="btn-ghost text-sm" onClick={disconnect} disabled={busy}>Déconnecter</button>
          : <button className="btn text-sm" onClick={connect} disabled={busy}>{busy ? "…" : "Connecter mon Google Agenda"}</button>}
      </div>
    </div>
  );
}

function BookingsTab({ isOwner }: { isOwner: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  function load() { api.getBookings().then((r) => setItems(r.bookings)).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  const upcoming = items.filter((b) => b.status === "booked");
  const fmt = (iso: string) => iso ? iso.replace("T", " ").slice(0, 16) : "";

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-display text-xl">Rendez-vous</h3>
        <p className="text-sm text-muted">Les réservations prises par le bot. Rappels WhatsApp envoyés automatiquement (J-1 et H-2).</p>
      </div>
      {loading ? <p className="text-sm text-muted">Chargement…</p>
        : upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Aucun rendez-vous à venir. Activez la prise de RDV dans Configuration.
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm">
                <div>
                  <div className="flex items-center gap-1.5 font-medium"><CalendarDays className="h-4 w-4 shrink-0 text-brand" /> {fmt(b.when)} · {b.service}</div>
                  <div className="text-xs text-muted">Client : {b.customer}</div>
                </div>
                {isOwner && <button className="btn-ghost text-xs" onClick={async () => { await api.cancelBooking(b.id); load(); }}>Annuler</button>}
              </div>
            ))}
          </div>
        )}
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
  const statusLabel: Record<string, string> = { active: "Actif", trial: "Essai gratuit", expired: "Expiré" };
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
            <div className="card flex items-center gap-2 text-sm text-muted"><PartyPopper className="h-4 w-4 shrink-0 text-brand" /> Vous bénéficiez déjà de la formule maximale et de toutes les options.</div>
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
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald text-white" onClick={sendReply} aria-label="Envoyer"><Send className="h-4 w-4" /></button>
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
        <span className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {scan
            ? "Votre WhatsApp n'est plus lié (QR à scanner). Le bot ne peut pas répondre tant qu'il n'est pas reconnecté."
            : "Votre session WhatsApp est hors ligne. Le bot ne reçoit plus les messages."}
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
