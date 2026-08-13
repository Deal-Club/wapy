import type { ReactNode } from "react";

/**
 * Fil d'Ariane des pages publiques.
 *
 * Les maillons sont écrits par la page, pas passés en donnée : ce sont de vrais
 * `<Link>` dans l'arbre de la page, ce que `tests/entite.test.ts` vérifie en
 * cherchant le lien vers l'accueil. Le chevron de séparation, lui, est posé par
 * la feuille de style (`.fil-ariane`, globals.css) : une page n'a pas à écrire
 * un `<span aria-hidden>` entre chaque maillon, et un séparateur décoratif n'a
 * rien à faire dans le HTML.
 */
export default function FilAriane({ children }: { children: ReactNode }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="fil-ariane flex flex-wrap items-center gap-1.5 text-xs text-muted"
    >
      {children}
    </nav>
  );
}
