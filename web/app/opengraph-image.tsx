import { ALT_OG_PAR_DEFAUT, TAILLE_OG, TYPE_OG, contenuAccueil } from "@/lib/og";
import { imageOG } from "@/lib/og-image";

/**
 * Image OG de repli du site.
 *
 * Placée à la racine de `app/`, elle est héritée par TOUTE route qui n'en
 * déclare pas de plus précise : `/tarifs`, `/faq`, `/blog/*`, les index de
 * silo. Les silos où le titre change utilement l'aperçu (pays, secteurs,
 * comparatifs) posent la leur dans leur propre dossier.
 *
 * Pas de `runtime = "edge"` : le site tourne derrière `next start` en Node.
 */
export const size = TAILLE_OG;
export const contentType = TYPE_OG;
export const alt = ALT_OG_PAR_DEFAUT;

export default function Image() {
  return imageOG(contenuAccueil());
}
