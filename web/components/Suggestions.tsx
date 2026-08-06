"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const KIND_LABEL: Record<string, string> = {
  faq: "Nouvelle FAQ",
  info: "Info manquante",
  consigne: "Consigne",
  table_row: "Ligne de tableau",
};

function preview(kind: string, p: any): { title: string; body: string } {
  if (kind === "faq") return { title: p.question || "", body: p.reponse || "" };
  if (kind === "info") return { title: p.label || "", body: p.value || "" };
  if (kind === "consigne") return { title: p.situation || "", body: p.action || "" };
  return { title: JSON.stringify(p), body: "" };
}

export default function Suggestions() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try { setItems((await api.getSuggestions()).suggestions); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function analyze() {
    setAnalyzing(true); setMsg("");
    try {
      const r = await api.aiLearn();
      setMsg(r.added > 0 ? `${r.added} nouvelle(s) suggestion(s).` : "Rien de nouveau à proposer pour l'instant.");
      await load();
    } catch (e: any) {
      setMsg(e.message || "Analyse impossible.");
    } finally { setAnalyzing(false); }
  }

  async function accept(id: number) {
    await api.acceptSuggestion(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }
  async function reject(id: number) {
    await api.rejectSuggestion(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">L'assistant apprend de vos conversations</h3>
          <p className="text-sm text-muted">
            Wapy analyse les échanges avec vos clients et propose d'enrichir votre fiche.
            Vous validez ce qui vous convient, rien n'est ajouté sans votre accord.
          </p>
        </div>
        <button className="btn" onClick={analyze} disabled={analyzing}>
          {analyzing ? "Analyse…" : "Analyser les conversations"}
        </button>
      </div>

      {msg && <p className="text-sm text-muted">{msg}</p>}

      {loading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Aucune suggestion en attente. Lancez une analyse après quelques conversations.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const p = preview(s.kind, s.payload || {});
            return (
              <div key={s.id} className="rounded-xl border border-line bg-surface/60 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="pill bg-brand-soft text-brand-dark">{KIND_LABEL[s.kind] || s.kind}</span>
                  <span className="text-xs text-muted">{s.title}</span>
                </div>
                <div className="font-medium">{p.title}</div>
                {p.body && <div className="text-sm text-muted">{p.body}</div>}
                <div className="mt-3 flex gap-2">
                  <button className="btn-emerald text-sm" onClick={() => accept(s.id)}>Ajouter à ma fiche</button>
                  <button className="btn-ghost text-sm" onClick={() => reject(s.id)}>Ignorer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
