import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

import ImageAccueil, { size as tailleAccueil, contentType as typeAccueil } from "@/app/opengraph-image";
import ImagePays, {
  generateStaticParams as paramsPays,
  size as taillePays,
} from "@/app/chatbot-whatsapp/[pays]/opengraph-image";
import ImageSecteur, {
  generateStaticParams as paramsSecteur,
  size as tailleSecteur,
} from "@/app/secteurs/[secteur]/opengraph-image";
import ImageComparatif, {
  generateStaticParams as paramsComparatif,
  size as tailleComparatif,
} from "@/app/comparatif/[slug]/opengraph-image";

import { metadata as metaAccueil } from "@/app/page";
import { metadata as metaAPropos } from "@/app/a-propos/page";
import { metadata as metaTarifs } from "@/app/tarifs/page";
import { metadata as metaFaq } from "@/app/faq/page";
import { metadata as metaCommentCaMarche } from "@/app/comment-ca-marche/page";
import { metadata as metaBlog } from "@/app/blog/page";
import { generateMetadata as metaArticle } from "@/app/blog/[slug]/page";
import { metadata as metaIndexPays } from "@/app/chatbot-whatsapp/page";
import { metadata as metaIndexSecteurs } from "@/app/secteurs/page";
import { metadata as metaIndexComparatif } from "@/app/comparatif/page";

import { POSTS } from "@/content/articles";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import {
  IMAGE_OG_PAR_DEFAUT,
  PIED_OG,
  TAILLE_OG,
  contenuAccueil,
  contenuComparatif,
  contenuPays,
  contenuSecteur,
  tailleTitre,
  type ContenuOG,
} from "@/lib/og";

/**
 * Les images OpenGraph du site.
 *
 * Deux niveaux d'exigence, parce qu'ils n'attrapent pas les mêmes pannes :
 *
 * 1. le RENDU. Une route d'image peut exister, compiler, s'exporter au build et
 *    ne produire aucun pixel : Satori lève sur un `div` à plusieurs enfants sans
 *    `display: flex`, sur une propriété CSS qu'il ne connaît pas, ou sur une
 *    police absente. On décode donc l'en-tête du PNG produit et on lit ses
 *    dimensions réelles ;
 * 2. le TEXTE affiché. Ces images sont lues par des humains sur WhatsApp et
 *    LinkedIn : elles suivent les mêmes règles que le reste du site (aucun
 *    tiret long, aucun prix, aucun quota de conversations).
 *
 * Le rendu prend une à deux secondes par image (initialisation des moteurs
 * wasm de Satori et resvg) : on rend un échantillon représentatif de chaque
 * silo, pas les 25 images, et on vérifie séparément que les 25 paramètres
 * attendus sont bien déclarés.
 */

const DELAI_RENDU = 60_000;

/**
 * Largeur et hauteur lues dans le bloc IHDR d'un PNG.
 *
 * Signature PNG (8 octets), longueur du chunk (4), type « IHDR » (4), puis
 * largeur et hauteur en entiers 32 bits big-endian. Lire ces octets prouve que
 * le fichier est un vrai PNG aux bonnes dimensions, là où un simple
 * `length > 0` passerait sur n'importe quoi.
 */
function dimensionsPng(octets: Uint8Array): { largeur: number; hauteur: number } {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  expect(Array.from(octets.slice(0, 8)), "signature PNG").toEqual(signature);
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  return { largeur: vue.getUint32(16), hauteur: vue.getUint32(20) };
}

/** Rend une route d'image et renvoie les octets du PNG. */
async function rendre(reponse: Response): Promise<Uint8Array> {
  expect(reponse.headers.get("content-type")).toBe("image/png");
  return new Uint8Array(await reponse.arrayBuffer());
}

