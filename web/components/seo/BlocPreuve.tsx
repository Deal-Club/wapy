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
    /* Encart de preuve : bordure pleine à gauche, comme « En bref ». Les deux
       blocs jouent le même rôle, porter une affirmation qu'on peut vérifier,
       et se reconnaissent donc au même signe. */
    <aside className="relative mt-8 overflow-hidden rounded-xl2 border border-line bg-surface py-5 pl-7 pr-6 shadow-soft">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand/60" />
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Repère vérifié</p>
      {chiffre && (
        <p className="mt-2 font-display text-3xl font-bold text-brand">
          {chiffre.valeur.toLocaleString("fr-FR")}
        </p>
      )}
      <p className="mt-1 font-semibold text-ink">{preuve.libelle}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{preuve.texte}</p>
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
