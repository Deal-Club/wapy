import { getComparatif, COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { TAILLE_OG, TYPE_OG, contenuAccueil, contenuComparatif } from "@/lib/og";
import { imageOG } from "@/lib/og-image";

/** Image OG d'un comparatif. Voir `app/chatbot-whatsapp/[pays]/opengraph-image.tsx`. */
export const size = TAILLE_OG;
export const contentType = TYPE_OG;
export const alt = "Comparatif Wapy";

export function generateStaticParams() {
  return COMPARATIFS_PUBLIES.map((c) => ({ slug: c.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const c = getComparatif(params.slug);
  return c && c.publie ? imageOG(contenuComparatif(c)) : imageOG(contenuAccueil());
}
