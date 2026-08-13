import type { ReactNode } from "react";

/**
 * Une section de page publique, et le rythme vertical du site.
 *
 * Deux dispositions :
 *
 * - `colonnes` (par défaut) : le titre reste collé à gauche pendant que son
 *   contenu défile à droite. C'est ce qui remplace la colonne unique de 48 rem
 *   des premières pages : l'écran est occupé sans que les lignes de texte
 *   s'allongent, elles restent dans la colonne de droite ;
 * - `pleine` : titre puis contenu sur toute la largeur, pour une grille, un
 *   tableau ou un mur de cartes qu'une colonne de 48 rem étranglerait.
 *
 * `fond` peint la bande sur toute la largeur de l'écran, pas seulement sous le
 * contenu : c'est l'alternance de ces bandes qui donne son relief à la page,
 * `cream` et `surface` valant tous deux le blanc pur.
 */
export default function SectionGuide({
  id,
  titre,
  intro,
  disposition = "colonnes",
  fond = "clair",
  children,
}: {
  id?: string;
  titre: string;
  /** Une ou deux phrases sous le titre. Facultatif. */
  intro?: ReactNode;
  disposition?: "colonnes" | "pleine";
  fond?: "clair" | "teinte" | "sombre";
  children: ReactNode;
}) {
  const bande = {
    clair: "",
    teinte: "border-y border-line bg-brand-soft/20",
    sombre: "border-y border-line bg-surface",
  }[fond];

  const entete = (
    <>
      <h2 className="font-display text-2xl font-bold leading-tight md:text-[1.75rem]">{titre}</h2>
      {intro && <p className="mt-3 leading-relaxed text-muted">{intro}</p>}
    </>
  );

  return (
    <div className={bande}>
      <section id={id} className="scroll-mt-24 py-14 md:py-20">
        {disposition === "pleine" ? (
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              {entete}
              <span
                aria-hidden="true"
                className="mt-5 block h-1 w-12 rounded-full bg-brand/70"
              />
            </div>
            <div className="mt-10">{children}</div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
            <div>
              {/* Le titre suit le défilement de son contenu : sur une section
                  longue, on sait toujours ce qu'on est en train de lire. */}
              <div className="lg:sticky lg:top-28">
                {entete}
                <span
                  aria-hidden="true"
                  className="mt-5 hidden h-1 w-12 rounded-full bg-brand/70 lg:block"
                />
              </div>
            </div>
            <div>{children}</div>
          </div>
        )}
      </section>
    </div>
  );
}
