import type { QuestionReponse } from "@/content/types";

/**
 * Identifiant d'ancrage posé par la section FAQ.
 *
 * Exporté pour que le `Sommaire` d'une page pointe la même valeur que celle que
 * la section pose réellement : un lien "#faq" écrit à la main ailleurs tomberait
 * dans le vide le jour où cet identifiant change.
 */
export const ID_FAQ = "faq";

/** Rendu HTML brut de la FAQ. Le JSON-LD FAQPage est ajouté séparément par la page. */
export default function FAQ({
  items,
  id = ID_FAQ,
}: {
  items: QuestionReponse[];
  id?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold">Questions fréquentes</h2>
      <dl className="mt-6 space-y-6">
        {items.map((f) => (
          <div key={f.q} className="border-l-2 border-line pl-4">
            <dt className="font-semibold text-ink">{f.q}</dt>
            <dd className="mt-1.5 text-muted">{f.r}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
