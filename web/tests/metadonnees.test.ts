import { describe, it, expect } from "vitest";
import { metadata as metaIndex } from "@/app/secteurs/page";
import { generateMetadata as metaSecteur } from "@/app/secteurs/[secteur]/page";
import { metadata as metaIndexPays } from "@/app/chatbot-whatsapp/page";
import { generateMetadata as metaPays } from "@/app/chatbot-whatsapp/[pays]/page";
import { secteursPublies } from "@/content/secteurs";
import { paysPublies } from "@/content/pays";
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
