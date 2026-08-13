import Link from "next/link";
import type { Lien } from "@/lib/maillage";

/**
 * Les liens de maillage de l'accueil, rangés par famille.
 *
 * `PagesLiees` rend un lien par carte — bordure, fond, ombre. C'est juste pour
 * les cinq ou six liens contextuels d'une page de contenu ; sur l'accueil, où le
 * moteur en produit une vingtaine, cela donnait un mur de cartes blanches haut
 * comme un écran, juste avant l'appel à l'action.
 *
 * Ici les liens redeviennent des liens : quatre colonnes titrées, du texte, pas
 * de boîte. Un plan de site discret plutôt qu'une section de plus. Aucun lien
 * n'est retiré — le maillage sort intact, il est seulement présentable.
 *
 * Les familles se déduisent de l'URL : le type `Lien` ne porte pas de catégorie,
 * et lui en ajouter une obligerait à toucher tout le moteur pour un besoin
 * d'affichage.
 */
const FAMILLES = [
  { titre: "Par pays", prefixe: "/chatbot-whatsapp/" },
  { titre: "Par métier", prefixe: "/secteurs/" },
  { titre: "Comparatifs", prefixe: "/comparatif" },
] as const;

export default function MaillageAccueil({ liens }: { liens: Lien[] }) {
  if (liens.length === 0) return null;

  const colonnes: { titre: string; liens: Lien[] }[] = FAMILLES.map((f) => ({
    titre: f.titre,
    liens: liens.filter((l) => l.href.startsWith(f.prefixe)),
  }));
  // Tout ce qui n'entre dans aucune famille : les pages du site elles-mêmes.
  const reste = liens.filter((l) => !FAMILLES.some((f) => l.href.startsWith(f.prefixe)));
  if (reste.length > 0) colonnes.push({ titre: "En savoir plus", liens: reste });

  return (
    <nav aria-label="Plan du site" className="border-t border-line pt-10">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {colonnes
          .filter((c) => c.liens.length > 0)
          .map((colonne) => (
            <div key={colonne.titre}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {colonne.titre}
              </h2>
              <ul className="mt-3 space-y-2">
                {colonne.liens.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink/80 transition hover:text-brand"
                    >
                      {l.ancre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </nav>
  );
}
