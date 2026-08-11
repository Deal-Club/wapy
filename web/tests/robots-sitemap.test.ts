import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";
import { pagesPubliees } from "@/lib/maillage";
import { POSTS } from "@/content/articles";
import { PREUVES } from "@/content/preuves";

/**
 * Chemins fermés aux robots. La liste correspond exactement aux routes de
 * `web/app/` qui ne sont pas des pages publiques : dashboard, onboarding,
 * admin, login, widget. Relevé le 2026-08-11 ; si une route privée est ajoutée
 * à l'app sans être ajoutée ici, elle finira indexée.
 */
const PRIVE = ["/dashboard", "/onboarding", "/admin", "/login", "/widget"];

/**
 * Agents à autoriser explicitement. Chaque nom est repris de la documentation
 * de son éditeur (cf. rapport de tâche 10), jamais d'un article de blog : un
 * nom inventé ne bloque rien mais n'autorise rien non plus.
 */
const CRAWLERS_IA = [
  // OpenAI (developers.openai.com/api/docs/bots)
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic (support.claude.com, article 8896518)
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity (docs.perplexity.ai/guides/bots)
  "PerplexityBot",
  "Perplexity-User",
  // Google (developers.google.com/search/docs/crawling-indexing/google-common-crawlers)
  "Googlebot",
  "Google-Extended",
  // Microsoft
  "Bingbot",
  // Apple (support.apple.com/en-us/119829)
  "Applebot",
  "Applebot-Extended",
  // Common Crawl (commoncrawl.org/ccbot)
  "CCBot",
];

type Regle = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
};

