import type { ReactNode } from "react";

/**
 * L'appel à l'action de bas de page : bloc sombre, trame de points en écho au
 * haut de page.
 *
 * Les boutons sont passés en `children` plutôt qu'en propriétés : le lien vers
 * `/signup` reste ainsi dans l'arbre de la page, où `tests/entite.test.ts` va
 * le chercher, et chaque page choisit son second lien.
 */
export default function BlocFinal({
  badge,
  titre,
  texte,
  children,
}: {
  /** Petite mention au-dessus du titre. Facultative. */
  badge?: ReactNode;
  titre: string;
  texte: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-4">
      <div className="relative overflow-hidden rounded-xl2 bg-ink px-6 py-14 text-center text-cream shadow-lift">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)] [background-size:22px_22px]"
        />
        <div className="relative">
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-3 py-1 text-xs text-cream/70">
              {badge}
            </span>
          )}
          <h2 className={`font-display text-3xl font-bold md:text-4xl ${badge ? "mt-5" : ""}`}>
            {titre}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-cream/70">{texte}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Second bouton des blocs sombres : contour clair, jamais le bouton plein. */
export const LIEN_SECONDAIRE_SOMBRE =
  "inline-flex items-center justify-center gap-2 rounded-full border border-cream/25 px-5 py-2.5 font-medium text-cream transition hover:border-cream/50 hover:bg-cream/10";
