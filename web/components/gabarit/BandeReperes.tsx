import Reveal from "@/components/Reveal";

/**
 * La bande de repères qui suit le haut de page : deux à quatre faits, gros
 * chiffre et libellé.
 *
 * Règle de contenu, non négociable : chaque repère doit être tenu par le code
 * ou compté sur une donnée du dépôt. Pas de durée de mise en route, pas de
 * volume d'usage, pas de résultat client, rien que le site ne puisse montrer.
 * Un repère invérifiable est exactement le genre d'affirmation que
 * `tests/entite.test.ts` et `tests/donnees.test.ts` traquent ailleurs.
 */
export default function BandeReperes({ reperes }: { reperes: [string, string][] }) {
  return (
    <section className="border-y border-line bg-brand-soft/25">
      <div
        className={`mx-auto grid max-w-6xl gap-6 px-4 py-9 text-center ${
          reperes.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-4"
        }`}
      >
        {reperes.map(([valeur, libelle], i) => (
          <Reveal key={libelle} delai={i * 70}>
            <div className="font-display text-3xl font-bold text-brand md:text-4xl">{valeur}</div>
            <div className="mt-1 text-sm leading-snug text-muted">{libelle}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
