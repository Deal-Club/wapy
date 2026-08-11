import { describe, it, expect } from "vitest";
import { metadata as metaIndex } from "@/app/secteurs/page";
import { generateMetadata as metaSecteur } from "@/app/secteurs/[secteur]/page";
import { metadata as metaIndexPays } from "@/app/chatbot-whatsapp/page";
import { generateMetadata as metaPays } from "@/app/chatbot-whatsapp/[pays]/page";
import { metadata as metaIndexComparatif } from "@/app/comparatif/page";
import { generateMetadata as metaComparatif } from "@/app/comparatif/[slug]/page";
import { metadata as metaAccueil } from "@/app/page";
import { metadata as metaAPropos } from "@/app/a-propos/page";
import { metadata as metaTarifs } from "@/app/tarifs/page";
import { metadata as metaFaq } from "@/app/faq/page";
import { metadata as metaCommentCaMarche } from "@/app/comment-ca-marche/page";
import { secteursPublies } from "@/content/secteurs";
import { paysPublies } from "@/content/pays";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { SITE_URL } from "@/lib/site";

/**
 * Mesure les métadonnées réellement exportées par les pages, pas une copie de
 * leurs chaînes : c'est cet objet que Next sérialise dans le `<head>`.
 *
 * Au-delà de 155 caractères, Google tronque la description et choisit lui-même
 * où couper. `lib/texte.resume` borne celles des pages secteur, mais la page
 * d'index écrit la sienne à la main : rien d'autre ne la surveille.
 */
const MAX_DESCRIPTION = 155;

describe("métadonnées des pages secteur", () => {
  it("garde la description de l'index sous la limite d'affichage", () => {
    const d = metaIndex.description ?? "";
    expect(d.length, `description de /secteurs trop longue : ${d.length}`).toBeLessThanOrEqual(
      MAX_DESCRIPTION,
    );
    expect(d.length).toBeGreaterThan(80);
  });

  it("garde les 11 descriptions de secteur sous la limite d'affichage", () => {
    for (const s of secteursPublies()) {
      const d = metaSecteur({ params: { secteur: s.slug } }).description ?? "";
      expect(d.length, `description de /secteurs/${s.slug} trop longue : ${d.length}`)
        .toBeLessThanOrEqual(MAX_DESCRIPTION);
      expect(d.length, `description de /secteurs/${s.slug} trop courte`).toBeGreaterThan(80);
    }
  });

  it("donne à chaque page une canonique absolue qui correspond à sa route", () => {
    expect(metaIndex.alternates?.canonical).toBe(`${SITE_URL}/secteurs`);
    for (const s of secteursPublies()) {
      const m = metaSecteur({ params: { secteur: s.slug } });
      expect(m.alternates?.canonical, `canonique de ${s.slug}`).toBe(
        `${SITE_URL}/secteurs/${s.slug}`,
      );
      expect(m.openGraph?.url, `og:url de ${s.slug}`).toBe(`${SITE_URL}/secteurs/${s.slug}`);
    }
  });
});

describe("métadonnées des pages pays", () => {
  it("garde la description de l'index sous la limite d'affichage", () => {
    const d = metaIndexPays.description ?? "";
    expect(
      d.length,
      `description de /chatbot-whatsapp trop longue : ${d.length}`,
    ).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(d.length).toBeGreaterThan(80);
  });

  it("garde les 5 descriptions de pays sous la limite d'affichage", () => {
    for (const p of paysPublies()) {
      const d = metaPays({ params: { pays: p.slug } }).description ?? "";
      expect(d.length, `description de /chatbot-whatsapp/${p.slug} trop longue : ${d.length}`)
        .toBeLessThanOrEqual(MAX_DESCRIPTION);
      expect(d.length, `description de /chatbot-whatsapp/${p.slug} trop courte`)
        .toBeGreaterThan(80);
    }
  });

  it("donne à chaque page une canonique absolue qui correspond à sa route", () => {
    expect(metaIndexPays.alternates?.canonical).toBe(`${SITE_URL}/chatbot-whatsapp`);
    for (const p of paysPublies()) {
      const m = metaPays({ params: { pays: p.slug } });
      expect(m.alternates?.canonical, `canonique de ${p.slug}`).toBe(
        `${SITE_URL}/chatbot-whatsapp/${p.slug}`,
      );
      expect(m.openGraph?.url, `og:url de ${p.slug}`).toBe(
        `${SITE_URL}/chatbot-whatsapp/${p.slug}`,
      );
    }
  });

  it("ne rend aucune métadonnée pour un pays inconnu ou non publié", () => {
    expect(metaPays({ params: { pays: "atlantide" } })).toEqual({});
  });

  it("n'utilise aucun tiret long dans les titres et descriptions publiés", () => {
    const chaines = [
      metaIndexPays.title,
      metaIndexPays.description,
      ...paysPublies().flatMap((p) => {
        const m = metaPays({ params: { pays: p.slug } });
        return [m.title, m.description];
      }),
    ];
    for (const c of chaines) {
      expect(typeof c === "string" ? c : "", `tiret long : ${String(c)}`).not.toMatch(/[—–]/);
    }
  });
});