function liste(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

const ICI = path.dirname(fileURLToPath(import.meta.url));
const LLMS = readFileSync(path.join(ICI, "..", "public", "llms.txt"), "utf8");

describe("robots.txt", () => {
  const r = robots();
  const regles: Regle[] = Array.isArray(r.rules) ? r.rules : [r.rules];

  it("interdit toutes les zones privées à la règle générale", () => {
    const generale = regles.find((x) => x.userAgent === "*");
    if (!generale) throw new Error("règle générale (userAgent \"*\") absente");
    const interdits = liste(generale.disallow);
    for (const chemin of PRIVE) {
      expect(interdits, `chemin non interdit : ${chemin}`).toContain(chemin);
    }
  });

  it("autorise explicitement les crawlers d'IA", () => {
    const agents = regles.flatMap((x) => liste(x.userAgent));
    for (const bot of CRAWLERS_IA) {
      expect(agents, `crawler absent : ${bot}`).toContain(bot);
    }
  });

  // Un groupe nommé remplace le groupe `*` pour l'agent concerné : oublier le
  // `disallow` dans un groupe crawler d'IA ouvrirait /dashboard à ce robot.
  it("répète les interdictions dans chaque groupe nommé", () => {
    for (const regle of regles) {
      const interdits = liste(regle.disallow);
      for (const chemin of PRIVE) {
        expect(
          interdits,
          `${liste(regle.userAgent).join(",")} n'interdit pas ${chemin}`,
        ).toContain(chemin);
      }
    }
  });

  it("laisse le reste du site ouvert à chaque groupe", () => {
    for (const regle of regles) {
      expect(liste(regle.allow), `${liste(regle.userAgent).join(",")} n'autorise rien`).toContain("/");
    }
  });

  it("déclare le sitemap en url absolue", () => {
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("sitemap.xml", () => {
  const entrees = sitemap();
  const urls = entrees.map((e) => e.url);

  it("liste toutes les pages publiées du maillage", () => {
    for (const p of pagesPubliees()) {
      const attendue = p.url === "/" ? SITE_URL : `${SITE_URL}${p.url}`;
      expect(urls, `page absente du sitemap : ${p.url}`).toContain(attendue);
    }
  });

  /**
   * `/secteurs` et `/chatbot-whatsapp` sont les deux chemins du sitemap
   * qu'aucune source ne produit automatiquement. Ces pages d'index ne sont pas
   * dans `pagesPubliees()` : elles ne reçoivent aucun lien contextuel et
   * feraient échouer l'audit des 3 entrants du maillage. Elles sont donc
   * déclarées à la main dans `app/sitemap.ts`, et leur suppression accidentelle
   * ne casserait rien sans ce test, alors qu'elle sortirait la tête de chaque
   * silo de l'exploration.
   */
  it("liste la page d'index des secteurs, absente du maillage", () => {
    expect(urls).toContain(`${SITE_URL}/secteurs`);
  });

  it("liste la page d'index des pays, absente du maillage", () => {
    expect(urls).toContain(`${SITE_URL}/chatbot-whatsapp`);
  });

  /**
   * Les deux index sont déclarés en dur : rien ne garantit qu'ils ne finissent
   * pas doublonnés par une future entrée du maillage, ni qu'un pays publié soit
   * confondu avec l'index. Ce test fige la frontière.
   */
  it("distingue l'index des pays des pages pays elles-mêmes", () => {
    const sousPages = urls.filter((u) => u.startsWith(`${SITE_URL}/chatbot-whatsapp/`));
    expect(sousPages.length, "aucune page pays dans le sitemap").toBeGreaterThanOrEqual(5);
  });

  it("liste le blog et chacun de ses articles", () => {
    expect(urls).toContain(`${SITE_URL}/blog`);
    for (const post of POSTS) {
      expect(urls, `article absent : ${post.slug}`).toContain(`${SITE_URL}/blog/${post.slug}`);
    }
  });

  it("n'expose aucune page privée", () => {
    for (const u of urls) {
      for (const prive of PRIVE) {
        expect(u, `url privée dans le sitemap : ${u}`).not.toContain(prive);
      }
    }
  });

  it("n'a pas d'url en double", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("n'utilise que des urls absolues", () => {
    for (const u of urls) expect(u.startsWith(SITE_URL), `url relative : ${u}`).toBe(true);
  });

  it("donne une priorité valide à chaque entrée", () => {
    for (const e of entrees) {
      expect(e.priority, `priorité manquante pour ${e.url}`).toBeTypeOf("number");
      expect(e.priority ?? -1).toBeGreaterThan(0);
      expect(e.priority ?? 2).toBeLessThanOrEqual(1);
    }
  });
});

describe("llms.txt", () => {
  /**
   * Le fichier est statique (servi depuis `public/`), donc ses chiffres ne se
   * régénèrent pas. Ce test est le garde-fou : les phrases chiffrées y sont
   * reprises mot pour mot de `content/preuves.ts`, seule autorité sur les
   * mesures. Si la tâche 9 remesure, ce test échoue au lieu de laisser un
   * chiffre périmé se publier en silence.
   */
  it("reprend mot pour mot les preuves chiffrées mesurées", () => {
    for (const p of PREUVES) {
      if (!p.chiffre) continue;
      expect(LLMS, `texte de preuve absent de llms.txt : ${p.id}`).toContain(p.texte);
    }
  });

  it("ne publie aucun chemin qui ne soit pas une page réellement servie", () => {
    const servies = new Set([
      ...pagesPubliees().map((p) => p.url),
      "/blog",
      ...POSTS.map((p) => `/blog/${p.slug}`),
    ]);
    const chemins = LLMS.match(/(?<=^|[\s(,])\/[a-z0-9/-]+/g) ?? [];
    expect(chemins.length, "aucun chemin cité dans llms.txt").toBeGreaterThan(0);
    for (const chemin of chemins) {
      expect(servies.has(chemin), `chemin non servi cité dans llms.txt : ${chemin}`).toBe(true);
    }
  });

  it("cite chaque page publiée", () => {
    for (const p of pagesPubliees()) {
      if (p.url === "/") continue;
      expect(LLMS, `page publiée absente de llms.txt : ${p.url}`).toContain(p.url);
    }
  });

  it("n'annonce aucun quota de conversations", () => {
    // `saas/billing.py` publie des limites `conversations` qu'aucun code
    // n'applique : les annoncer serait promettre une règle inexistante.
    expect(LLMS).not.toMatch(/\d[\d\s]*conversations/i);
    expect(LLMS.toLowerCase()).not.toContain("conversations par mois");
  });

  it("n'annonce aucune langue autre que le français", () => {
    // brain.py:46-47 : l'assistant répond en français, point.
    expect(LLMS).not.toMatch(/multilingue|plusieurs langues|en anglais/i);
  });

  it("ne revendique ni clientèle ni résultat client", () => {
    const motifs = [
      /\b(nos|leurs) (clients|utilisateurs|abonn[ée]s)\b/i,
      /\b(déjà|plus de) \d[\d\s]* (entreprises|commerces|clients|utilisateurs)\b/i,
      /\bfont d[ée]j[àa] confiance\b/i,
      /\b(adopt[ée]|utilis[ée]) par \d/i,
    ];
    for (const motif of motifs) {
      expect(LLMS, `revendication interdite (${motif})`).not.toMatch(motif);
    }
  });

  it("n'utilise aucun tiret long", () => {
    expect(LLMS).not.toMatch(/[—–]/);
  });
});
