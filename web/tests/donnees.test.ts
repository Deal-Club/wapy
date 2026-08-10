import { describe, it, expect } from "vitest";
import { SOURCES, sourceExiste } from "@/content/sources";

describe("registre des sources", () => {
  it("indexe chaque source sous son propre id", () => {
    for (const [cle, src] of Object.entries(SOURCES)) {
      expect(src.id).toBe(cle);
    }
  });

  it("expose des sources avec url et date de consultation", () => {
    for (const src of Object.values(SOURCES)) {
      expect(src.label.length).toBeGreaterThan(3);
      expect(src.url).toMatch(/^https?:\/\//);
      expect(src.consulteLe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("reconnait une source connue et rejette une source inconnue", () => {
    expect(sourceExiste("insae-benin-rgph4")).toBe(true);
    expect(sourceExiste("source-qui-nexiste-pas")).toBe(false);
  });
});