describe("routes d'images OpenGraph", () => {
  it("déclare partout le format 1200x630 attendu par les réseaux sociaux", () => {
    expect(TAILLE_OG).toEqual({ width: 1200, height: 630 });
    for (const taille of [tailleAccueil, taillePays, tailleSecteur, tailleComparatif]) {
      expect(taille).toEqual(TAILLE_OG);
    }
    expect(typeAccueil).toBe("image/png");
  });

  it("couvre chaque pays, secteur et comparatif publié", () => {
    expect(paramsPays()).toEqual(paysPublies().map((p) => ({ pays: p.slug })));
    expect(paramsSecteur()).toEqual(secteursPublies().map((s) => ({ secteur: s.slug })));
    expect(paramsComparatif()).toEqual(COMPARATIFS_PUBLIES.map((c) => ({ slug: c.slug })));
  });

  it(
    "rend un PNG 1200x630 pour l'accueil",
    async () => {
      const octets = await rendre(ImageAccueil());
      expect(dimensionsPng(octets)).toEqual({ largeur: 1200, hauteur: 630 });
    },
    DELAI_RENDU,
  );

  it(
    "rend un PNG 1200x630 pour un pays, un secteur et un comparatif",
    async () => {
      const rendus = [
        ImagePays({ params: { pays: paysPublies()[0].slug } }),
        ImageSecteur({ params: { secteur: secteursPublies()[0].slug } }),
        ImageComparatif({ params: { slug: COMPARATIFS_PUBLIES[0].slug } }),
      ];
      for (const rendu of rendus) {
        expect(dimensionsPng(await rendre(rendu))).toEqual({ largeur: 1200, hauteur: 630 });
      }
    },
    DELAI_RENDU,
  );

  /**
   * Une URL de page supprimée continue de circuler dans les conversations
   * WhatsApp longtemps après. L'aperçu doit rester une image du site, pas une
   * erreur de rendu.
   */
  it(
    "retombe sur l'image générique pour un slug inconnu",
    async () => {
      const octets = await rendre(ImagePays({ params: { pays: "atlantide" } }));
      expect(dimensionsPng(octets)).toEqual({ largeur: 1200, hauteur: 630 });
    },
    DELAI_RENDU,
  );
});

/**
 * Tous les textes qui finissent dans un pixel d'image OG, silo par silo.
 * `PIED_OG` s'affiche sur chacune d'elles.
 */
function tousLesContenus(): ContenuOG[] {
  return [
    contenuAccueil(),
    ...paysPublies().map(contenuPays),
    ...secteursPublies().map(contenuSecteur),
    ...COMPARATIFS_PUBLIES.map(contenuComparatif),
  ];
}

function toutesLesChaines(): string[] {
  const chaines = tousLesContenus().flatMap((c) => [c.surtitre, c.titre, c.accroche ?? ""]);
  return [...chaines, PIED_OG, IMAGE_OG_PAR_DEFAUT.alt];
}

describe("texte affiché dans les images OpenGraph", () => {
  it("produit un contenu pour les 25 images du site", () => {
    // 1 accueil + 5 pays + 11 secteurs + 8 comparatifs.
    expect(tousLesContenus()).toHaveLength(25);
  });

  it("n'utilise aucun tiret long", () => {
    for (const c of toutesLesChaines()) {
      expect(c, `tiret long : ${c}`).not.toMatch(/[—–]/);
    }
  });

  /**
   * Un montant ou un nombre de conversations gravé dans une image survit à la
   * grille tarifaire : l'image reste en cache chez le réseau social et
   * personne ne la voit vieillir. Les prix vivent sur `/tarifs`, qui se corrige.
   */
  it("n'affiche ni prix ni quota de conversations", () => {
    for (const c of toutesLesChaines()) {
      expect(c, `montant : ${c}`).not.toMatch(/\d[\d\s.,]*\s*(FCFA|XOF|XAF|€|\$)/i);
      expect(c, `prix : ${c}`).not.toMatch(/\b(prix|tarif|gratuit|par mois|\/mois)\b/i);
      expect(c, `quota : ${c}`).not.toMatch(/\d+\s*(conversations?|messages?)/i);
    }
  });

  it("garde chaque titre dans un corps qui tient dans le cadre", () => {
    for (const c of tousLesContenus()) {
      const corps = tailleTitre(c.titre);
      expect(corps).toBeGreaterThanOrEqual(50);
      // Largeur utile 1048 px (1200 moins deux marges de 76), trois lignes au
      // plus. Le facteur 0,55 est la largeur moyenne d'un caractère de Geist
      // rapporté à son corps.
      expect(c.titre.length * corps * 0.55, `titre trop long : ${c.titre}`).toBeLessThanOrEqual(
        1048 * 3,
      );
    }
  });

  it("distingue chaque page par son titre", () => {
    const titres = tousLesContenus().map((c) => `${c.surtitre} / ${c.titre}`);
    expect(new Set(titres).size).toBe(titres.length);
  });
});

