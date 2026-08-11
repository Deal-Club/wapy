import type { Post } from "./types";
import { post as repondreAutomatiquement } from "./repondre-automatiquement-clients-whatsapp";
import { post as restaurant } from "./chatbot-whatsapp-restaurant";
import { post as salon } from "./assistant-whatsapp-salon-de-beaute";
import { post as boutique } from "./chatbot-whatsapp-boutique";
import { post as hotel } from "./assistant-whatsapp-hotel";
import { post as cliniquePharmacie } from "./assistant-whatsapp-clinique-pharmacie";
import { post as immobilier } from "./chatbot-whatsapp-immobilier";
import { post as ecole } from "./assistant-whatsapp-ecole";
import { post as artisan } from "./assistant-whatsapp-artisan";
import { post as agenceVoyage } from "./assistant-whatsapp-agence-voyage";
import { post as evenementiel } from "./assistant-whatsapp-evenementiel-traiteur";
import { post as garageAuto } from "./assistant-whatsapp-garage-auto";

export type { Post };

export const POSTS: Post[] = [
  repondreAutomatiquement,
  restaurant,
  salon,
  boutique,
  hotel,
  cliniquePharmacie,
  immobilier,
  ecole,
  artisan,
  agenceVoyage,
  evenementiel,
  garageAuto,
];

// Étiquette « secteur » de chaque article (affichage / rangement).
const TAG: Record<string, string> = {
  "repondre-automatiquement-clients-whatsapp": "Guide",
  "chatbot-whatsapp-restaurant": "Restauration",
  "assistant-whatsapp-salon-de-beaute": "Beauté",
  "chatbot-whatsapp-boutique": "Commerce",
  "assistant-whatsapp-hotel": "Hôtellerie",
  "assistant-whatsapp-clinique-pharmacie": "Santé",
  "chatbot-whatsapp-immobilier": "Immobilier",
  "assistant-whatsapp-ecole": "Éducation",
  "assistant-whatsapp-artisan": "Services",
  "assistant-whatsapp-agence-voyage": "Voyage",
  "assistant-whatsapp-evenementiel-traiteur": "Événementiel",
  "assistant-whatsapp-garage-auto": "Automobile",
};

export function tagFor(slug: string): string {
  return TAG[slug] || "Article";
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function related(slug: string, n = 3): Post[] {
  return POSTS.filter((p) => p.slug !== slug).slice(0, n);
}
