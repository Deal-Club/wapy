import type { ReactNode } from "react";

/** Réponse directe placée dans les 30 % supérieurs de la page. Moins de 50 mots. */
export default function EnBref({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="En bref"
      className="mt-6 rounded-xl2 border border-brand/20 bg-brand-soft/40 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">En bref</p>
      <p className="mt-2 text-lg leading-relaxed text-ink">{children}</p>
    </section>
  );
}
