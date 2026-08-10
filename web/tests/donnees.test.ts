import { describe, it, expect } from "vitest";
import { SOURCES, sourceExiste } from "@/content/sources";
import { PAYS, getPays, paysPublies } from "@/content/pays";

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

/** Slugs de secteurs prévus par le plan (tâche 3). */
const SECTEURS_ATTENDUS = [
  "restaurant",
  "salon-de-beaute",
  "boutique",
  "hotel",
  "clinique-pharmacie",
  "immobilier",
  "ecole",
  "artisan",
  "agence-voyage",
  "evenementiel-traiteur",
  "garage-auto",
];

describe("données pays", () => {
  it("contient les 5 pays de la vague 1", () => {
    expect(PAYS.map((p) => p.slug).sort()).toEqual(
      ["benin", "cameroun", "cote-divoire", "senegal", "togo"],
    );
  });

  it("n'a pas de slug en double", () => {
    const slugs = PAYS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // G1 : aucun chiffre sans source valide
  it("référence une source existante pour chaque population", () => {
    for (const p of PAYS) {
      if (p.population) {
        expect(sourceExiste(p.population.source)).toBe(true);
        expect(p.population.annee).toBeGreaterThan(1990);
        expect(p.population.valeur).toBeGreaterThan(0);
      }
    }
  });

  // G3 : angle rédigé
  it("a un angle d'au moins 150 caractères pour chaque pays", () => {
    for (const p of PAYS) {
      expect(p.angle.length, `angle trop court pour ${p.slug}`).toBeGreaterThanOrEqual(150);
    }
  });

  it("a un angle différent pour chaque pays", () => {
    const angles = PAYS.map((p) => p.angle);
    expect(new Set(angles).size).toBe(angles.length);
  });

  // AEO : réponse directe courte
  it("a un enBref de moins de 50 mots", () => {
    for (const p of PAYS) {
      expect(p.enBref.trim().split(/\s+/).length, `enBref trop long pour ${p.slug}`).toBeLessThan(50);
    }
  });

  it("propose 5 à 8 questions de FAQ par pays", () => {
    for (const p of PAYS) {
      expect(p.faq.length).toBeGreaterThanOrEqual(5);
      expect(p.faq.length).toBeLessThanOrEqual(8);
    }
  });

  it("ne pose jamais deux fois la même question", () => {
    const questions = PAYS.flatMap((p) => p.faq.map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
  });

  // AEO : réponses de 40 à 60 mots (contrainte du type QuestionReponse).
  // Exception assumée : la FAQ du Bénin est reprise mot pour mot du brief de la
  // tâche 2, où les réponses tiennent en 28 à 37 mots. On ne la réécrit pas ici,
  // mais on n'assouplit pas le gabarit pour autant sur le contenu rédigé.
  const SOUS_GABARIT_HERITE = ["benin"];

  it("répond en 40 à 60 mots à chaque question", () => {
    for (const p of PAYS) {
      for (const f of p.faq) {
        const mots = f.r.trim().split(/\s+/).length;
        if (!SOUS_GABARIT_HERITE.includes(p.slug)) {
          expect(mots, `réponse trop courte (${mots} mots) dans ${p.slug} : ${f.q}`)
            .toBeGreaterThanOrEqual(40);
        }
        expect(mots, `réponse trop longue (${mots} mots) dans ${p.slug} : ${f.q}`)
          .toBeLessThanOrEqual(60);
      }
    }
  });

  it("n'utilise pas de tiret long dans le contenu publié", () => {
    for (const p of PAYS) {
      const texte = [p.enBref, p.angle, ...p.faq.map((f) => f.q + f.r)].join(" ");
      expect(texte, `tiret long dans ${p.slug}`).not.toContain("—");
    }
  });

  it("ne revendique aucun client ni résultat client", () => {
    const interdits =
      /nos clients|nos utilisateurs|témoignage|ont vu leurs|ont augmenté|des centaines d'entreprises|milliers d'entreprises/i;
    for (const p of PAYS) {
      const texte = [p.enBref, p.angle, ...p.faq.map((f) => f.q + " " + f.r)].join(" ");
      expect(texte, `revendication client dans ${p.slug}`).not.toMatch(interdits);
    }
  });

  it("expose 3 secteurs phares connus par pays", () => {
    for (const p of PAYS) {
      expect(p.secteursPhares.length, `secteursPhares incomplet pour ${p.slug}`).toBe(3);
      expect(new Set(p.secteursPhares).size).toBe(3);
      for (const s of p.secteursPhares) {
        expect(SECTEURS_ATTENDUS, `secteur inconnu ${s} dans ${p.slug}`).toContain(s);
      }
    }
  });

  // G2 (maillage) : les 15 emplacements doivent couvrir tous les secteurs prévus
  it("couvre l'ensemble des secteurs prévus via les secteurs phares", () => {
    const couverts = new Set(PAYS.flatMap((p) => p.secteursPhares));
    const orphelins = SECTEURS_ATTENDUS.filter((s) => !couverts.has(s));
    expect(orphelins, `secteurs sans lien entrant : ${orphelins.join(", ")}`).toEqual([]);
  });

  it("renseigne les champs d'identité de chaque pays", () => {
    for (const p of PAYS) {
      expect(p.indicatif, `indicatif invalide pour ${p.slug}`).toMatch(/^\+\d{3}$/);
      expect(["XOF", "XAF"]).toContain(p.monnaie);
      expect(p.capitale.length).toBeGreaterThan(2);
      expect(p.mobileMoney.length).toBeGreaterThanOrEqual(2);
      expect(p.operateurs.length).toBeGreaterThanOrEqual(2);
      expect(p.particularites.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("expose getPays et paysPublies", () => {
    expect(getPays("benin")?.nom).toBe("Bénin");
    expect(getPays("inconnu")).toBeUndefined();
    expect(paysPublies().every((p) => p.publie)).toBe(true);
  });
});
