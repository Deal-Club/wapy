import { describe, it, expect } from "vitest";
import { metadata as metaIndex } from "@/app/secteurs/page";
import { generateMetadata as metaSecteur } from "@/app/secteurs/[secteur]/page";
import { secteursPublies } from "@/content/secteurs";
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