describe("métadonnées des pages comparatif", () => {
  it("garde la description de l'index sous la limite d'affichage", () => {
    const d = metaIndexComparatif.description ?? "";
    expect(d.length, `description de /comparatif trop longue : ${d.length}`).toBeLessThanOrEqual(
      MAX_DESCRIPTION,
    );
    expect(d.length).toBeGreaterThan(80);
  });

  it("garde les 8 descriptions de comparatif sous la limite d'affichage", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const d = metaComparatif({ params: { slug: c.slug } }).description ?? "";
      expect(d.length, `description de /comparatif/${c.slug} trop longue : ${d.length}`)
        .toBeLessThanOrEqual(MAX_DESCRIPTION);
      expect(d.length, `description de /comparatif/${c.slug} trop courte`).toBeGreaterThan(80);
    }
  });

  it("donne à chaque page une canonique absolue qui correspond à sa route", () => {
    expect(metaIndexComparatif.alternates?.canonical).toBe(`${SITE_URL}/comparatif`);
    for (const c of COMPARATIFS_PUBLIES) {
      const m = metaComparatif({ params: { slug: c.slug } });
      expect(m.alternates?.canonical, `canonique de ${c.slug}`).toBe(
        `${SITE_URL}/comparatif/${c.slug}`,
      );
      expect(m.openGraph?.url, `og:url de ${c.slug}`).toBe(`${SITE_URL}/comparatif/${c.slug}`);
    }
  });

  it("ne rend aucune métadonnée pour un comparatif inconnu", () => {
    expect(metaComparatif({ params: { slug: "wapy-vs-personne" } })).toEqual({});
  });

  it("n'utilise aucun tiret long dans les titres et descriptions publiés", () => {
    const chaines = [
      metaIndexComparatif.title,
      metaIndexComparatif.description,
      ...COMPARATIFS_PUBLIES.flatMap((c) => {
        const m = metaComparatif({ params: { slug: c.slug } });
        return [m.title, m.description];
      }),
    ];
    for (const c of chaines) {
      expect(typeof c === "string" ? c : "", `tiret long : ${String(c)}`).not.toMatch(/[—–]/);
    }
  });

  /**
   * Le titre affiché en résultat de recherche est tronqué au-delà d'une
   * soixantaine de caractères. Les titres de ce silo portent un nom d'éditeur
   * tiers : sans garde-fou, un slug de concurrent plus long les ferait couper
   * au milieu du nom comparé.
   */
  it("garde des titres lisibles", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const t = metaComparatif({ params: { slug: c.slug } }).title ?? "";
      const titre = typeof t === "string" ? t : "";
      expect(titre.length, `titre de ${c.slug} trop long : ${titre.length}`).toBeLessThanOrEqual(90);
      expect(titre, `titre de ${c.slug} sans suffixe de marque`).toContain("· Wapy");
    }
  });
});

/**
 * Pages entité et accueil : chacune écrit sa description à la main, aucune ne
 * passe par `resume`. Rien d'autre que ce bloc ne les surveille, et une
 * description tronquée par Google est une description dont ce n'est plus nous
 * qui choisissons la fin.
 */
const PAGES_ENTITE = [
  { url: "/", meta: metaAccueil },
  { url: "/a-propos", meta: metaAPropos },
  { url: "/tarifs", meta: metaTarifs },
  { url: "/faq", meta: metaFaq },
  { url: "/comment-ca-marche", meta: metaCommentCaMarche },
];

describe("métadonnées des pages entité et de l'accueil", () => {
  it("garde chaque description sous la limite d'affichage", () => {
    for (const { url, meta } of PAGES_ENTITE) {
      const d = meta.description ?? "";
      expect(d.length, `description de ${url} trop longue : ${d.length}`).toBeLessThanOrEqual(
        MAX_DESCRIPTION,
      );
      expect(d.length, `description de ${url} trop courte : ${d.length}`).toBeGreaterThan(80);
    }
  });

  it("donne à chaque page une canonique absolue qui correspond à sa route", () => {
    for (const { url, meta } of PAGES_ENTITE) {
      const attendue = url === "/" ? SITE_URL : `${SITE_URL}${url}`;
      expect(meta.alternates?.canonical, `canonique de ${url}`).toBe(attendue);
      expect(meta.openGraph?.url, `og:url de ${url}`).toBe(attendue);
    }
  });

  it("garde des titres lisibles, suffixés de la marque", () => {
    for (const { url, meta } of PAGES_ENTITE) {
      const t = typeof meta.title === "string" ? meta.title : "";
      expect(t.length, `titre de ${url} trop long : ${t.length}`).toBeLessThanOrEqual(90);
      expect(t, `titre de ${url} sans marque`).toContain("Wapy");
    }
  });

  it("n'utilise aucun tiret long dans les titres et descriptions publiés", () => {
    for (const { url, meta } of PAGES_ENTITE) {
      const chaines = [meta.title, meta.description, meta.openGraph?.title];
      for (const c of chaines) {
        expect(typeof c === "string" ? c : "", `tiret long sur ${url}`).not.toMatch(/[—–]/);
      }
    }
  });
});
