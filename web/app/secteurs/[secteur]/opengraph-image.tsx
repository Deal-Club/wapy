import { getSecteur, secteursPublies } from "@/content/secteurs";
import { TAILLE_OG, TYPE_OG, contenuAccueil, contenuSecteur } from "@/lib/og";
import { imageOG } from "@/lib/og-image";

/** Image OG d'une page secteur. Voir `app/chatbot-whatsapp/[pays]/opengraph-image.tsx`. */
export const size = TAILLE_OG;
export const contentType = TYPE_OG;
export const alt = "Wapy, assistant WhatsApp par secteur";

export function generateStaticParams() {
  return secteursPublies().map((s) => ({ secteur: s.slug }));
}

export default function Image({ params }: { params: { secteur: string } }) {
  const s = getSecteur(params.secteur);
  return s && s.publie ? imageOG(contenuSecteur(s)) : imageOG(contenuAccueil());
}
