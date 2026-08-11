import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CLE } from "../scripts/indexnow.mjs";

// IndexNow authentifie en allant lire la clé à la racine du site. Si le fichier
// publié et la constante du script divergent, le moteur répond 403 et plus rien
// n'est signalé : panne silencieuse, exactement le genre que personne ne remarque
// avant de constater des semaines plus tard que rien n'est indexé.

const racine = join(__dirname, "..");
const fichierCle = join(racine, "public", `${CLE}.txt`);

describe("IndexNow", () => {
  it("publie la clé à la racine du site", () => {
    expect(existsSync(fichierCle)).toBe(true);
  });

  it("publie exactement la clé qu'annonce le script", () => {
    // Sans trim volontaire du côté serveur : le fichier ne doit contenir QUE la clé,
    // pas de retour à la ligne final, certains moteurs comparant octet pour octet.
    expect(readFileSync(fichierCle, "utf8")).toBe(CLE);
  });

  it("utilise une clé au format accepté (16 à 128 caractères hexadécimaux)", () => {
    expect(CLE).toMatch(/^[a-f0-9]{16,128}$/);
  });

  it("sert la clé en dehors des zones interdites au crawl", async () => {
    // Le fichier vit dans public/ donc à la racine ; il ne doit tomber sous aucun
    // des préfixes que robots.ts interdit, sinon Bing ne peut pas le lire.
    const robots = readFileSync(join(racine, "app", "robots.ts"), "utf8");
    const prefixes = [...robots.matchAll(/"(\/[a-z-]+)"/g)].map((m) => m[1]);
    for (const prefixe of prefixes) {
      expect(`/${CLE}.txt`.startsWith(prefixe)).toBe(false);
    }
  });
});
