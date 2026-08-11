/**
 * Signature éditoriale du site.
 *
 * Formulation collective assumée : le dépôt ne désigne aucun responsable
 * éditorial nommé, et la seule identité qu'on y trouve est celle d'un compte
 * Git, ce qui n'est ni un rôle éditorial ni une information destinée à être
 * publiée. Inventer un nom, un titre ou un profil serait exactement le genre
 * d'affirmation invérifiable que ce chantier cherche à éliminer.
 *
 * `linkedin` reste vide tant qu'aucun profil réel n'est rattaché au site : le
 * bloc correspondant ne s'affiche alors pas.
 */
export const AUTEUR = {
  nom: "Équipe Wapy",
  role: "Conception et support de l'assistant WhatsApp Wapy",
  linkedin: "",
};

export default function Auteur() {
  return (
    <section className="mt-14 flex items-start gap-4 rounded-xl border border-line bg-surface p-5">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-lg font-bold text-brand"
      >
        W
      </div>
      <div>
        <p className="font-semibold text-ink">{AUTEUR.nom}</p>
        <p className="mt-1 text-sm text-muted">{AUTEUR.role}</p>
        {AUTEUR.linkedin && (
          <a href={AUTEUR.linkedin} className="mt-1 inline-block text-sm text-brand underline">
            Profil LinkedIn
          </a>
        )}
      </div>
    </section>
  );
}
