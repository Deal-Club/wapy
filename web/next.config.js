// Les 11 articles sectoriels du blog sont devenus des pages /secteurs/*.
// Redirections permanentes pour ne perdre ni lien entrant ni historique
// d'indexation.
//
// Cette liste double celle de `content/secteurs.ts` (champ `ancienSlugBlog`).
// La duplication est assumée : ce fichier est un module CommonJS chargé par
// Next hors du pipeline TypeScript, il ne peut pas importer `@/content/secteurs`.
// `tests/redirections.test.ts` appelle le `redirects()` ci-dessous et le
// confronte aux données : les deux listes ne peuvent pas diverger en silence.
const REDIRECTIONS_SECTEURS = [
  ["chatbot-whatsapp-restaurant", "restaurant"],
  ["assistant-whatsapp-salon-de-beaute", "salon-de-beaute"],
  ["chatbot-whatsapp-boutique", "boutique"],
  ["assistant-whatsapp-hotel", "hotel"],
  ["assistant-whatsapp-clinique-pharmacie", "clinique-pharmacie"],
  ["chatbot-whatsapp-immobilier", "immobilier"],
  ["assistant-whatsapp-ecole", "ecole"],
  ["assistant-whatsapp-artisan", "artisan"],
  ["assistant-whatsapp-agence-voyage", "agence-voyage"],
  ["assistant-whatsapp-evenementiel-traiteur", "evenementiel-traiteur"],
  ["assistant-whatsapp-garage-auto", "garage-auto"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Images hebergees sur Cloudinary (compte « ocenevpc »). Sans cette
    // declaration, `next/image` refuse toute source distante et leve
    // « hostname is not configured under images ». Le chemin est restreint au
    // compte : une URL Cloudinary d'un autre compte reste refusee.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/ocenevpc/**",
      },
    ],
  },
  experimental: {
    // `@vercel/og` (images OpenGraph, cf. lib/og.tsx) lit ses moteurs .wasm et
    // sa police avec `new URL("./resvg.wasm", import.meta.url)`. Bundlé par
    // webpack, `import.meta.url` désignerait le chunk de sortie et les
    // fichiers seraient introuvables. Externalisé, le paquet est requis depuis
    // node_modules et se retrouve lui-même.
    serverComponentsExternalPackages: ["@vercel/og"],
  },
  async redirects() {
    return REDIRECTIONS_SECTEURS.map(([ancien, secteur]) => ({
      source: `/blog/${ancien}`,
      destination: `/secteurs/${secteur}`,
      permanent: true,
    }));
  },
  // En production, Caddy route /api, /auth, /webhook et /media vers l'API et le
  // reste vers ce serveur (cf. deploy/Caddyfile) : le front appelle donc des
  // chemins relatifs (web/lib/api.ts, BASE = ""). En local il n'y a pas de
  // reverse-proxy, et l'API n'ouvre aucun CORS : sans ces rewrites, /auth/login
  // depuis localhost:3001 tomberait sur Next et renverrait 404.
  // Actif uniquement si WAPY_API_PROXY est defini (web/.env.local) : en prod la
  // variable est absente, la liste est vide, Caddy garde la main.
  async rewrites() {
    const api = process.env.WAPY_API_PROXY;
    if (!api) return [];
    return ["/api/:path*", "/auth/:path*", "/webhook", "/webhook/:path*", "/media/:path*"].map(
      (source) => ({ source, destination: `${api}${source}` })
    );
  },
};

module.exports = nextConfig;
