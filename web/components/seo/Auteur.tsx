import WapyMarque from "@/components/WapyMarque";

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
    <section className="mt-8 flex items-center gap-4 rounded-xl2 border border-line bg-brand-soft/25 p-5">
      {/* La marque plutôt qu'un W dessiné à la main : c'est la même signature
          que l'en-tête et le pied de page, à la même échelle que l'avatar
          qu'elle remplace. */}
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand">
        <WapyMarque className="h-7 w-7 text-white" couleurLettre="#C2502F" />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Rédigé par</p>
        <p className="mt-1 font-display font-bold text-ink">{AUTEUR.nom}</p>
        <p className="mt-0.5 text-sm text-muted">{AUTEUR.role}</p>
        {AUTEUR.linkedin && (
          <a href={AUTEUR.linkedin} className="mt-1 inline-block text-sm text-brand underline">
            Profil LinkedIn
          </a>
        )}
      </div>
    </section>
  );
}
