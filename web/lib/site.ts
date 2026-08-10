// URL publique canonique du site (SEO : canonical, OpenGraph, sitemap, robots).
// Le jour où un vrai domaine est branché, définir NEXT_PUBLIC_SITE_URL au build
// (docker-compose web) — tout suit automatiquement. Sans domaine réel, le SEO est
// quasi inopérant (une adresse IP/sslip.io n'a aucune autorité).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://wapy.51.210.108.173.sslip.io";
