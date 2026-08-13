import type { ReactNode } from "react";

/**
 * Haut de page des guides et des pages entité.
 *
 * Le contenu de la colonne de gauche est passé en `children` et non en
 * propriétés séparées : les liens qu'il porte (fil d'Ariane, appel à l'action)
 * restent ainsi dans l'arbre de la page, seul endroit où les tests savent les
 * lire. C'est aussi ce qui laisse chaque page composer son entrée en matière
 * sans qu'on ajoute une propriété au gabarit à chaque variante.
 *
 * Sans `visuel`, la colonne de texte se limite d'elle-même à 48 rem : une ligne
 * de 90 caractères ne se lit pas, et une page sans image n'a aucune raison
 * d'étirer son chapeau sur toute la largeur.
 */
export default function HeroGuide({
  children,
  visuel,
}: {
  children: ReactNode;
  /** Colonne de droite : illustration, maquette, encadré. Facultative. */
  visuel?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Trame de points, masquée sous `md` : en colonne unique elle passerait
          derrière le texte au lieu de rester à côté de l'image. */}
      <div
        aria-hidden="true"
        className="decor-points pointer-events-none absolute inset-0 hidden md:block"
      />
      <div
        className={`relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-8 md:pb-20 md:pt-12 ${
          visuel ? "items-center md:grid-cols-[1.05fr_0.95fr] md:gap-14" : ""
        }`}
      >
        <div className={`rise ${visuel ? "" : "max-w-3xl"}`}>{children}</div>
        {visuel && (
          <div className="rise" style={{ animationDelay: "0.1s" }}>
            {visuel}
          </div>
        )}
      </div>
    </section>
  );
}
