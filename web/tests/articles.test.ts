import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { POSTS, getPost, tagFor, related } from "@/lib/blog";

// Empreinte du contenu intégral de POSTS (tous les champs, y compris `body`),
// figée AVANT le déplacement de lib/blog.ts vers content/articles/*.ts. Un
// changement de longueur passerait les autres tests ; une altération d'un
// seul caractère (accent, apostrophe, balise) fait échouer celui-ci.
const POSTS_SHA256 = "94e6e3b5aa06dbd15a1413fd23e8dcb054d302e2c13d646988164ff3b6f05600";

const SLUGS_ATTENDUS = [
  "repondre-automatiquement-clients-whatsapp",
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
    expect(tagFor("chatbot-whatsapp-restaurant")).toBe("Restauration");
    expect(tagFor("slug-inconnu")).toBe("Article");
    expect(getPost("chatbot-whatsapp-restaurant")?.slug).toBe("chatbot-whatsapp-restaurant");
    expect(getPost("slug-inconnu")).toBeUndefined();
    expect(related("chatbot-whatsapp-restaurant", 3)).toHaveLength(3);
    expect(related("chatbot-whatsapp-restaurant", 3).map((p) => p.slug)).not.toContain(
      "chatbot-whatsapp-restaurant",
    );
  });

  it("préserve le contenu exact de tous les articles (empreinte sha256)", () => {
    const hash = createHash("sha256").update(JSON.stringify(POSTS)).digest("hex");
    expect(hash).toBe(POSTS_SHA256);
  });
});
