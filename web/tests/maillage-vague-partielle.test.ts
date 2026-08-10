import { describe, it, expect, vi } from "vitest";

/**
 * Simulation d'une vague intermédiaire (publication partielle et inégale) :
 * chaque pays republie un nombre différent de ses villes réelles, de 1 à 5,
 * dans l'ordre où elles apparaissent dans `web/content/villes.ts`. Ça couvre
 * toutes les tailles de groupe possibles (1 à 5 villes par pays) dans un seul
 * fichier, sur des données réelles, pas des fixtures inventées.
 *
 * Benin        : 1 ville publiée  (cotonou)
 * Côte d'Ivoire: 2 villes publiées (abidjan, bouake)
 * Sénégal      : 3 villes publiées (dakar, thies, touba)
 * Cameroun     : 4 villes publiées (douala, yaounde, garoua, bafoussam)
 * Togo         : 5 villes publiées (toutes)
 *
 * `vi.mock` est hoisté par vitest, donc il s'applique avant les imports de
 * `@/lib/maillage` ci-dessous, sans toucher aux données réelles ni aux
 * fichiers `maillage.test.ts` (vague 1, 0 ville) et `maillage-vague2.test.ts`
 * (vague 2 complète, 25 villes) qui vivent dans leurs propres modules.
 */
// `vi.mock` est hoisté au-dessus de toute déclaration top-level : la graine
// de sélection doit donc être créée via `vi.hoisted` pour être visible dans
// la factory de mock au moment où elle s'exécute.
const { PUBLIEES_PAR_PAYS } = vi.hoisted(() => ({
  PUBLIEES_PAR_PAYS: {
    benin: 1,
    "cote-divoire": 2,
    senegal: 3,
    cameroun: 4,
    togo: 5,
  } as Record<string, number>,
}));

vi.mock("@/content/villes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/content/villes")>();
  const compteurs: Record<string, number> = {};
  const VILLES = actual.VILLES.map((v) => {
    const deja = compteurs[v.pays] ?? 0;
    compteurs[v.pays] = deja + 1;
    return { ...v, publie: deja < (PUBLIEES_PAR_PAYS[v.pays] ?? 0) };
  });
  return {
    ...actual,
    VILLES,
    getVille: (slug: string) => VILLES.find((v) => v.slug === slug),
    villesPubliees: () => VILLES.filter((v) => v.publie),
    villesDuPays: (slugPays: string) => VILLES.filter((v) => v.pays === slugPays),
  };
});

import { pagesPubliees, liensSortants, liensEntrants, auditMaillage } from "@/lib/maillage";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { villesPubliees, villesDuPays } from "@/content/villes";
import type { Ville } from "@/content/types";

describe("simulation vague intermédiaire (publication partielle et inégale, 1 à 5 villes par pays)", () => {
  it("republie exactement 15 villes, réparties 1/2/3/4/5 par pays", () => {
    const villes = villesPubliees();
    expect(villes.length).toBe(15);
    for (const [paysSlug, attendu] of Object.entries(PUBLIEES_PAR_PAYS)) {
      expect(villesDuPays(paysSlug).filter((v) => v.publie).length, paysSlug).toBe(attendu);
    }
  });

  // G2 en publication partielle : c'est l'état réaliste d'une vague
  // intermédiaire, pas seulement le tout ou rien (vague 1 = 0 ville,
  // vague 2 = 25 villes) déjà couvert ailleurs.
  it("auditMaillage ne signale aucune page sous 3 liens entrants", () => {
    const defauts = auditMaillage();
    expect(defauts, `pages sous-maillées : ${JSON.stringify(defauts)}`).toEqual([]);
  });

  it("chaque ville publiée reçoit au moins 3 liens entrants, y compris pour un groupe d'une seule ville", () => {
    for (const v of villesPubliees()) {
      const url = `/chatbot-whatsapp/${v.pays}/${v.slug}`;
      const entrants = liensEntrants(url);
      expect(entrants.length, `${url} n'a que ${entrants.length} lien(s) entrant(s)`).toBeGreaterThanOrEqual(3);
    }
  });

  it("aucun pays n'est privilégié dans les villes ciblées par les pages secteur", () => {
    const paysAvecVillePubliee = paysPublies().filter((p) =>
      villesDuPays(p.slug).some((v) => v.publie),
    ).length;
    const villesParHref = new Map<string, Ville>(
      villesPubliees().map((v) => [`/chatbot-whatsapp/${v.pays}/${v.slug}`, v]),
    );
    for (const s of secteursPublies()) {
      const villesCiblees = liensSortants(`/secteurs/${s.slug}`)
        .map((l) => villesParHref.get(l.href))
        .filter((v): v is Ville => v !== undefined);
      const paysCouverts = new Set(villesCiblees.map((v) => v.pays));
      expect(
        paysCouverts.size,
        `/secteurs/${s.slug} ne cible que le(s) pays ${JSON.stringify([...paysCouverts])}`,
      ).toBe(paysAvecVillePubliee);
    }
  });

  it("ne pointe que vers des pages publiées et ne crée pas d'auto-lien, villes comprises", () => {
    const publiees = new Set(pagesPubliees().map((p) => p.url));
    for (const v of villesPubliees()) {
      const url = `/chatbot-whatsapp/${v.pays}/${v.slug}`;
      for (const lien of liensSortants(url)) {
        expect(publiees.has(lien.href), `${url} pointe vers ${lien.href} non publiée`).toBe(true);
        expect(lien.href).not.toBe(url);
      }
    }
  });
});
