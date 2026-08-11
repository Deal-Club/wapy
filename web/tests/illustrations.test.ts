import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ILLUSTRATIONS, PARCOURS_MESSAGE, SILOS_DU_SITE } from "@/content/illustrations";

/**
 * Les illustrations du site.
 *
 * Deux dangers distincts, deux séries d'assertions :
 *
 * 1. la MENTION. Une illustration présentée comme une capture du produit serait
 *    une affirmation produit fausse, la plus difficile à contredire puisqu'une
 *    image ne se discute pas. Le texte de remplacement doit donc dire qu'il
 *    s'agit d'un schéma, et jamais l'inverse ;
 * 2. les DIMENSIONS. Un `width`/`height` qui ne correspond pas au fichier fait
 *    réserver la mauvaise place : le texte saute au chargement, et Next
 *    déforme l'image. On lit donc les dimensions dans les octets du WebP, sans
 *    faire confiance à ce que la donnée déclare.
 */

const RACINE = path.join(__dirname, "..");
const DOSSIER = path.join(RACINE, "public", "images", "illustrations");

/**
 * Largeur et hauteur lues dans l'en-tête d'un WebP sans perte.
 *
 * « RIFF » (4 octets), taille du fichier (4), « WEBP » (4), « VP8L » (4),
 * taille du bloc (4), octet de signature 0x2F, puis 32 bits en petit-boutien
 * dont les 14 premiers portent largeur-1 et les 14 suivants hauteur-1.
 */
function dimensionsWebp(octets: Buffer): { largeur: number; hauteur: number } {
  expect(octets.subarray(0, 4).toString("ascii"), "conteneur RIFF").toBe("RIFF");
  expect(octets.subarray(8, 12).toString("ascii"), "format WEBP").toBe("WEBP");
  expect(octets.subarray(12, 16).toString("ascii"), "bloc VP8L (sans perte)").toBe("VP8L");
  expect(octets[20], "signature VP8L").toBe(0x2f);
  const bits = octets.readUInt32LE(21);
  return { largeur: (bits & 0x3fff) + 1, hauteur: ((bits >> 14) & 0x3fff) + 1 };
}

/** Contenu de tous les fichiers source de `app/` et `components/`. */
function sourcesDesPages(): string {
  const morceaux: string[] = [];
  const parcourir = (dossier: string): void => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, entree.name);
      if (entree.isDirectory()) parcourir(chemin);
      else if (entree.name.endsWith(".tsx")) morceaux.push(readFileSync(chemin, "utf8"));
    }
  };
  parcourir(path.join(RACINE, "app"));
  parcourir(path.join(RACINE, "components"));
  return morceaux.join("\n");
}

describe("catalogue des illustrations", () => {
  it("déclare les deux schémas du site", () => {
    expect(ILLUSTRATIONS).toEqual([PARCOURS_MESSAGE, SILOS_DU_SITE]);
  });

  it("pointe vers un fichier WebP du dossier des illustrations", () => {
    for (const i of ILLUSTRATIONS) {
      expect(i.src).toMatch(/^\/images\/illustrations\/[a-z-]+\.webp$/);
    }
  });

  it("annonce les dimensions réelles de chaque fichier", () => {
    for (const i of ILLUSTRATIONS) {
      const octets = readFileSync(path.join(DOSSIER, path.basename(i.src)));
      expect(dimensionsWebp(octets), `dimensions de ${i.src}`).toEqual({
        largeur: i.largeur,
        hauteur: i.hauteur,
      });
    }
  });
});

describe("une illustration n'est jamais une capture du produit", () => {
  it("ne se présente jamais comme une copie d'écran", () => {
    for (const i of ILLUSTRATIONS) {
      for (const texte of [i.alt, i.legende]) {
        expect(texte.toLowerCase(), `mention trompeuse dans « ${texte} »`).not.toMatch(
          /capture|copie d'écran|screenshot|aperçu de l'interface|vue de l'application/,
        );
      }
    }
  });

  it("dit ce que le schéma montre", () => {
    for (const i of ILLUSTRATIONS) {
      expect(i.alt.toLowerCase(), `texte de remplacement de ${i.src}`).toContain("schéma");
      expect(i.alt.length, `texte de remplacement trop court : ${i.src}`).toBeGreaterThan(60);
      expect(i.legende.length, `légende manquante : ${i.src}`).toBeGreaterThan(20);
    }
  });

  /**
   * Aucun chiffre : une illustration ne peut ni être corrigée ni être sourcée.
   * Les chiffres du site passent par `BlocPreuve`, qui exige une source.
   */
  it("n'avance aucun chiffre et aucun tiret long", () => {
    for (const i of ILLUSTRATIONS) {
      for (const texte of [i.alt, i.legende]) {
        expect(texte, `chiffre dans « ${texte} »`).not.toMatch(/\d/);
        expect(texte, `tiret long dans « ${texte} »`).not.toMatch(/[—–]/);
      }
    }
  });

  /**
   * Aucune page ne dit « capture », quelle que soit l'image.
   *
   * Ce test relit tous les attributs `alt` littéraux de `app/` et
   * `components/`, sans se soucier de la façon dont la source de l'image est
   * écrite. La version précédente ne regardait que les lignes contenant le
   * chemin `images/illustrations` : un `<img src={SILOS_DU_SITE.src}
   * alt="Capture d'ecran du tableau de bord Wapy">` passait sans bruit,
   * puisque la ligne ne portait pas le chemin.
   *
   * Reste hors de portée : un `alt` calculé, dont la valeur ne se lit pas dans
   * la source. C'est le prix d'un contrôle statique, et la raison d'être du
   * test suivant, qui pousse tout le monde vers le catalogue.
   */
  it("n'écrit nulle part un texte de remplacement qui annonce une capture", () => {
    // La chaîne court jusqu'au guillemet de MÊME nature, sinon une apostrophe
    // interne (« vue d'écran ») couperait la valeur avant le mot recherché.
    const alts = [...sourcesDesPages().matchAll(/alt=\{?(["'])([\s\S]*?)\1/g)].map((m) => m[2]);
    expect(alts.length, "aucun attribut alt trouvé : le test ne mesure plus rien").toBeGreaterThan(
      0,
    );
    for (const a of alts) {
      expect(a.toLowerCase(), `texte de remplacement trompeur : « ${a} »`).not.toMatch(
        /capture|copie d'écran|copie d'ecran|screenshot/,
      );
    }
  });

  /**
   * Le texte de remplacement d'un schéma est écrit une fois, dans le catalogue.
   * Une page qui poserait son propre `<Image>` sur un fichier d'illustration
   * pourrait le décrire autrement. Ce test interdit d'écrire le chemin d'une
   * illustration ailleurs que dans `content/illustrations.ts` : tout affichage
   * passe donc par `Figure`, donc par le texte du catalogue.
   */
  it("n'est affichée que par le composant Figure", () => {
    const sources = sourcesDesPages();
    const directs = sources
      .split("\n")
      .filter((l) => l.includes("images/illustrations") && !l.includes("content/illustrations"));
    expect(directs, "chemin d'illustration écrit en dur dans une page").toEqual([]);
    expect(sources).toContain("<Figure illustration={");
  });
});
