import { describe, it, expect } from "vitest";
import { capitale, resume } from "@/lib/texte";
import { SECTEURS } from "@/content/secteurs";

describe("resume", () => {
  it("laisse un texte court intact", () => {
    expect(resume("Trois mots ici", 155)).toBe("Trois mots ici");
  });

  it("ne coupe pas au milieu d'un mot", () => {
    const court = resume("alpha bravo charlie delta", 14);
    expect(court).toBe("alpha bravo…");
  });

  it("retire la ponctuation restée en fin de coupure", () => {
    expect(resume("alpha bravo, charlie", 13)).toBe("alpha bravo…");
  });

  it("produit des meta descriptions publiables pour chaque secteur", () => {
    for (const s of SECTEURS) {
      const d = resume(s.enBref);
      expect(d.length, `description trop longue pour ${s.slug}`).toBeLessThanOrEqual(156);
      expect(d.length, `description trop courte pour ${s.slug}`).toBeGreaterThan(80);
      // Aucun tiret long dans le texte publié, y compris après troncature.
      expect(d, `tiret long dans la description de ${s.slug}`).not.toContain("—");
    }
  });
});

describe("capitale", () => {
  it("met la première lettre en majuscule sans toucher au reste", () => {
    expect(capitale("chatbot WhatsApp restaurant")).toBe("Chatbot WhatsApp restaurant");
  });

  it("supporte la chaîne vide", () => {
    expect(capitale("")).toBe("");
  });
});
