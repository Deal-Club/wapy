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
};

module.exports = nextConfig;
