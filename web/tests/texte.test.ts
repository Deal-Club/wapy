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
  it("colle la préposition portée par la donnée devant le nom", () => {
    expect(auPays({ nom: "Madagascar", preposition: "à" })).toBe("à Madagascar");
    expect(auPays({ nom: "Comores", preposition: "aux" })).toBe("aux Comores");
  });

  /**
   * Le tableau attendu est écrit à la main. Il ne teste plus une fonction (qui
   * se borne désormais à concaténer) mais la DONNÉE : `Pays.preposition` est le
   * seul endroit où la décision se prend, et une valeur fausse produirait « au
   * Côte d'Ivoire » sur toute la page sans qu'aucun autre test ne bronche.
   *
   * L'union fermée de `content/types.ts` oblige déjà le contributeur qui ajoute
   * un pays à choisir une préposition ; ce test vérifie qu'il a choisi la bonne
   * pour les cinq pays du silo, et échoue tant qu'un nouveau pays n'y figure pas.
   */
  it("donne la bonne préposition pour chacun des pays du silo", () => {
    const attendu: Record<string, string> = {
      benin: "au Bénin",
      "cote-divoire": "en Côte d'Ivoire",
      senegal: "au Sénégal",
      cameroun: "au Cameroun",
      togo: "au Togo",
    };
    expect(Object.keys(attendu).length, "pays ajouté sans entrée dans le test").toBe(PAYS.length);
    for (const p of PAYS) {
      expect(attendu[p.slug], `pays non couvert par le test : ${p.slug}`).toBeTypeOf("string");
      expect(auPays(p), `préposition de ${p.slug}`).toBe(attendu[p.slug]);
    }
  });
});
