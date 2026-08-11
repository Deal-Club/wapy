import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { POSTS, getPost, tagFor, related } from "@/lib/blog";

// Empreinte du contenu intégral de POSTS (tous les champs, y compris `body`).
// Un changement de longueur passerait les autres tests ; une altération d'un
// seul caractère (accent, apostrophe, balise) fait échouer celui-ci.
//
// La valeur a changé une fois, à la migration des 11 articles sectoriels vers
// `/secteurs/*` : POSTS est passé de 12 entrées à 1, donc la chaîne empreintée
// n'est plus la même. C'est le seul motif légitime de mise à jour de cette
// constante — sinon, c'est le contenu d'un article restant qui a bougé, et
// c'est lui qu'il faut regarder, pas l'empreinte.
// Empreinte précédente (12 articles), gardée pour trace :
// 94e6e3b5aa06dbd15a1413fd23e8dcb054d302e2c13d646988164ff3b6f05600
const POSTS_SHA256 = "98d0e51b08a04ab3ca50da07f63e40966bbad9a9bd2d378fb1b8f3c1e590b56c";

// Les 11 articles sectoriels ne sont plus des articles : ils sont devenus les
// pages `/secteurs/<slug>` et leurs anciennes URL sont redirigées
// (cf. tests/redirections.test.ts).
const SLUGS_ATTENDUS = ["repondre-automatiquement-clients-whatsapp"];

// Slugs partis vers le silo secteurs. Leur absence du blog est une propriété
// voulue : un article et une page secteur sur le même mot-clé se cannibalisent.
const SLUGS_MIGRES = [
  "chatbot-whatsapp-restaurant",
  "assistant-whatsapp-salon-de-beaute",
  "chatbot-whatsapp-boutique",
  "assistant-whatsapp-hotel",
  "assistant-whatsapp-clinique-pharmacie",
  "chatbot-whatsapp-immobilier",
  "assistant-whatsapp-ecole",
  "assistant-whatsapp-artisan",
  "assistant-whatsapp-agence-voyage",
  "assistant-whatsapp-evenementiel-traiteur",
  "assistant-whatsapp-garage-auto",
];

describe("articles de blog", () => {
  it("conserve tous les slugs existants", () => {
    for (const slug of SLUGS_ATTENDUS) {
      expect(POSTS.map((p) => p.slug), `slug manquant : ${slug}`).toContain(slug);
    }
  });

  it("ne garde aucun article migré vers le silo secteurs", () => {
    const slugs = new Set(POSTS.map((p) => p.slug));
    for (const slug of SLUGS_MIGRES) {
      expect(slugs.has(slug), `article migré encore publié : ${slug}`).toBe(false);
      expect(getPost(slug), `getPost renvoie encore ${slug}`).toBeUndefined();
    }
  });

  it("n'a pas de slug en double", () => {
    const slugs = POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("garde un corps non vide et des métadonnées complètes", () => {
    for (const p of POSTS) {
      expect(p.body.length, `corps vide pour ${p.slug}`).toBeGreaterThan(500);
      expect(p.title.length).toBeGreaterThan(10);
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.keywords.length).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.readingMin).toBeGreaterThan(0);
    }
  });

  it("expose les helpers inchangés", () => {
    expect(tagFor("repondre-automatiquement-clients-whatsapp")).toBe("Guide");
    expect(tagFor("slug-inconnu")).toBe("Article");
    expect(getPost("repondre-automatiquement-clients-whatsapp")?.slug).toBe(
      "repondre-automatiquement-clients-whatsapp",
    );
    expect(getPost("slug-inconnu")).toBeUndefined();
    // `related` ne peut plus rendre 3 articles : le blog n'en compte plus qu'un,
    // et un article n'est jamais son propre article lié. On vérifie donc la
    // règle qui tient quel que soit le nombre d'articles, et le plafond réel.
    const lies = related("repondre-automatiquement-clients-whatsapp", 3);
    expect(lies.map((p) => p.slug)).not.toContain("repondre-automatiquement-clients-whatsapp");
    expect(lies.length).toBe(Math.min(3, POSTS.length - 1));
  });

  it("préserve le contenu exact de tous les articles (empreinte sha256)", () => {
    const hash = createHash("sha256").update(JSON.stringify(POSTS)).digest("hex");
    expect(hash).toBe(POSTS_SHA256);
  });
});
