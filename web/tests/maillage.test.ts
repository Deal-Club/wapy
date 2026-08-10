import { describe, it, expect } from "vitest";
import {
  pagesPubliees,
  liensSortants,
  liensEntrants,
  auditMaillage,
  ancre,
} from "@/lib/maillage";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";

describe("ancres déterministes", () => {
  it("rend toujours la même ancre pour la même graine", () => {
    const v = ["chatbot WhatsApp Bénin", "assistant WhatsApp au Bénin", "Wapy au Bénin"];
    expect(ancre(v, "cotonou")).toBe(ancre(v, "cotonou"));
  });

  it("choisit une ancre parmi les variantes fournies", () => {
    const v = ["a", "b", "c"];
    expect(v).toContain(ancre(v, "graine-quelconque"));
  });

  it("répartit les ancres entre plusieurs graines", () => {
    const v = ["a", "b", "c"];
    const obtenues = new Set(
      ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"].map((g) => ancre(v, g)),
    );
    expect(obtenues.size).toBeGreaterThan(1);
  });
});

describe("graphe des pages publiées", () => {
  it("inclut l'accueil, les pays publiés et les secteurs publiés", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(urls).toContain("/");
    for (const p of paysPublies()) expect(urls).toContain(`/chatbot-whatsapp/${p.slug}`);
    for (const s of secteursPublies()) expect(urls).toContain(`/secteurs/${s.slug}`);
  });

  it("exclut les villes non publiées", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(urls.some((u) => u.startsWith("/chatbot-whatsapp/benin/"))).toBe(false);
  });

  it("n'a pas d'url en double", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("liens", () => {
  it("ne pointe que vers des pages publiées", () => {
    const publiees = new Set(pagesPubliees().map((p) => p.url));
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(publiees.has(lien.href), `${page.url} pointe vers ${lien.href} non publiée`).toBe(true);
      }
    }
  });

  it("ne crée jamais d'auto-lien", () => {
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(lien.href).not.toBe(page.url);
      }
    }
  });

  it("donne une ancre non vide à chaque lien", () => {
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(lien.ancre.trim().length).toBeGreaterThan(2);
      }
    }
  });

  it("rend liensEntrants cohérent avec liensSortants", () => {
    const cible = `/secteurs/${secteursPublies()[0].slug}`;
    const entrants = liensEntrants(cible);
    for (const e of entrants) {
      expect(liensSortants(e.href).some((l) => l.href === cible)).toBe(true);
    }
  });
});

// G2 : garde-fou du maillage
describe("audit de maillage", () => {
  it("ne laisse aucune page publiée sous 3 liens entrants", () => {
    const defauts = auditMaillage();
    expect(defauts, `pages sous-maillées : ${JSON.stringify(defauts)}`).toEqual([]);
  });
});
