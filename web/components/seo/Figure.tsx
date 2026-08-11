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
      <Image
        src={illustration.src}
        alt={illustration.alt}
        width={illustration.largeur}
        height={illustration.hauteur}
        sizes="(min-width: 768px) 768px, 100vw"
        className="w-full rounded-xl border border-line"
      />
      <figcaption className="mt-2 text-sm text-muted">{illustration.legende}</figcaption>
    </figure>
  );
}
