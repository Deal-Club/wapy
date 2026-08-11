/**
 * Ce que les images OpenGraph du site affichent.
 *
 * L'image OG est le rectangle 1200x630 que WhatsApp, LinkedIn, Slack ou X
 * montrent quand quelqu'un colle une URL de Wapy. Sans elle, l'aperçu est un
 * bloc vide. Sur un produit qui circule d'abord par le bouche-à-oreille
 * WhatsApp, cet aperçu EST la première impression : il précède la page.
 *
 * Ce module ne contient que des DONNÉES : des chaînes destinées à des lecteurs
 * humains, soumises aux mêmes règles que le reste du site (aucun tiret long,
 * aucun prix, aucun quota de conversations). `tests/images-og.test.ts` les
 * vérifie une par une, sans avoir à décoder un PNG.
 *
 * Le rendu vit à côté, dans `lib/og-image.tsx` : lui seul importe `@vercel/og`,
 * pour qu'une page qui a juste besoin de déclarer son `og:image` n'entraîne pas
 * le moteur de rendu d'images dans son graphe de modules.
 */

import type { Comparatif } from "@/content/comparatifs";
import type { Pays, Secteur } from "@/content/types";
import { auPays, capitale } from "@/lib/texte";

/** Format attendu par les réseaux sociaux pour une grande carte d'aperçu. */
export const TAILLE_OG = { width: 1200, height: 630 };

export const TYPE_OG = "image/png";

/** Signature commune du site, reprise en pied de chaque image. */
export const PIED_OG = "Assistant WhatsApp pour les entreprises d'Afrique francophone";

export const ALT_OG_PAR_DEFAUT =
  "Wapy, assistant WhatsApp pour les entreprises d'Afrique francophone";

/**
 * Image OG à déclarer explicitement dans les métadonnées d'une page.
 *
 * Next attache l'image d'un fichier `opengraph-image.tsx` à l'objet `openGraph`
 * du segment où le fichier se trouve. Or une page qui exporte son propre
 * `openGraph` REMPLACE celui de ses parents, image comprise : sans la ligne
 * `images: [IMAGE_OG_PAR_DEFAUT]`, `/tarifs` repartait sans aucun `og:image`
 * alors que `app/opengraph-image.tsx` existait, ce qu'aucun test ne voyait.
 *
 * Les pays, secteurs et comparatifs n'en ont pas besoin : ils ont leur propre
 * `opengraph-image.tsx` dans leur segment, donc leur propre `openGraph`.
 *
 * L'URL est relative : Next la résout contre `metadataBase` (`SITE_URL`), ce
 * qui évite d'écrire un domaine en dur ici.
 */
export const IMAGE_OG_PAR_DEFAUT = {
  url: "/opengraph-image",
  width: TAILLE_OG.width,
  height: TAILLE_OG.height,
  alt: ALT_OG_PAR_DEFAUT,
};

/**
 * Ce qu'une image OG affiche.
 *
 * `surtitre` situe la page dans son silo, `titre` la nomme, `accroche` dit ce
 * qu'on y gagne. L'accroche est facultative : les titres du silo comparatif
 * occupent déjà la place, et une accroche générique n'y ajouterait qu'une
 * affirmation de plus à vérifier.
 */
export type ContenuOG = {
  surtitre: string;
  titre: string;
  accroche?: string;
};

export function contenuAccueil(): ContenuOG {
  return {
    surtitre: "Assistant WhatsApp",
    titre: "Répondez à vos clients sur WhatsApp, automatiquement",
    accroche: "Sans code, avec le numéro que vous utilisez déjà",
  };
}

export function contenuPays(p: Pays): ContenuOG {
  return {
    surtitre: "Chatbot WhatsApp",
    titre: p.nom,
    accroche: `Répondre à vos clients 24h/24 ${auPays(p)}`,
  };
}

export function contenuSecteur(s: Secteur): ContenuOG {
  return {
    surtitre: capitale(s.motCle),
    titre: s.nom,
    accroche: "Répondre à vos clients 24h/24",
  };
}

export function contenuComparatif(c: Comparatif): ContenuOG {
  return { surtitre: "Comparatif", titre: c.titre };
}

/**
 * Taille du titre, en pixels, selon sa longueur.
 *
 * Satori ne sait pas réduire un texte pour le faire tenir : un titre long en
 * corps fixe déborde du cadre et se fait rogner. Les seuils correspondent à la
 * largeur utile (1200 moins deux fois la marge) : « Bénin » mérite le grand
 * corps, « Réponse automatique WhatsApp Business : ce qu'elle fait et ce
 * qu'elle ne fait pas » tient sur trois lignes au plus petit.
 */
export function tailleTitre(titre: string): number {
  if (titre.length <= 24) return 88;
  if (titre.length <= 48) return 64;
  return 50;
}
