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
 *
 * Deux allures pour le même contenu, parce que les pages n'ont pas la même
 * composition :
 *
 * - `encadre` (par défaut) : la boîte, dans une colonne d'article ;
 * - `barre` : une rangée de pastilles, pour une page en pleine largeur où une
 *   boîte de trois lignes flotterait au milieu du vide.
 *
 * Le libellé et les ancres sont identiques dans les deux cas : ce qui change
 * est la mise en page, jamais ce qui est publié.
 */
export default function Sommaire({
  entrees,
  variante = "encadre",
}: {
  entrees: EntreeSommaire[];
  variante?: "encadre" | "barre";
}) {
  if (entrees.length < 2) return null;

  if (variante === "barre") {
    return (
      <nav aria-label="Sommaire" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Sur cette page
        </span>
        {entrees.map((e, i) => (
          <a key={e.id} href={`#${e.id}`} className="chip text-[13px]">
            <span className="font-display text-[11px] font-bold tabular-nums text-brand">
              {i + 1}
            </span>
            {e.libelle}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Sommaire"
      className="mt-8 rounded-xl2 border border-line bg-surface p-5 shadow-soft"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Sur cette page</p>
      <ol className="mt-3 text-sm">
        {entrees.map((e, i) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className="group -mx-2 flex items-baseline gap-3 rounded-lg px-2 py-1.5 transition hover:bg-brand-soft/40"
            >
              {/* Numéro sur deux chiffres : la colonne des libellés reste
                  alignée quand un sommaire dépasse neuf entrées. */}
              <span className="font-display text-xs font-bold tabular-nums text-brand/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-muted transition group-hover:text-ink">{e.libelle}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
