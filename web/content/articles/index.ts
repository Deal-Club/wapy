import type { Post } from "./types";
import { post as repondreAutomatiquement } from "./repondre-automatiquement-clients-whatsapp";

export type { Post };

/**
 * Les 11 articles sectoriels ont quitté le blog : leur substance vit désormais
 * dans `content/secteurs.ts`, servie par `/secteurs/<slug>`. Leurs anciennes
 * URL `/blog/<slug>` sont redirigées en permanence par `next.config.js`, ce que
 * `tests/redirections.test.ts` vérifie. Les laisser ici en plus des pages
 * secteur produirait deux pages sur le même mot-clé, chacune affaiblissant
 * l'autre.
 */
export const POSTS: Post[] = [repondreAutomatiquement];

// Étiquette « secteur » de chaque article (affichage / rangement).
const TAG: Record<string, string> = {
  "repondre-automatiquement-clients-whatsapp": "Guide",
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
