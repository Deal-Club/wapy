import Image from "next/image";
import type { Illustration } from "@/content/illustrations";

/**
 * Affiche un schéma du site, avec sa légende.
 *
 * `width` et `hauteur` sont les dimensions réelles du fichier : Next s'en sert
 * pour réserver la place avant le chargement, ce qui évite que le texte saute
 * sous l'image. Le texte de remplacement vient de `content/illustrations.ts`,
 * jamais de l'appelant : c'est ce qui garantit qu'un même visuel ne sera pas
 * décrit ici comme un schéma et ailleurs comme une capture du produit.
 *
 * Server Component, sans état.
 */
export default function Figure({ illustration }: { illustration: Illustration }) {
  return (
    <figure className="mt-8">
      {/* Le fichier a un fond crème qui ne tombe pas exactement sur le blanc de
          la page : le cadre lui donne une limite franche au lieu de le laisser
          flotter en tache beige. */}
      <div className="overflow-hidden rounded-xl2 border border-line bg-surface p-2 shadow-soft">
        <Image
          src={illustration.src}
          alt={illustration.alt}
          width={illustration.largeur}
          height={illustration.hauteur}
          sizes="(min-width: 768px) 768px, 100vw"
          className="w-full rounded-xl"
        />
      </div>
      <figcaption className="mt-3 flex items-start gap-2 text-sm text-muted">
        <span aria-hidden="true" className="mt-2 h-px w-6 shrink-0 bg-brand/50" />
        {illustration.legende}
      </figcaption>
    </figure>
  );
}
