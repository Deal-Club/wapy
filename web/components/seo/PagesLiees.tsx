import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Lien } from "@/lib/maillage";
import { capitale } from "@/lib/texte";

/**
 * Liens contextuels calculés par le moteur de maillage.
 *
 * Trois colonnes à partir de `lg` : ces blocs comptent souvent une quinzaine
 * d'entrées, et deux colonnes en faisaient un mur de boîtes identiques qui
 * pesait plus lourd que le contenu de la page.
 *
 * L'ancre est affichée avec une capitale initiale. Le moteur de maillage la
 * produit en minuscules parce que c'est ainsi qu'elle se lit dans une phrase ;
 * en tête d'un lien isolé, la minuscule donne l'impression d'une liste
 * inachevée. Seul l'affichage change : `Lien.ancre` reste la donnée du moteur,
 * que les tests comparent telle quelle.
 */
export default function PagesLiees({
  liens,
  titre = "À lire aussi",
}: {
  liens: Lien[];
  titre?: string;
}) {
  if (liens.length === 0) return null;
  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="font-display text-xl font-bold">{titre}</h2>
      <p className="mt-1.5 text-sm text-muted">Les pages du site qui prolongent celle-ci.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liens.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex h-full items-start justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm font-semibold leading-snug text-ink shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-lift"
            >
              <span>{capitale(l.ancre)}</span>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-line transition duration-300 group-hover:text-brand"
                strokeWidth={2.25}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
