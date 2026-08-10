"use client";
import { useEffect, useState } from "react";
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
  aiRemaining,
  aiLimit,
}: {
  value: Config;
  onChange: (c: Config) => void;
  aiRemaining?: number;
  aiLimit?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [aiLeft, setAiLeft] = useState<number | undefined>(aiRemaining);
  useEffect(() => { setAiLeft(aiRemaining); }, [aiRemaining]);
  const set = (patch: Partial<Config>) => onChange({ ...value, ...patch });

  async function runAI() {
    setErr("");
    setBusy(true);
    try {
      const r = await api.aiGenerate(value.sector || "", value.description || "");
      onChange({ ...emptyConfig(), ...value, ...r.config });
      if (typeof r.ai_remaining === "number") setAiLeft(r.ai_remaining);
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
          <button type="button" className="btn flex items-center justify-center gap-2" onClick={runAI} disabled={busy || aiLeft === 0}>
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
        {typeof aiLeft === "number" && (
          <p className={`text-xs ${aiLeft === 0 ? "text-brand" : "text-muted"}`}>
            {aiLeft === 0
              ? `Limite mensuelle atteinte (${aiLimit ?? 3} générations IA/mois). Réessayez le mois prochain ou remplissez à la main.`
              : `Générations IA : ${aiLeft}/${aiLimit ?? 3} restantes ce mois-ci.`}
          </p>
        )}
      </div>
      {err && <p className="text-sm text-brand">{err}</p>}

      {/* Infos */}
      <PairEditor
        title="Informations"
        rows={value.infos}
        onChange={(infos) => set({ infos })}
        aKey="label" bKey="value"
        aHeader="Rubrique" bHeader="Contenu"
        aPlaceholder="Horaires, Adresse…" bPlaceholder="Contenu"
        aMin="min-w-[150px]" bMin="min-w-[240px]"
        empty="Aucune info. Ajoutez horaires, adresse, paiement…"
      />

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
      <PairEditor
        title="Consignes (comportement du bot)"
        rows={value.consignes}
        onChange={(consignes) => set({ consignes })}
        aKey="situation" bKey="action"
        aHeader="Situation" bHeader="Que faire"
        aPlaceholder="Réservations…" bPlaceholder="Envoyer un lien, transmettre au responsable…"
        aMin="min-w-[170px]" bMin="min-w-[280px]"
        empty="Aucune consigne pour le moment."
      />

      {/* FAQ */}
      <PairEditor
        title="Questions fréquentes"
        rows={value.faq}
        onChange={(faq) => set({ faq })}
        aKey="question" bKey="reponse"
        aHeader="Question" bHeader="Réponse"
        aPlaceholder="Question" bPlaceholder="Réponse"
        aMin="min-w-[200px]" bMin="min-w-[240px]"
        empty="Aucune question fréquente."
      />
    </div>
  );
}

// Éditeur de liste à 2 colonnes rendu comme un VRAI tableau, scrollable
// horizontalement sur mobile (largeur minimale au lieu de colonnes empilées).
function PairEditor({
  title, rows, onChange, aKey, bKey, aHeader, bHeader, aPlaceholder, bPlaceholder,
  aMin, bMin, empty,
}: {
  title: string;
  rows: any[];
  onChange: (rows: any[]) => void;
  aKey: string; bKey: string;
  aHeader: string; bHeader: string;
  aPlaceholder: string; bPlaceholder: string;
  aMin: string; bMin: string;
  empty: string;
}) {
  const add = () => onChange([...rows, { [aKey]: "", [bKey]: "" }]);
  const setCell = (i: number, key: string, val: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: val } : r)));
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const cell = "w-full rounded-md px-2 py-1.5 outline-none focus:bg-brand-soft/30";
  const th = "border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-lg">{title}</h3>
        <button type="button" className="chip shrink-0" onClick={add}>+ ajouter</button>
      </div>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[480px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${th} ${aMin}`}>{aHeader}</th>
              <th className={`${th} ${bMin}`}>{bHeader}</th>
              <th className="w-8 border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="group">
                <td className={`border-b border-line/60 p-1 align-top ${aMin}`}>
                  <input className={cell} value={r[aKey] ?? ""} placeholder={aPlaceholder} onChange={(e) => setCell(i, aKey, e.target.value)} />
                </td>
                <td className={`border-b border-line/60 p-1 align-top ${bMin}`}>
                  <input className={cell} value={r[bKey] ?? ""} placeholder={bPlaceholder} onChange={(e) => setCell(i, bKey, e.target.value)} />
                </td>
                <td className="border-b border-line/60 p-1 text-center align-middle">
                  <button type="button" className="text-lg text-muted hover:text-brand" onClick={() => remove(i)} aria-label="Retirer">×</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} className="p-3 text-center text-muted">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
