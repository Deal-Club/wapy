import { describe, it, expect } from "vitest";
import { CONCURRENTS } from "@/content/concurrents";

/**
 * Ces fiches décrivent des TIERS. Une erreur ici ne dégrade pas un texte
 * marketing : elle publie une affirmation fausse sur l'entreprise de
 * quelqu'un d'autre. La suite ne peut pas vérifier qu'une phrase est vraie,
 * mais elle peut refuser les formes qui rendent l'erreur probable ou
 * invérifiable, et c'est ce qu'elle fait ci-dessous.
 */

/** Comparaison insensible à la casse ET aux accents : « inadapté » et « inadapte » sont le même mot. */
function normalise(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Le garde-fou vise des TOURNURES, pas une liste d'adjectifs.
 *
 * Une liste de mots ne tient pas : la première version de ce test interdisait
 * « inadapté » et laissait passer « moins adapté aux petites structures », qui
 * dit exactement la même chose sans être opposable au site de l'éditeur. Ce
 * qui distingue une limite factuelle d'un jugement n'est pas le vocabulaire,
 * c'est la forme : un comparatif sans terme de comparaison (« moins X »), une
 * modalisation (« pourrait », « semble »), un manque (« manque de »), ou une
 * appréciation nue (« cher », « médiocre »). Une borne chiffrée, elle, passe :
 * « plafonnée à 3 000 messages par mois » se vérifie sur la page tarifs.
 *
 * `tournureInterdite` est éprouvée par son propre test plus bas, sur les
 * contre-exemples qui avaient franchi la version précédente.
 */
const TOURNURES: { nom: string; motif: RegExp }[] = [
  // « moins adapté », « peu clair », « trop rigide », « assez limité » : un
  // comparatif dont le second terme n'est jamais donné.
  { nom: "comparatif sans terme de comparaison", motif: /\b(moins|peu|trop|assez|plutot)\s+\p{L}/u },
  // « pourrait convenir », « semble limité », « risque de »  : une conjecture.
  {
    nom: "conjecture",
    motif: /\b(pourrait|pourraient|semble|semblent|parait|paraissent|risque de|risquent de|probablement|sans doute|il est courant|on peut penser|vraisemblablement)\b/u,
  },
  // « manque de souplesse » : un défaut posé sans référence mesurable.
  { nom: "manque non chiffré", motif: /\bmanque(nt)? de\b/u },
  // Appréciations nues, invérifiables par construction.
  {
    nom: "appreciation",
    motif: /\b(mauvais|mauvaise|mediocre|depasse|depassee|obsolete|decevant|decevante|inadapte|inadaptee|usine a gaz|cher|chere|couteux|couteuse|lourd a utiliser|complique)\b/u,
  },
];

function tournureInterdite(texte: string): string | null {
  const t = normalise(texte);
  for (const { nom, motif } of TOURNURES) {
    if (motif.test(t)) return nom;
  }
  return null;
}

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

  it("n'énonce que des limites factuelles, sans jugement ni conjecture", () => {
    for (const c of CONCURRENTS) {
      expect(c.pointsFaibles.length, `aucune limite relevée pour ${c.slug}`).toBeGreaterThanOrEqual(
        1,
      );
      for (const limite of c.pointsFaibles) {
        expect(
          tournureInterdite(limite),
          `tournure non opposable dans les limites de ${c.slug} : « ${limite} »`,
        ).toBeNull();
      }
    }
  });

  /**
   * Le test précédent ne vaut que ce que vaut son détecteur. Celui-ci le met à
   * l'épreuve, à commencer par le contre-exemple qui avait franchi la version
   * à liste de mots interdits, et vérifie symétriquement qu'une borne chiffrée
   * n'est pas prise pour un jugement.
   */
  it("attrape les tournures visées, et laisse passer les bornes chiffrées", () => {
    const aRejeter = [
      "moins adapté aux petites structures",
      "peu adapté à une PME",
      "trop rigide pour un petit commerce",
      "manque de souplesse",
      "pourrait ne pas convenir",
      "semble limité",
      "probablement plus lent",
      "solution chère pour le marché visé",
    ];
    for (const exemple of aRejeter) {
      expect(tournureInterdite(exemple), `tournure non détectée : « ${exemple} »`).not.toBeNull();
    }

    const aAccepter = [
      "Tarifs publiés en euros uniquement, aucun montant en francs CFA",
      "Une seule formule publiée, plafonnée à 3 000 messages WhatsApp par mois",
      "Engagement minimum de 3 mois annoncé sur la page tarifs",
      "Le canal WhatsApp est facturé 50 EUR par mois en supplément",
      "Aucun tarif publié : la page « Pricing » est un formulaire « Demandez un devis »",
    ];
    for (const exemple of aAccepter) {
      expect(tournureInterdite(exemple), `faux positif sur : « ${exemple} »`).toBeNull();
    }
  });

  /**
   * Le schéma décrit le concurrent, pas la comparaison. Une incise sur Wapy
   * glissée dans un `pointsForts` n'a aucune contrepartie dans le type, donc
   * personne ne la relit quand Wapy évolue : c'est ainsi qu'une fiche s'est
   * mise à affirmer que Wapy ne traitait que WhatsApp, alors qu'il expose
   * aussi un chat web. La comparaison appartient à la tâche 14.
   */
  it("décrit le concurrent sans y mêler d'incise sur Wapy", () => {
    for (const c of CONCURRENTS) {
      const champs = [
        c.positionnement,
        c.tarifIndicatif,
        ...c.pointsForts,
        ...c.pointsFaibles,
      ];
      for (const champ of champs) {
        expect(champ, `incise comparative sur Wapy dans la fiche ${c.slug}`).not.toMatch(/wapy/i);
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
