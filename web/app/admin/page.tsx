"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken } from "@/lib/api";

// Doit rester aligné sur les modèles de `saas/billing.py` (PLANS[*].model).
// Sonnet 4.6 a été retiré : le cerveau envoie `output_config.format` (sorties
// structurées), que ce modèle ne prend pas en charge — le sélectionner cassait
// chaque message. Opus 4.8 et Sonnet 4.6 étaient de toute façon une génération
// en retard, à tarif identique : les choisir dégradait la qualité sans rien
// économiser.
const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 (le moins cher)" },
  { id: "claude-sonnet-5", label: "Sonnet 5 (équilibré)" },
  { id: "claude-opus-5", label: "Opus 5 (max qualité)" },
];

export default function Admin() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  async function load() {
    try {
      setTenants((await api.adminTenants()).tenants);
      setIncidents((await api.adminIncidents()).incidents);
    } catch (e: any) {
      if ((e.message || "").includes("administrateur") || (e.message || "").includes("403")) setDenied(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); setAuthed(false); return; }
    setAuthed(true);
    load();
  }, [router]);

  if (authed !== true) return null;

  async function patch(id: number, key: string, value: string) {
    setTenants((xs) => xs.map((t) => (t.id === id ? { ...t, [key === "wapy_model" ? "model" : key]: value } : t)));
    try { await api.adminUpdateTenant(id, { [key]: value }); } catch {}
  }

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted">Chargement…</main>;
  if (denied)
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Accès administrateur requis</h1>
        <p className="mt-2 text-muted">Ce compte n'est pas administrateur de la plateforme.</p>
        <a className="btn mt-6 inline-block" href="/dashboard">Retour au tableau de bord</a>
      </main>
    );

  const badge = (s: string) =>
    s === "WORKING" ? "bg-emerald-soft text-emerald-dark" : s === "SCAN_QR_CODE" ? "bg-brand-soft text-brand-dark" : "bg-surface text-muted";
  const ago = (iso: string) => {
    if (!iso) return "—";
    return iso.replace("T", " ").slice(0, 16);
  };
  const unhealthy = tenants.filter((t) => t.wa_status && t.wa_status !== "WORKING" && t.wa_status !== "—").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-display text-2xl font-semibold text-brand">Wapy · Admin</div>
          <p className="text-sm text-muted">
            {tenants.length} comptes clients
            {unhealthy > 0 && <span className="ml-2 text-brand">· {unhealthy} session(s) à surveiller</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost text-sm" href="/dashboard">Mon tableau de bord</a>
          <button className="btn-ghost text-sm" onClick={() => { clearToken(); router.replace("/login"); }}>Déconnexion</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="p-2">#</th>
              <th className="p-2">Établissement</th>
              <th className="p-2">Propriétaire</th>
              <th className="p-2">WhatsApp</th>
              <th className="p-2">Vu (WORKING)</th>
              <th className="p-2">Reçus / Envoyés</th>
              <th className="p-2">Modèle</th>
              <th className="p-2">Plan</th>
              <th className="p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-line align-middle">
                <td className="p-2 text-muted">{t.id}</td>
                <td className="p-2 font-medium">
                  {t.name}
                  {!t.staff_ok && <span className="ml-2 text-xs text-brand" title="Aucun numéro d'alerte vérifié">⚠ pas d'alerte</span>}
                </td>
                <td className="p-2 text-muted">{t.owner || "—"}</td>
                <td className="p-2"><span className={`pill ${badge(t.wa_status)}`}>{t.wa_status}</span></td>
                <td className="p-2 text-xs text-muted">{ago(t.last_seen)}</td>
                <td className="p-2 text-muted">{t.messages_in} / {t.messages_out}</td>
                <td className="p-2">
                  <select className="input py-1 text-xs" value={t.model} onChange={(e) => patch(t.id, "wapy_model", e.target.value)}>
                    {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <select className="input py-1 text-xs" value={t.plan} onChange={(e) => patch(t.id, "plan", e.target.value)}>
                    {["free", "starter", "pro", "business"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    className={`input py-1 text-xs ${t.status === "suspended" ? "text-brand" : "text-emerald-dark"}`}
                    value={t.status}
                    onChange={(e) => patch(t.id, "status", e.target.value)}
                  >
                    <option value="active">actif</option>
                    <option value="suspended">suspendu</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-6">
        <h3 className="mb-3 font-display text-lg">Incidents récents (sessions WhatsApp)</h3>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted">Aucun incident. Toutes les sessions sont stables.</p>
        ) : (
          <div className="space-y-1.5">
            {incidents.map((i, k) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                <span><b>{i.tenant}</b> · <span className="text-brand">{i.status}</span> <span className="text-muted">({i.note})</span></span>
                <span className="text-xs text-muted">{ago(i.at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
