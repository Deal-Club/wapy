import { getPreuve } from "@/content/preuves";
import { SOURCES } from "@/content/sources";
import type { Preuve, Source } from "@/content/types";

export type PreuveResolue = {
  preuve: Preuve;
  /** Absente lorsque la preuve n'avance aucun chiffre : rien à sourcer. */
  source?: Source;
};

/**
 * Applique le garde-fou G1 au rendu : aucun chiffre sans source.
 *
 * Isolée du composant pour être testable avec une preuve fabriquée, ce que
 * `BlocPreuve` seul ne permet pas puisqu'il ne reçoit qu'un identifiant.
 * Renvoie `null` quand rien ne doit être affiché.
 */
export function resoudrePreuve(preuve: Preuve | undefined): PreuveResolue | null {
  if (!preuve) return null;
  if (!preuve.chiffre) return { preuve };
  const source = SOURCES[preuve.chiffre.source];
  if (!source) return null;
  return { preuve, source };
}

/** Encart de preuve chiffrée et sourcée. Server Component, sans état. */
export default function BlocPreuve({ id }: { id: string }) {
  const resolu = resoudrePreuve(getPreuve(id));
  if (!resolu) return null;

  const { preuve, source } = resolu;
  const { chiffre } = preuve;

  return (
    <aside className="mt-8 rounded-xl border border-line bg-surface p-5">
      {chiffre && (
        <p className="font-display text-3xl font-bold text-brand">
          {chiffre.valeur.toLocaleString("fr-FR")}
        </p>
      )}
      <p className="mt-1 text-sm font-semibold text-ink">{preuve.libelle}</p>
      <p className="mt-2 text-sm text-muted">{preuve.texte}</p>
      {chiffre && source && (
        <p className="mt-3 text-xs text-muted">
          Source :{" "}
          <a href={source.url} className="underline hover:text-brand">
            {source.label}
          </a>
          , {chiffre.annee}
        </p>
      )}
    </aside>
  );
}
