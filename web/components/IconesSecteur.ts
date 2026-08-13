import {
  BedDouble,
  Building2,
  Car,
  GraduationCap,
  PartyPopper,
  Plane,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/*
  Une icône par métier, indexée sur le slug de `content/secteurs.ts` : la même
  source que les pages `/secteurs/<slug>`, que l'accueil et que le moteur de
  maillage. Aucune liste écrite à la main ailleurs, donc aucun métier affiché
  qui n'ait pas sa page.

  Partagée entre l'accueil, l'index des secteurs et le guide de chaque métier :
  un secteur doit porter la même icône partout, sinon la tuile de l'accueil et
  la page qu'elle ouvre ne se ressemblent plus.
*/
const ICONES: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  "salon-de-beaute": Scissors,
  boutique: ShoppingBag,
  hotel: BedDouble,
  "clinique-pharmacie": Stethoscope,
  immobilier: Building2,
  ecole: GraduationCap,
  artisan: Wrench,
  "agence-voyage": Plane,
  "evenementiel-traiteur": PartyPopper,
  "garage-auto": Car,
};

/**
 * Icône d'un secteur. Un secteur ajouté sans icône retombe sur la devanture
 * générique : la tuile s'affiche, rien ne casse.
 */
export function iconeSecteur(slug: string): LucideIcon {
  return ICONES[slug] ?? Store;
}
