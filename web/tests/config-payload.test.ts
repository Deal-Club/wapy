import { describe, it, expect } from "vitest";

import { corpsConfig, CHAMPS_NON_POSSEDES } from "@/lib/config";

/**
 * Ce que `GET /api/config` renvoie réellement (cf. `saas/app.py`, get_config) :
 * la configuration éditable, plus des champs possédés ailleurs ou en lecture
 * seule. C'est cet objet entier que les pages tenaient en état.
 */
const REPONSE_GET = {
  sector: "restaurant",
  description: "Maquis à Cotonou",
  infos: [{ label: "Horaires", value: "9h-22h" }],
  tables: [{ name: "Menu", columns: ["Plat"], rows: [] }],
  consignes: [],
  faq: [],
  booking: { hours: {}, services: [] },
  documents: ["carte.pdf"],
  staff_numbers: "",
  staff_inbound_ids: "",
  wapy_model: "claude-haiku-4-5-20251001",
  linked_number: "22990000000@c.us",
  ai_remaining: 2,
  ai_limit: 3,
};

describe("corps de PUT /api/config", () => {
  it("garde les champs que la page édite", () => {
    const corps = corpsConfig(REPONSE_GET);
    for (const cle of ["sector", "description", "infos", "tables", "consignes", "faq"]) {
      expect(corps, `champ éditable perdu : ${cle}`).toHaveProperty(cle);
    }
  });

  it("n'envoie jamais le numéro du responsable", () => {
    // Le régression exacte : le champ a été déplacé vers « Connexion WhatsApp »,
    // mais continuait de transiter vide dans le corps. Le serveur refuse une
    // chaîne vide — effacer ce numéro rendrait toute escalade silencieuse — donc
    // plus aucun nouvel inscrit ne pouvait enregistrer sa configuration.
    expect(corpsConfig(REPONSE_GET)).not.toHaveProperty("staff_numbers");
    expect(corpsConfig({ staff_numbers: "22990000000" })).not.toHaveProperty("staff_numbers");
  });

  it("n'envoie aucun champ possédé ailleurs ni aucun champ en lecture seule", () => {
    const corps = corpsConfig(REPONSE_GET);
    for (const cle of CHAMPS_NON_POSSEDES) {
      expect(corps, `champ non possédé renvoyé : ${cle}`).not.toHaveProperty(cle);
    }
  });

  it("laisse passer les valeurs vides des champs éditables", () => {
    // Une fiche qu'on vide volontairement doit pouvoir être enregistrée vide.
    const corps = corpsConfig({ description: "", infos: [] });
    expect(corps).toEqual({ description: "", infos: [] });
  });

  it("ne casse pas sur une configuration absente", () => {
    expect(corpsConfig(undefined as never)).toEqual({});
  });
});
