import { describe, it, expect, vi } from "vitest";

/**
 * Simulation de la vague 2 pour la page pays : toutes les villes de
 * `web/content/villes.ts` sont republiées (`publie: true`) via un mock du
 * module, sans toucher aux données réelles (vague 1 = 0 ville publiée).
 *
 * Même procédé que `maillage-vague2.test.ts`, appliqué cette fois au rendu :
 * la section « villes couvertes » choisit entre un `Link` et un simple `li`
 * selon `v.publie`, et la branche cliquable ne serait autrement jamais
 * exécutée avant la vague 2.
 *
 * `vi.mock` est hoisté par vitest, donc il s'applique avant les imports du
 * module de page ci-dessous.
 */
vi.mock("@/content/villes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content/villes")>();
  const VILLES = actual.VILLES.map((v) => ({ ...v, publie: true }));
  return {
    ...actual,
    VILLES,
    getVille: (slug: string) => VILLES.find((v) => v.slug === slug),
    villesPubliees: () => VILLES,
    villesDuPays: (slugPays: string) => VILLES.filter((v) => v.pays === slugPays),
  };
});

import PagePays from "@/app/chatbot-whatsapp/[pays]/page";
import { paysPublies } from "@/content/pays";
import { villesDuPays, villesPubliees } from "@/content/villes";
import { hrefs, section, textes } from "./arbre-react";

describe("section « villes couvertes » (vague 2, 25 villes publiées)", () => {
  it("le mock republie bien les 25 villes", () => {
    expect(villesPubliees().length).toBe(25);
  });

  it("rend une ville publiée en lien vers sa page", () => {
    for (const p of paysPublies()) {
      const villes = section(PagePays({ params: { pays: p.slug } }), "villes");
      expect(villes, `section villes absente pour ${p.slug}`).not.toBeNull();

      // URL attendue dérivée de la convention du moteur de maillage
      // (`lib/maillage.ts`), pas recopiée du gabarit de la page.
      const attendus = villesDuPays(p.slug).map((v) => `/chatbot-whatsapp/${v.pays}/${v.slug}`);
      expect(attendus.length).toBe(5);
      expect(hrefs(villes), `liens villes de /chatbot-whatsapp/${p.slug}`).toEqual(attendus);
    }
  });

  it("garde le nom de la ville comme texte du lien", () => {
    for (const p of paysPublies()) {
      const villes = section(PagePays({ params: { pays: p.slug } }), "villes");
      const rendu = textes(villes);
      for (const v of villesDuPays(p.slug)) {
        expect(rendu, `${v.nom} absente de /chatbot-whatsapp/${p.slug}`).toContain(v.nom);
      }
    }
  });

  /**
   * Le lien d'une ville doit pointer vers le pays de la ville, jamais vers le
   * pays de la page : les deux coïncident ici, mais un `p.slug` écrit à la place
   * de `v.pays` dans le gabarit passerait ce test sans le garde-fou suivant.
   */
  it("construit chaque URL depuis le pays porté par la ville", () => {
    for (const p of paysPublies()) {
      const villes = section(PagePays({ params: { pays: p.slug } }), "villes");
      const slugsVilles = villesDuPays(p.slug).map((v) => v.slug);
      for (const lien of hrefs(villes)) {
        const [, , paysUrl, villeUrl] = lien.split("/");
        expect(slugsVilles, `ville inconnue dans ${lien}`).toContain(villeUrl);
        expect(
          villesDuPays(p.slug).find((v) => v.slug === villeUrl)?.pays,
          `pays incohérent dans ${lien}`,
        ).toBe(paysUrl);
      }
    }
  });
});
