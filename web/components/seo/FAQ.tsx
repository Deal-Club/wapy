import type { QuestionReponse } from "@/content/types";

/**
 * Identifiant d'ancrage posé par la section FAQ.
 *
 * Exporté pour que le `Sommaire` d'une page pointe la même valeur que celle que
 * la section pose réellement : un lien "#faq" écrit à la main ailleurs tomberait
 * dans le vide le jour où cet identifiant change.
 */
export const ID_FAQ = "faq";

/**
 * Rendu HTML de la FAQ, en accordéons `<details>` natifs. Le JSON-LD FAQPage est
 * ajouté séparément par la page.
 *
 * L'accordéon plutôt que la liste de définitions : au-delà de cinq questions,
 * la liste devient un mur où l'on ne retrouve pas la sienne. Le `<details>` est
 * natif, il fonctionne sans JavaScript, se déplie à l'impression et à la
 * recherche dans la page sur les navigateurs récents, et son contenu reste dans
 * le HTML servi, donc lisible par un moteur.
 *
 * `titre` peut être vidé (`titre={null}`) par une page qui pose déjà son propre
 * en-tête de section, pour ne pas afficher deux titres l'un sous l'autre.
 */
export default function FAQ({
  items,
  id = ID_FAQ,
  titre = "Questions fréquentes",
  colonnes = 1,
}: {
  items: QuestionReponse[];
  id?: string;
  titre?: string | null;
  /** Deux colonnes à partir de `md` pour les longues listes. */
  colonnes?: 1 | 2;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className={`scroll-mt-24 ${titre ? "mt-14" : ""}`}>
      {titre && <h2 className="font-display text-2xl font-bold">{titre}</h2>}
      {/* `items-start` est indispensable en deux colonnes : sans lui, les
          cellules d'une même ligne s'étirent à la hauteur de la plus haute, et
          déplier une question ferait grandir sa voisine restée fermée. */}
      <div
        className={`grid items-start gap-3 ${titre ? "mt-6" : ""} ${
          colonnes === 2 ? "md:grid-cols-2" : ""
        }`}
      >
        {items.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl2 border border-line bg-surface p-5 shadow-soft transition hover:border-brand/30"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold leading-snug text-ink">
              {f.q}
              {/* Une croix pivotée : ouvert, elle devient un moins. Pas de
                  chevron, le site n'en emploie nulle part ailleurs. */}
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 font-display text-lg leading-none text-brand transition duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{f.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
