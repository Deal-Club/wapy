import { describe, it, expect } from "vitest";
import { CONCURRENTS } from "@/content/concurrents";

/**
 * Ces fiches décrivent des TIERS. Une erreur ici ne dégrade pas un texte
 * marketing : elle publie une affirmation fausse sur l'entreprise de
 * quelqu'un d'autre. La suite ne peut pas vérifier qu'une phrase est vraie,
 * mais elle peut refuser les formes qui rendent l'erreur probable ou
 * invérifiable, et c'est ce qu'elle fait ci-dessous.
 */
describe("fiches concurrents", () => {
  it("retient exactement 4 concurrents", () => {
    expect(CONCURRENTS).toHaveLength(4);
  });

  it("cite une url officielle vérifiable pour chacun", () => {
    for (const c of CONCURRENTS) {
      expect(c.url, `url manquante pour ${c.slug}`).toMatch(/^https:\/\//);
      expect(c.sourceVerif).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  /**
   * Le garde-fou central du comparatif. Un classement dans lequel tous les
   * concurrents n'auraient que des défauts se fait contredire au premier
   * lecteur qui connaît l'un d'eux, et une source qui se contredit cesse
   * d'être citée. L'assertion rend cette page structurellement impossible :
   * pour publier une fiche, il faut avoir trouvé sur le site de l'éditeur au
   * moins une chose qu'il fait mieux.
   */
  it("reconnait au moins un point fort à chaque concurrent", () => {
    for (const c of CONCURRENTS) {
      expect(c.pointsForts.length, `aucun point fort pour ${c.slug}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("n'a pas de slug en double", () => {
    const slugs = CONCURRENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  /**
   * Le slug devient un segment d'URL en tâche 14 (`/comparatifs/wapy-vs-<slug>`).
   * Une majuscule ou un point y produirait une route incohérente avec le reste
   * du silo, et un slug vide une route en double.
   */
  it("porte des slugs utilisables tels quels dans une url", () => {
    for (const c of CONCURRENTS) {
      expect(c.slug, `slug non utilisable en url : ${c.slug}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  /**
   * Un tarif vieillit, et c'est le cas le plus courant d'affirmation devenue
   * fausse sur un tiers. Il n'est donc publiable qu'accompagné de sa date de
   * relevé, et cette date doit être celle de la fiche : deux dates
   * divergentes signalent une fiche mise à jour à moitié.
   */
  it("date chaque tarif publié, à la date de vérification de la fiche", () => {
    for (const c of CONCURRENTS) {
      const releve = c.tarifIndicatif.match(/relevé (\d{4}-\d{2}-\d{2})/);
      expect(releve, `tarif non daté pour ${c.slug}`).not.toBeNull();
      expect(releve?.[1], `date de relevé et sourceVerif divergentes pour ${c.slug}`).toBe(
        c.sourceVerif,
      );
    }
  });

  /**
   * Les limites annoncées doivent rester opposables au site de l'éditeur. On
   * ne peut pas tester la véracité d'une phrase, mais on peut interdire le
   * vocabulaire du jugement de valeur et celui de la supposition, qui sont
   * précisément la façon dont une fiche dérape vers l'affirmation invérifiable.
   */
  it("n'énonce que des limites factuelles, sans jugement ni supposition", () => {
    const interdits = [
      "probablement",
      "sans doute",
      "il est courant",
      "on peut penser",
      "sans intérêt",
      "mauvais",
      "médiocre",
      "dépassé",
      "inadapté",
      "compliqué à utiliser",
    ];
    for (const c of CONCURRENTS) {
      expect(c.pointsFaibles.length, `aucune limite relevée pour ${c.slug}`).toBeGreaterThanOrEqual(
        1,
      );
      for (const limite of c.pointsFaibles) {
        const bas = limite.toLowerCase();
        for (const mot of interdits) {
          expect(bas, `jugement ou supposition dans les limites de ${c.slug} : « ${limite} »`)
            .not.toContain(mot);
        }
      }
    }
  });

  /** Cohérent avec le reste du contenu publié : aucun tiret long. */
  it("n'utilise aucun tiret long", () => {
    for (const c of CONCURRENTS) {
      const texte = [c.nom, c.positionnement, c.tarifIndicatif, ...c.pointsForts, ...c.pointsFaibles]
        .join(" ");
      expect(texte, `tiret long dans la fiche ${c.slug}`).not.toContain("—");
    }
  });
});
