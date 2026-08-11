import { describe, it, expect } from "vitest";
import nextConfig from "../next.config.js";
import { REDIRECTIONS_SECTEURS, SECTEURS } from "@/content/secteurs";
import { POSTS } from "@/content/articles";

/**
 * `next.config.js` est un module CommonJS chargé par Next hors du pipeline
 * TypeScript : il ne peut pas importer `@/content/secteurs`, et la liste des
 * 11 redirections y est donc recopiée à la main. La duplication est assumée ;
 * ce fichier est ce qui la rend acceptable.
 *
 * On ne compare pas les deux listes de tête : on demande à `next.config.js` ce
 * qu'il déclare vraiment, en appelant son `redirects()`, puis on confronte le
 * résultat aux données. Une entrée oubliée, un slug mal recopié, une
 * redirection temporaire au lieu de permanente : tout écart fait échouer ici.
 */
async function redirectionsDeclarees() {
  return nextConfig.redirects ? await nextConfig.redirects() : [];
}

describe("redirections 301 des articles secteurs", () => {
  it("couvre les 11 secteurs", () => {
    expect(REDIRECTIONS_SECTEURS).toHaveLength(11);
  });

  it("pointe vers une page secteur existante", () => {
    const slugs = new Set(SECTEURS.map((s) => s.slug));
    for (const r of REDIRECTIONS_SECTEURS) {
      const cible = r.destination.replace("/secteurs/", "");
      expect(slugs.has(cible), `cible inconnue : ${r.destination}`).toBe(true);
    }
  });

  it("ne laisse aucun article de blog en doublon des pages secteur", () => {
    const anciens = new Set(REDIRECTIONS_SECTEURS.map((r) => r.source.replace("/blog/", "")));
    for (const p of POSTS) {
      expect(anciens.has(p.slug), `article ${p.slug} doit etre retire du blog`).toBe(false);
    }
  });

  it("déclare dans next.config.js exactement les redirections des données", async () => {
    const declarees = await redirectionsDeclarees();
    const attendues = REDIRECTIONS_SECTEURS.map((r) => `${r.source} -> ${r.destination}`).sort();
    const obtenues = declarees.map((r) => `${r.source} -> ${r.destination}`).sort();
    expect(obtenues).toEqual(attendues);
  });

  it("déclare chacune de ces redirections comme permanente", async () => {
    const declarees = await redirectionsDeclarees();
    expect(declarees.length).toBeGreaterThan(0);
    for (const r of declarees) {
      expect(r.permanent, `redirection non permanente : ${r.source}`).toBe(true);
      // Une redirection permanente s'exprime par `permanent`, jamais par un
      // `statusCode` posé à la main : les deux sont mutuellement exclusifs
      // côté Next, et un 302 recopié par erreur ne transmettrait rien.
      expect(r.statusCode, `statusCode explicite sur ${r.source}`).toBeUndefined();
    }
  });

  it("ne redirige pas vers un secteur non publié ni vers elle-même", async () => {
    const publies = new Set(SECTEURS.filter((s) => s.publie).map((s) => s.slug));
    for (const r of await redirectionsDeclarees()) {
      expect(r.source, `redirection circulaire : ${r.source}`).not.toBe(r.destination);
      expect(r.source.startsWith("/blog/"), `source hors blog : ${r.source}`).toBe(true);
      const cible = r.destination.replace("/secteurs/", "");
      expect(publies.has(cible), `cible non publiée : ${r.destination}`).toBe(true);
    }
  });

  it("ne recouvre aucune route de blog encore servie", async () => {
    const vivants = new Set(POSTS.map((p) => `/blog/${p.slug}`));
    for (const r of await redirectionsDeclarees()) {
      expect(vivants.has(r.source), `la redirection masque l'article ${r.source}`).toBe(false);
    }
  });
});
