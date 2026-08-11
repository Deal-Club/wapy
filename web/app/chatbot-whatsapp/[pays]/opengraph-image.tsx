import { getPays, paysPublies } from "@/content/pays";
import { TAILLE_OG, TYPE_OG, contenuAccueil, contenuPays } from "@/lib/og";
import { imageOG } from "@/lib/og-image";

/**
 * Image OG d'une page pays. Reçoit les mêmes `params` que la page.
 *
 * `generateStaticParams` est redéclaré ici : sans lui, l'image ne serait pas
 * pré-rendue au build et serait fabriquée à chaque partage, en pleine requête.
 */
export const size = TAILLE_OG;
export const contentType = TYPE_OG;
export const alt = "Wapy, chatbot WhatsApp";

export function generateStaticParams() {
  return paysPublies().map((p) => ({ pays: p.slug }));
}

export default function Image({ params }: { params: { pays: string } }) {
  const p = getPays(params.pays);
  // Un slug inconnu ne peut pas laisser l'aperçu vide : la page renvoie un 404,
  // mais l'URL a pu circuler. On retombe sur l'image générique du site.
  return p && p.publie ? imageOG(contenuPays(p)) : imageOG(contenuAccueil());
}
