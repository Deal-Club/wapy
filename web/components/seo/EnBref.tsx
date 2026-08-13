import type { ReactNode } from "react";

/**
 * Réponse directe placée dans les 30 % supérieurs de la page. Moins de 50 mots.
 *
 * Le bloc porte un filet plein sur son bord gauche plutôt qu'une bordure
 * uniforme : c'est ce qui le distingue d'une carte ordinaire quand la page en
 * aligne plusieurs, et ce qui donne à l'oeil le point d'entrée du texte. Le
 * fond reste très pâle, la réponse doit se lire comme du texte, pas comme un
 * encart publicitaire.
 */
export default function EnBref({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="En bref"
      className="relative mt-7 overflow-hidden rounded-xl2 border border-brand/15 bg-brand-soft/30 py-5 pl-7 pr-6"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand" />
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
        En bref
      </p>
      <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-ink/90 md:text-lg">{children}</p>
    </section>
  );
}
