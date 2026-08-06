"use client";
import { useState } from "react";
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
  staff,
  onStaffChange,
}: {
  value: Config;
  onChange: (c: Config) => void;
  staff: string;
  onStaffChange: (v: string) => void;
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
        <div>
          <label className="label">Numéro WhatsApp du responsable (escalades)</label>
          <input className="input" value={staff} onChange={(e) => onStaffChange(e.target.value)} placeholder="22961040461@c.us" />
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
      <div className="flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-brand-soft/40 p-4">
        <div>
          <p className="font-display text-lg">Gagnez du temps</p>
          <p className="text-sm text-muted">Laissez l&apos;IA pré-remplir, ou importez un Excel. Vous pourrez tout éditer.</p>
        </div>
        <div className="flex-1" />
        <button type="button" className="btn" onClick={runAI} disabled={busy}>
          {busy ? "…" : "✨ Remplir avec l'IA"}
        </button>
        <a className="btn-ghost text-sm" href={api.templateUrl()}>⬇️ Modèle Excel</a>
        <label className="btn-ghost cursor-pointer text-sm">
          ⬆️ Importer
          <input type="file" accept=".xlsx" className="hidden" onChange={onImport} />
        </label>
      </div>
      {err && <p className="text-sm text-brand">{err}</p>}

      {/* Infos */}
      <Section title="Informations" onAdd={() => set({ infos: [...value.infos, { label: "", value: "" }] })}>
        <div className="space-y-2">
          {value.infos.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-52" value={it.label} placeholder="Rubrique (Horaires…)" onChange={(e) => set({ infos: value.infos.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input className="input flex-1" value={it.value} placeholder="Contenu" onChange={(e) => set({ infos: value.infos.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" className="text-muted hover:text-brand" onClick={() => set({ infos: value.infos.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          {value.infos.length === 0 && <p className="text-sm text-muted">Aucune info. Ajoutez horaires, adresse, paiement…</p>}
        </div>
      </Section>

      {/* Tables flexibles */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg">Tableaux (menu, prestations, catalogue…)</h3>
          <button type="button" className="chip" onClick={() => set({ tables: [...value.tables, { name: `Tableau ${value.tables.length + 1}`, columns: ["Nom", "Description", "Prix"], rows: [] }] })}>+ tableau</button>
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
        <div className="space-y-2">
          {value.consignes.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-52" value={c.situation} placeholder="Situation (Réservations…)" onChange={(e) => set({ consignes: value.consignes.map((x, j) => (j === i ? { ...x, situation: e.target.value } : x)) })} />
              <input className="input flex-1" value={c.action} placeholder="Que faire (envoyer un lien, transmettre au responsable…)" onChange={(e) => set({ consignes: value.consignes.map((x, j) => (j === i ? { ...x, action: e.target.value } : x)) })} />
              <button type="button" className="text-muted hover:text-brand" onClick={() => set({ consignes: value.consignes.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Questions fréquentes" onAdd={() => set({ faq: [...value.faq, { question: "", reponse: "" }] })}>
        <div className="space-y-2">
          {value.faq.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" value={f.question} placeholder="Question" onChange={(e) => set({ faq: value.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} />
              <input className="input flex-1" value={f.reponse} placeholder="Réponse" onChange={(e) => set({ faq: value.faq.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)) })} />
              <button type="button" className="text-muted hover:text-brand" onClick={() => set({ faq: value.faq.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
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
