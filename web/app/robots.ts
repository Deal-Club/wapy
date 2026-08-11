import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Zones fermées aux robots. Correspond exactement aux routes non publiques de
 * `web/app/` : /admin, /dashboard, /login, /onboarding, /widget. Toute nouvelle
 * route privée doit être ajoutée ici, sinon elle finit indexée.
 */
const PRIVE = ["/dashboard", "/onboarding", "/admin", "/login", "/widget"];

/**
 * Crawlers d'IA autorisés nommément : sans eux, aucune citation possible dans
 * ChatGPT, Claude, Perplexity ou les réponses génératives de Google.
 *
 * Chaque nom vient de la documentation de son éditeur, relevée le 2026-08-11.
 * Un nom inventé ou périmé ne bloque rien mais n'autorise rien non plus.
 *
 * Note : un groupe nommé remplace le groupe `*` pour l'agent concerné, il ne
 * s'y ajoute pas. Chaque groupe doit donc répéter `PRIVE`, sinon le robot
 * nommé se retrouve autorisé sur /dashboard.
 */
const CRAWLERS_IA = [
  // OpenAI : entraînement, recherche dans ChatGPT, et navigation déclenchée
  // par un utilisateur. https://developers.openai.com/api/docs/bots
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic : entraînement, recherche, et navigation déclenchée par un
  // utilisateur. https://support.claude.com/en/articles/8896518
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity : indexation et navigation déclenchée par un utilisateur.
  // https://docs.perplexity.ai/guides/bots
  "PerplexityBot",
  "Perplexity-User",
  // Google : Googlebot alimente l'index dont dépendent les AI Overviews ;
  // Google-Extended contrôle l'usage du contenu par Gemini et le grounding.
  // https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
  "Googlebot",
  "Google-Extended",
  // Microsoft : pas d'agent IA distinct, Copilot s'appuie sur l'index de Bing
  // construit par Bingbot. https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
  "Bingbot",
  // Apple : Applebot pour l'exploration, Applebot-Extended pour l'usage du
  // contenu par les fonctions d'IA générative. https://support.apple.com/en-us/119829
  "Applebot",
  "Applebot-Extended",
  // Common Crawl : corpus repris par de nombreux modèles.
  // https://commoncrawl.org/ccbot
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVE },
      ...CRAWLERS_IA.map((bot) => ({ userAgent: bot, allow: "/", disallow: PRIVE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
