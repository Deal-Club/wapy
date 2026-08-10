import { describe, it, expect, vi } from "vitest";

/**
 * Simulation de la vague 2 : toutes les villes de `web/content/villes.ts` sont
 * republiées (`publie: true`) via un mock du module, sans toucher aux données
 * réelles (vague 1 = 0 ville publiée). Le moteur de maillage doit fonctionner
 * sans réécriture dans cette configuration : c'est la promesse de la tâche 5.
 *
 * `vi.mock` est hoisté par vitest, donc il s'applique avant les imports de
 * `@/lib/maillage`, `@/content/pays` et `@/content/secteurs` ci-dessous.
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

import { pagesPubliees, liensSortants, liensEntrants, auditMaillage } from "@/lib/maillage";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { villesPubliees, villesDuPays } from "@/content/villes";
import type { Ville } from "@/content/types";

describe("simulation vague 2 (25 villes publiées)", () => {
  it("le graphe inclut bien les 25 pages ville", () => {
    const urls = pagesPubliees().map((p) => p.url);
    const villes = villesPubliees();
    expect(villes.length).toBe(25);
    for (const v of villes) {
      expect(urls).toContain(`/chatbot-whatsapp/${v.pays}/${v.slug}`);
    }
  });

  // G2 en vague 2 : le garde-fou doit rester vide une fois les villes publiées,
  // sans aucune réécriture du moteur (seules les données changent).
  it("auditMaillage ne signale aucune page sous 3 liens entrants", () => {
    const defauts = auditMaillage();
    expect(defauts, `pages sous-maillées : ${JSON.stringify(defauts)}`).toEqual([]);
  });

  it("chaque ville publiée reçoit au moins 3 liens entrants", () => {
    for (const v of villesPubliees()) {
      const url = `/chatbot-whatsapp/${v.pays}/${v.slug}`;
      const entrants = liensEntrants(url);
      expect(entrants.length, `${url} n'a que ${entrants.length} lien(s) entrant(s)`).toBeGreaterThanOrEqual(3);
    }
  });

  it("aucun pays n'est privilégié dans les villes ciblées par les pages secteur", () => {
    // Attendu dérivé des données (tout pays ayant au moins une ville publiée
    // doit être ciblé), pas une constante en dur : ce test reste valable même
    // si un pays n'a, un jour, aucune ville publiée.
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
