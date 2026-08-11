import { ID_FAQ } from "@/components/seo/FAQ";

export type EntreeSommaire = { id: string; libelle: string };

/**
 * Entrée prête à l'emploi pour la section FAQ.
 *
 * Les pages composent leur sommaire avec cette constante plutôt qu'en écrivant
 * `{ id: "faq" }` à la main : l'ancre reste ainsi liée à l'identifiant que le
 * composant `FAQ` pose vraiment dans le DOM.
 */
export const ENTREE_FAQ: EntreeSommaire = { id: ID_FAQ, libelle: "Questions fréquentes" };

/**
 * Table des matières à liens d'ancrage, utilisée par Google pour les snippets de
 * liste. Chaque `id` doit correspondre à l'attribut `id` d'une section réellement
 * rendue par la page : un sommaire est le seul composant capable de produire des
 * liens morts à l'intérieur d'une même page.
 */
export default function Sommaire({ entrees }: { entrees: EntreeSommaire[] }) {
  if (entrees.length < 2) return null;
  return (
    <nav aria-label="Sommaire" className="mt-8 rounded-xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold text-ink">Sur cette page</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {entrees.map((e, i) => (
          <li key={e.id}>
            <a href={`#${e.id}`} className="text-muted hover:text-brand">
              {i + 1}. {e.libelle}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
