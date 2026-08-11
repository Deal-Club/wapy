/**
 * Les illustrations du site : des SCHÉMAS, jamais des captures du produit.
 *
 * Distinction non négociable. Ce site a corrigé quarante-six affirmations
 * produit fausses ; faire passer un dessin pour une copie d'écran de Wapy
 * serait la pire de toutes, parce qu'elle serait crue sans discussion. Un
 * schéma explique une mécanique avec des mots déjà publiés ailleurs sur le
 * site ; il n'imite aucune interface et ne porte aucun chiffre.
 *
 * Le jour où de vraies captures existeront, elles vivront dans
 * `public/images/produit/` et seront les seules à pouvoir être présentées
 * comme telles.
 *
 * Les fichiers sont produits par `scripts/illustrations.mjs`. Les déclarer ici
 * plutôt que d'écrire un `<Image>` à la main dans chaque page garantit qu'un
 * même visuel porte partout le même texte de remplacement, et donne à
 * `tests/illustrations.test.ts` la liste à contrôler.
 */

export type Illustration = {
  /** Chemin public du fichier WebP. */
  src: string;
  /** Dimensions réelles du fichier, en pixels. Vérifiées par les tests. */
  largeur: number;
  hauteur: number;
  /**
   * Texte de remplacement. Décrit ce que le schéma montre. Ne contient jamais
   * « capture d'écran » : ce n'en est pas une.
   */
  alt: string;
  /** Légende affichée sous l'image. */
  legende: string;
};

export const PARCOURS_MESSAGE: Illustration = {
  src: "/images/illustrations/parcours-message.webp",
  largeur: 1600,
  hauteur: 1050,
  alt:
    "Schéma du parcours d'un message : le client écrit sur votre numéro, " +
    "l'assistant lit votre fiche, il mène la demande jusqu'au bout, puis vous " +
    "recevez le récapitulatif.",
  legende: "Le trajet d'un message, de sa réception à votre récapitulatif.",
};

export const SILOS_DU_SITE: Illustration = {
  src: "/images/illustrations/silos-du-site.webp",
  largeur: 1600,
  hauteur: 760,
  alt:
    "Schéma de l'organisation du site : trois familles de pages, une par pays, " +
    "une par secteur d'activité, une par comparaison d'outils.",
  legende: "Les trois familles de pages du site.",
};

export const ILLUSTRATIONS: Illustration[] = [PARCOURS_MESSAGE, SILOS_DU_SITE];