/**
 * Next attache l'image d'un `opengraph-image.tsx` à l'objet `openGraph` du
 * segment où le fichier vit. Une page qui exporte son propre `openGraph`
 * REMPLACE celui de ses parents : sans déclaration explicite, `/tarifs`
 * partait sans `og:image` alors que `app/opengraph-image.tsx` existait.
 *
 * Ces pages n'ont pas d'image colocalisée : leur `images` doit être écrit à la
 * main. Les pays, secteurs et comparatifs, eux, ont la leur dans leur segment.
 *
 * Les articles de blog sont ÉVALUÉS, pas seulement listés : leur objet naît
 * d'un `generateMetadata`, pas d'un `metadata` statique. Une première version
 * de ce fichier les avait oubliés pour cette raison, et retirer la ligne
 * `images` de `app/blog/[slug]/page.tsx` laissait la suite entièrement verte.
 */
const PAGES_SANS_IMAGE_COLOCALISEE = [
  { url: "/a-propos", meta: metaAPropos },
  { url: "/tarifs", meta: metaTarifs },
  { url: "/faq", meta: metaFaq },
  { url: "/comment-ca-marche", meta: metaCommentCaMarche },
  { url: "/blog", meta: metaBlog },
  { url: "/chatbot-whatsapp", meta: metaIndexPays },
  { url: "/secteurs", meta: metaIndexSecteurs },
  { url: "/comparatif", meta: metaIndexComparatif },
  ...POSTS.map((p) => ({
    url: `/blog/${p.slug}`,
    meta: metaArticle({ params: { slug: p.slug } }),
  })),
];

describe("déclaration de l'image OpenGraph dans les métadonnées", () => {
  it("déclare l'image de repli sur chaque page qui n'en a pas dans son segment", () => {
    for (const { url, meta } of PAGES_SANS_IMAGE_COLOCALISEE) {
      const images = meta.openGraph?.images;
      expect(Array.isArray(images) ? images : [], `og:image manquant sur ${url}`).toContain(
        IMAGE_OG_PAR_DEFAUT,
      );
    }
  });

  /**
   * L'accueil vit dans le même segment que `app/opengraph-image.tsx` : Next lui
   * attache l'image tout seul. La déclarer ici la dupliquerait.
   */
  it("laisse l'accueil hériter de l'image de son propre segment", () => {
    expect(metaAccueil.openGraph?.images).toBeUndefined();
  });

  /**
   * La liste ci-dessus est écrite à la main : une page ajoutée demain pourrait
   * ne pas y figurer, et repartir sans aperçu sans que rien ne le dise. Ce test
   * relit donc l'arborescence : toute page qui exporte un `openGraph` sans
   * `opengraph-image.tsx` dans SON segment doit nommer `IMAGE_OG_PAR_DEFAUT`.
   */
  it("ne laisse aucune page exporter un openGraph sans image", () => {
    const app = path.join(__dirname, "..", "app");
    const oubliees: string[] = [];
    const parcourir = (dossier: string): void => {
      const entrees = readdirSync(dossier, { withFileTypes: true });
      const aSonImage = entrees.some((e) => e.name === "opengraph-image.tsx");
      for (const e of entrees) {
        const chemin = path.join(dossier, e.name);
        if (e.isDirectory()) {
          parcourir(chemin);
          continue;
        }
        if (e.name !== "page.tsx") continue;
        const source = readFileSync(chemin, "utf8");
        if (!source.includes("openGraph:")) continue;
        // La déclaration, pas le simple import : retirer la ligne `images` en
        // laissant l'import en place ne doit pas passer inaperçu.
        if (aSonImage || source.includes("images: [IMAGE_OG_PAR_DEFAUT]")) continue;
        oubliees.push(path.relative(app, chemin).split(path.sep).join("/"));
      }
    };
    parcourir(app);
    expect(oubliees, "pages qui repartiraient sans og:image").toEqual([]);
  });

  it("pointe vers une URL relative, résolue contre metadataBase", () => {
    expect(IMAGE_OG_PAR_DEFAUT.url).toBe("/opengraph-image");
    expect(IMAGE_OG_PAR_DEFAUT.width).toBe(1200);
    expect(IMAGE_OG_PAR_DEFAUT.height).toBe(630);
    expect(IMAGE_OG_PAR_DEFAUT.alt.length).toBeGreaterThan(20);
  });
});
