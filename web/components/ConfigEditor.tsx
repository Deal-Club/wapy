"use client";
import { useState } from "react";
import { Sparkles, Download, Upload } from "lucide-react";
import { api } from "@/lib/api";
import SectorPicker from "./SectorPicker";
import EditableTable from "./EditableTable";

export type Config = {
  sector: string;
  description: string;
  infos: { label: string; value: string }[];
  tables: { name: string; columns: string[]; rows: Record<string, string>[] }[];
  consignes: { situation: string; action: string }[];
  faq: { question: string; reponse: string }[];
};

export function emptyConfig(): Config {
  return { sector: "", description: "", infos: [], tables: [], consignes: [], faq: [] };
}

export default function ConfigEditor({
  value,
  onChange,
}: {
  value: Config;
  onChange: (c: Config) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (patch: Partial<Config>) => onChange({ ...value, ...patch });

  async function runAI() {
    setErr("");
    setBusy(true);
    try {
      const r = await api.aiGenerate(value.sector || "", value.description || "");
      onChange({ ...emptyConfig(), ...value, ...r.config });
    } catch (e: any) {
      setErr(e.message || "L'IA n'a pas pu générer");
    } finally {
      setBusy(false);
    }
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const r = await api.importXlsx(file);
      onChange({ ...emptyConfig(), ...value, ...r.config });
    } catch (e: any) {
      setErr(e.message || "Import impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Identité */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Secteur d&apos;activité</label>
          <SectorPicker value={value.sector} onChange={(v) => set({ sector: v })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Décrivez votre activité (aide l&apos;IA à tout remplir)</label>
          <textarea
            className="input min-h-[70px]"
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Ex : Maquis à Cotonou, cuisine béninoise, ambiance conviviale, ouvert tous les jours…"
          />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="space-y-3 rounded-xl2 border border-line bg-brand-soft/40 p-4">
        <div>
          <p className="font-display text-lg">Gagnez du temps</p>
          <p className="text-sm text-muted">Laissez l&apos;IA pré-remplir, ou importez un Excel. Vous pourrez tout éditer.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn flex items-center justify-center gap-2" onClick={runAI} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "…" : "Remplir avec l'IA"}
          </button>
          <a className="btn-ghost flex items-center justify-center gap-2 text-sm" href={api.templateUrl()}>
            <Download className="h-4 w-4" /> Modèle Excel
          </a>
          <label className="btn-ghost flex cursor-pointer items-center justify-center gap-2 text-sm">
            <Upload className="h-4 w-4" /> Importer
            <input type="file" accept=".xlsx" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>
      {err && <p className="text-sm text-brand">{err}</p>}

      {/* Infos */}
      <Section title="Informations" onAdd={() => set({ infos: [...value.infos, { label: "", value: "" }] })}>
        <div className="space-y-3">
          {value.infos.map((it, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <input className="input sm:w-52" value={it.label} placeholder="Rubrique (Horaires…)" onChange={(e) => set({ infos: value.infos.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input className="input sm:flex-1" value={it.value} placeholder="Contenu" onChange={(e) => set({ infos: value.infos.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              </div>
              <button type="button" className="mt-2.5 shrink-0 text-lg text-muted hover:text-brand" onClick={() => set({ infos: value.infos.filter((_, j) => j !== i) })} aria-label="Retirer">×</button>
            </div>
          ))}
          {value.infos.length === 0 && <p className="text-sm text-muted">Aucune info. Ajoutez horaires, adresse, paiement…</p>}
        </div>
      </Section>

      {/* Tables flexibles */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-lg">Tableaux (menu, prestations, catalogue…)</h3>
          <button type="button" className="chip shrink-0" onClick={() => set({ tables: [...value.tables, { name: `Tableau ${value.tables.length + 1}`, columns: ["Nom", "Description", "Prix"], rows: [] }] })}>+ tableau</button>
        </div>
        <div className="space-y-4">
          {value.tables.map((t, i) => (
            <EditableTable
              key={i}
              table={t}
              onChange={(nt) => set({ tables: value.tables.map((x, j) => (j === i ? nt : x)) })}
              onRemove={() => set({ tables: value.tables.filter((_, j) => j !== i) })}
            />
          ))}
          {value.tables.length === 0 && <p className="text-sm text-muted">Aucun tableau. Ajoutez votre menu, vos prestations…</p>}
        </div>
      </div>

      {/* Consignes */}
      <Section title="Consignes (comportement du bot)" onAdd={() => set({ consignes: [...value.consignes, { situation: "", action: "" }] })}>
        <div className="space-y-3">
          {value.consignes.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <input className="input sm:w-52" value={c.situation} placeholder="Situation (Réservations…)" onChange={(e) => set({ consignes: value.consignes.map((x, j) => (j === i ? { ...x, situation: e.target.value } : x)) })} />
                <input className="input sm:flex-1" value={c.action} placeholder="Que faire (envoyer un lien, transmettre au responsable…)" onChange={(e) => set({ consignes: value.consignes.map((x, j) => (j === i ? { ...x, action: e.target.value } : x)) })} />
              </div>
              <button type="button" className="mt-2.5 shrink-0 text-lg text-muted hover:text-brand" onClick={() => set({ consignes: value.consignes.filter((_, j) => j !== i) })} aria-label="Retirer">×</button>
            </div>
          ))}
          {value.consignes.length === 0 && <p className="text-sm text-muted">Aucune consigne pour le moment.</p>}
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Questions fréquentes" onAdd={() => set({ faq: [...value.faq, { question: "", reponse: "" }] })}>
        <div className="space-y-3">
          {value.faq.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <input className="input sm:flex-1" value={f.question} placeholder="Question" onChange={(e) => set({ faq: value.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} />
                <input className="input sm:flex-1" value={f.reponse} placeholder="Réponse" onChange={(e) => set({ faq: value.faq.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)) })} />
              </div>
              <button type="button" className="mt-2.5 shrink-0 text-lg text-muted hover:text-brand" onClick={() => set({ faq: value.faq.filter((_, j) => j !== i) })} aria-label="Retirer">×</button>
            </div>
          ))}
          {value.faq.length === 0 && <p className="text-sm text-muted">Aucune question fréquente.</p>}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg">{title}</h3>
        <button type="button" className="chip" onClick={onAdd}>+ ajouter</button>
      </div>
      {children}
    </div>
  );
}
