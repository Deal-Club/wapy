import type { MetadataRoute } from "next";
import { SITE_URL as base } from "@/lib/site";
import { POSTS } from "@/content/articles";
import { pagesPubliees, type TypePage } from "@/lib/maillage";

/**
 * Priorité par type de page. Le sitemap se déduit du maillage : ajouter un pays,
 * une ville, un secteur ou un comparatif publié suffit à le faire apparaître ici,
 * sans toucher à ce fichier.
 */
const PRIORITE: Record<TypePage, number> = {
  accueil: 1,
  pays: 0.9,
  comparatif: 0.85,
  secteur: 0.8,
  ville: 0.75,
  entite: 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = pagesPubliees().map((p) => ({
    url: p.url === "/" ? base : `${base}${p.url}`,
    changeFrequency: "weekly" as const,
    priority: PRIORITE[p.type],
  }));

  return [
    ...pages,
    // Les 11 pages `/secteurs/<slug>` viennent du maillage ci-dessus ; leur page
    // d'index, elle, n'y figure pas (elle ne reçoit pas de lien contextuel et
    // ferait échouer l'audit des 3 entrants). Elle est pourtant servie et doit
    // être explorée : on la déclare ici.
    { url: `${base}/secteurs`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated || p.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // /signup reste listée : c'est une page publique de conversion.
    // /login sort du sitemap : elle est interdite aux robots dans robots.ts,
    // une page fermée n'a rien à faire dans un sitemap.
    { url: `${base}/signup`, changeFrequency: "monthly" as const, priority: 0.7 },
  ];
}
