// URL publique canonique du site (SEO : canonical, OpenGraph, sitemap, robots).
// Domaine de production : wapy.pro. Surchargé au build par NEXT_PUBLIC_SITE_URL
// (docker-compose web) si besoin d'un autre environnement.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://wapy.pro";
