import { describe, it, expect } from "vitest";
import { auPays, capitale, resume } from "@/lib/texte";
import { SECTEURS } from "@/content/secteurs";
import { PAYS } from "@/content/pays";

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
      // On mesure la DONNÉE, pas la sortie : `resume` borne mécaniquement sa
      // sortie à `max` caractères, donc une assertion sur `d.length` ne peut
      // pas échouer, quelles que soient les données. Elle donnerait une fausse
      // impression de contrôle. Ce qui peut vraiment déraper est en amont,
      // dans `content/secteurs.ts` : un `enBref` trop court pour remplir une
      // description, ou plus long que le gabarit des 50 mots annoncé par
      // `content/types.ts`.
      expect(s.enBref.length, `enBref trop court pour une description : ${s.slug}`)
        .toBeGreaterThan(155);
      expect(s.enBref.length, `enBref au-delà du gabarit des 50 mots : ${s.slug}`)
        .toBeLessThanOrEqual(300);
      // La description reste un préfixe exact de la donnée, jamais une
      // reformulation : seule l'ellipse finale s'ajoute.
      expect(d.endsWith("…"), `coupure non marquée pour ${s.slug}`).toBe(true);
      expect(s.enBref.startsWith(d.slice(0, -1)), `description mal formée : ${s.slug}`).toBe(true);
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

describe("auPays", () => {
  it("emploie « en » devant un nom de pays féminin", () => {
    expect(auPays("Côte d'Ivoire")).toBe("en Côte d'Ivoire");
    expect(auPays("Guinée")).toBe("en Guinée");
  });

  it("emploie « au » devant un nom de pays masculin", () => {
    expect(auPays("Bénin")).toBe("au Bénin");
    expect(auPays("Sénégal")).toBe("au Sénégal");
    expect(auPays("Togo")).toBe("au Togo");
  });

  it("respecte les exceptions masculines terminées par un « e »", () => {
    expect(auPays("Mozambique")).toBe("au Mozambique");
    expect(auPays("Zimbabwe")).toBe("au Zimbabwe");
  });

  /**
   * Le tableau attendu est écrit à la main, pas dérivé de la fonction : c'est
   * la seule façon de tester une règle grammaticale, dont aucune donnée du
   * dépôt ne porte la vérité (`Pays` n'a pas de champ de genre).
   */
  it("donne la bonne préposition pour chacun des pays du silo", () => {
    const attendu: Record<string, string> = {
      benin: "au Bénin",
      "cote-divoire": "en Côte d'Ivoire",
      senegal: "au Sénégal",
      cameroun: "au Cameroun",
      togo: "au Togo",
    };
    for (const p of PAYS) {
      expect(attendu[p.slug], `pays non couvert par le test : ${p.slug}`).toBeTypeOf("string");
      expect(auPays(p.nom), `préposition de ${p.slug}`).toBe(attendu[p.slug]);
    }
  });
});
