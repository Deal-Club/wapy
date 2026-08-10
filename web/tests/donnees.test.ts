import { describe, it, expect } from "vitest";
import { SOURCES, sourceExiste } from "@/content/sources";
import { PAYS, getPays, paysPublies } from "@/content/pays";
import { SECTEURS, getSecteur, secteursPublies, REDIRECTIONS_SECTEURS } from "@/content/secteurs";
import { VILLES, getVille, villesPubliees, villesDuPays } from "@/content/villes";
import { POSTS } from "@/lib/blog";
import type { Pays, Secteur, Ville } from "@/content/types";

describe("registre des sources", () => {
  it("indexe chaque source sous son propre id", () => {
    for (const [cle, src] of Object.entries(SOURCES)) {
      expect(src.id).toBe(cle);
    }
  });

  it("expose des sources avec url et date de consultation", () => {
    for (const src of Object.values(SOURCES)) {
      expect(src.label.length).toBeGreaterThan(3);
      expect(src.url).toMatch(/^https?:\/\//);
      expect(src.consulteLe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("reconnait une source connue et rejette une source inconnue", () => {
    expect(sourceExiste("insae-benin-rgph4")).toBe(true);
    expect(sourceExiste("source-qui-nexiste-pas")).toBe(false);
  });
});

/** Slugs de secteurs prévus par le plan (tâche 3). */
const SECTEURS_ATTENDUS = [
  "restaurant",
  "salon-de-beaute",
  "boutique",
  "hotel",
  "clinique-pharmacie",
  "immobilier",
  "ecole",
  "artisan",
  "agence-voyage",
  "evenementiel-traiteur",
  "garage-auto",
];

/**
 * Tout le texte d'un pays qui finit sur la page publiée, `particularites`
 * comprise : les garde-fous rédactionnels doivent couvrir chaque champ affiché,
 * pas seulement les plus visibles.
 */
function textePublie(p: Pays): string {
  return [
    p.enBref,
    p.angle,
    ...p.particularites,
    ...p.faq.map((f) => `${f.q} ${f.r}`),
  ].join(" ");
}

describe("données pays", () => {
  it("contient les 5 pays de la vague 1", () => {
    expect(PAYS.map((p) => p.slug).sort()).toEqual(
      ["benin", "cameroun", "cote-divoire", "senegal", "togo"],
    );
  });

  it("n'a pas de slug en double", () => {
    const slugs = PAYS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // G1 : aucun chiffre sans source valide
  it("référence une source existante pour chaque population", () => {
    for (const p of PAYS) {
      if (p.population) {
        expect(sourceExiste(p.population.source)).toBe(true);
        expect(p.population.annee).toBeGreaterThan(1990);
        expect(p.population.valeur).toBeGreaterThan(0);
      }
    }
  });

  // G1 : la nature du chiffre ne peut pas être omise silencieusement.
  it("qualifie chaque population de recensement ou d'estimation", () => {
    for (const p of PAYS) {
      if (p.population) {
        expect(["recensement", "estimation"], `nature manquante ou invalide pour ${p.slug}`)
          .toContain(p.population.nature);
      }
    }
  });

  it("omet la population plutôt que de publier un chiffre périmé (Bénin)", () => {
    expect(getPays("benin")?.population).toBeUndefined();
  });

  // G3 : angle rédigé
  it("a un angle d'au moins 150 caractères pour chaque pays", () => {
    for (const p of PAYS) {
      expect(p.angle.length, `angle trop court pour ${p.slug}`).toBeGreaterThanOrEqual(150);
    }
  });

  it("a un angle différent pour chaque pays", () => {
    const angles = PAYS.map((p) => p.angle);
    expect(new Set(angles).size).toBe(angles.length);
  });

  // AEO : réponse directe courte
  it("a un enBref de moins de 50 mots", () => {
    for (const p of PAYS) {
      expect(p.enBref.trim().split(/\s+/).length, `enBref trop long pour ${p.slug}`).toBeLessThan(50);
    }
  });

  it("propose 5 à 8 questions de FAQ par pays", () => {
    for (const p of PAYS) {
      expect(p.faq.length).toBeGreaterThanOrEqual(5);
      expect(p.faq.length).toBeLessThanOrEqual(8);
    }
  });

  it("ne pose jamais deux fois la même question", () => {
    const questions = PAYS.flatMap((p) => p.faq.map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
  });

  // AEO : plafond de 60 mots par réponse, sans exception.
  it("répond en 60 mots maximum à chaque question", () => {
    for (const p of PAYS) {
      for (const f of p.faq) {
        const mots = f.r.trim().split(/\s+/).length;
        expect(mots, `réponse trop longue (${mots} mots) dans ${p.slug} : ${f.q}`)
          .toBeLessThanOrEqual(60);
      }
    }
  });

  it("n'utilise pas de tiret long dans le contenu publié", () => {
    for (const p of PAYS) {
      const texte = textePublie(p);
      expect(texte, `tiret long dans ${p.slug}`).not.toContain("—");
    }
  });

  it("ne revendique aucun client ni résultat client", () => {
    // Première personne (« nos clients ») ET troisième personne
    // (« beaucoup de commerçants font X »), qui présuppose une base installée
    // alors que Wapy n'a aucun client en production.
    const interdits = [
      /nos clients|nos utilisateurs|nos établissements/i,
      /témoignage|avis clients?/i,
      /ont vu leurs?|ont augmenté|ont gagné|ont doublé/i,
      /(centaines|milliers|dizaines) d[eu']/i,
      /(beaucoup|la plupart|nombre|certains|de nombreux|des milliers) (de |d')?(commer[çc]ants?|[ée]tablissements?|entreprises?|utilisateurs?|restaurants?|boutiques?|clients?) (qui )?(gardent|utilisent|ont|font|laissent|choisissent|passent|constatent)/i,
      /déjà adopté|nous font confiance|rejoignez les/i,
    ];
    for (const p of PAYS) {
      const texte = textePublie(p);
      for (const motif of interdits) {
        expect(texte, `revendication client dans ${p.slug} (motif ${motif})`).not.toMatch(motif);
      }
    }
  });

  it("expose 3 secteurs phares connus par pays", () => {
    for (const p of PAYS) {
      expect(p.secteursPhares.length, `secteursPhares incomplet pour ${p.slug}`).toBe(3);
      expect(new Set(p.secteursPhares).size).toBe(3);
      for (const s of p.secteursPhares) {
        expect(SECTEURS_ATTENDUS, `secteur inconnu ${s} dans ${p.slug}`).toContain(s);
      }
    }
  });

  // G2 (maillage) : les 15 emplacements doivent couvrir tous les secteurs prévus
  it("couvre l'ensemble des secteurs prévus via les secteurs phares", () => {
    const couverts = new Set(PAYS.flatMap((p) => p.secteursPhares));
    const orphelins = SECTEURS_ATTENDUS.filter((s) => !couverts.has(s));
    expect(orphelins, `secteurs sans lien entrant : ${orphelins.join(", ")}`).toEqual([]);
  });

  it("renseigne les champs d'identité de chaque pays", () => {
    for (const p of PAYS) {
      expect(p.indicatif, `indicatif invalide pour ${p.slug}`).toMatch(/^\+\d{3}$/);
      expect(["XOF", "XAF"]).toContain(p.monnaie);
      expect(p.capitale.length).toBeGreaterThan(2);
      expect(p.mobileMoney.length).toBeGreaterThanOrEqual(2);
      expect(p.operateurs.length).toBeGreaterThanOrEqual(2);
      expect(p.particularites.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("expose getPays et paysPublies", () => {
    expect(getPays("benin")?.nom).toBe("Bénin");
    expect(getPays("inconnu")).toBeUndefined();
    expect(paysPublies().every((p) => p.publie)).toBe(true);
  });
});

/**
 * Identifiants des 11 secteurs, valeurs exactes du plan. Ce ne sont pas du
 * contenu : slug (URL), tag (étiquette du blog) et ancienSlugBlog (source de la
 * redirection 301) doivent rester verbatim, sous peine de casser le maillage.
 */
const IDENTITES_SECTEURS: ReadonlyArray<
  readonly [slug: string, nom: string, tag: string, ancienSlugBlog: string]
> = [
  ["restaurant", "Restaurant", "Restauration", "chatbot-whatsapp-restaurant"],
  ["salon-de-beaute", "Salon de beauté", "Beauté", "assistant-whatsapp-salon-de-beaute"],
  ["boutique", "Boutique", "Commerce", "chatbot-whatsapp-boutique"],
  ["hotel", "Hôtel", "Hôtellerie", "assistant-whatsapp-hotel"],
  ["clinique-pharmacie", "Clinique et pharmacie", "Santé", "assistant-whatsapp-clinique-pharmacie"],
  ["immobilier", "Agence immobilière", "Immobilier", "chatbot-whatsapp-immobilier"],
  ["ecole", "École et centre de formation", "Éducation", "assistant-whatsapp-ecole"],
  ["artisan", "Artisan", "Services", "assistant-whatsapp-artisan"],
  ["agence-voyage", "Agence de voyage", "Voyage", "assistant-whatsapp-agence-voyage"],
  ["evenementiel-traiteur", "Traiteur et événementiel", "Événementiel", "assistant-whatsapp-evenementiel-traiteur"],
  ["garage-auto", "Garage automobile", "Automobile", "assistant-whatsapp-garage-auto"],
];

/** Tout le texte d'un secteur qui finit sur la page publiée, `douleurs` comprise. */
function textePublieSecteur(s: Secteur): string {
  return [s.enBref, s.angle, ...s.douleurs, ...s.faq.map((f) => `${f.q} ${f.r}`)].join(" ");
}

/**
 * Même garde-fou que pour les pays, avec le vocabulaire des secteurs : Wapy n'a
 * aucun client en production, ni « nos clients » (1re personne) ni « beaucoup de
 * restaurateurs font X » (3e personne, qui présuppose une base installée).
 */
const REVENDICATIONS_INTERDITES = [
  /nos clients|nos utilisateurs|nos établissements|nos restaurants|nos salons/i,
  /témoignage|avis clients?/i,
  /ont vu leurs?|ont augmenté|ont gagné|ont doublé|ont constaté/i,
  /(centaines|milliers|dizaines) d[eu']/i,
  /(beaucoup|la plupart|nombre|certains|de nombreux|des milliers) (de |d')?(commer[çc]ants?|[ée]tablissements?|entreprises?|utilisateurs?|restaurateurs?|restaurants?|boutiques?|salons?|h[ôo]tels?|garages?|agences?|artisans?|[ée]coles?|traiteurs?|pharmacies?|cliniques?|clients?) (qui )?(gardent|utilisent|ont|font|laissent|choisissent|passent|constatent|gagnent|voient)/i,
  /déjà adopté|nous font confiance|rejoignez les/i,
];

describe("données secteurs", () => {
  it("contient les 11 secteurs", () => {
    expect(SECTEURS).toHaveLength(11);
  });

  it("n'a pas de slug en double", () => {
    const slugs = SECTEURS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // Identifiants : valeurs exactes du plan, dans l'ordre du plan.
  it("respecte verbatim la correspondance slug / nom / tag / ancienSlugBlog", () => {
    expect(SECTEURS.map((s) => [s.slug, s.nom, s.tag, s.ancienSlugBlog])).toEqual(
      IDENTITES_SECTEURS.map((t) => [...t]),
    );
  });

  it("renseigne un nomPluriel et un motCle pour chaque secteur", () => {
    for (const s of SECTEURS) {
      expect(s.nomPluriel.length, `nomPluriel manquant pour ${s.slug}`).toBeGreaterThan(2);
      expect(s.motCle.length, `motCle manquant pour ${s.slug}`).toBeGreaterThan(10);
      expect(s.motCle.toLowerCase(), `motCle hors sujet pour ${s.slug}`).toContain("whatsapp");
    }
    expect(new Set(SECTEURS.map((s) => s.motCle)).size).toBe(SECTEURS.length);
  });

  // G3 : angle rédigé, propre à chaque secteur.
  it("a un angle d'au moins 150 caractères", () => {
    for (const s of SECTEURS) {
      expect(s.angle.length, `angle trop court pour ${s.slug}`).toBeGreaterThanOrEqual(150);
    }
  });

  it("a un angle différent pour chaque secteur", () => {
    const angles = SECTEURS.map((s) => s.angle);
    expect(new Set(angles).size).toBe(angles.length);
  });

  // AEO : réponse directe courte
  it("a un enBref de moins de 50 mots", () => {
    for (const s of SECTEURS) {
      expect(s.enBref.trim().split(/\s+/).length, `enBref trop long pour ${s.slug}`).toBeLessThan(50);
    }
  });

  it("liste au moins 3 douleurs non vides par secteur", () => {
    for (const s of SECTEURS) {
      expect(s.douleurs.length, `douleurs insuffisantes pour ${s.slug}`).toBeGreaterThanOrEqual(3);
      for (const d of s.douleurs) {
        expect(d.trim().length, `douleur vide dans ${s.slug}`).toBeGreaterThan(15);
      }
    }
    const toutes = SECTEURS.flatMap((s) => s.douleurs);
    expect(new Set(toutes).size, "douleur recopiée d'un secteur à l'autre").toBe(toutes.length);
  });

  it("propose 5 à 8 questions de FAQ par secteur", () => {
    for (const s of SECTEURS) {
      expect(s.faq.length).toBeGreaterThanOrEqual(5);
      expect(s.faq.length).toBeLessThanOrEqual(8);
    }
  });

  // Les pages secteur se lisent en série : une question posée deux fois trahit
  // du remplissage, et deux pages qui se répondent pareil se cannibalisent.
  it("ne pose jamais deux fois la même question, tous secteurs confondus", () => {
    const questions = SECTEURS.flatMap((s) => s.faq.map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
    const reponses = SECTEURS.flatMap((s) => s.faq.map((f) => f.r));
    expect(new Set(reponses).size).toBe(reponses.length);
  });

  // AEO : plafond de 60 mots par réponse, sans exception.
  it("répond en 60 mots maximum à chaque question", () => {
    for (const s of SECTEURS) {
      for (const f of s.faq) {
        const mots = f.r.trim().split(/\s+/).length;
        expect(mots, `réponse trop longue (${mots} mots) dans ${s.slug} : ${f.q}`)
          .toBeLessThanOrEqual(60);
      }
    }
  });

  it("pose des questions qui se terminent par un point d'interrogation", () => {
    for (const s of SECTEURS) {
      for (const f of s.faq) {
        expect(f.q.trim().endsWith("?"), `question mal formée dans ${s.slug} : ${f.q}`).toBe(true);
      }
    }
  });

  it("n'utilise pas de tiret long dans le contenu publié", () => {
    for (const s of SECTEURS) {
      expect(textePublieSecteur(s), `tiret long dans ${s.slug}`).not.toContain("—");
    }
  });

  it("ne revendique aucun client ni résultat client", () => {
    for (const s of SECTEURS) {
      const texte = textePublieSecteur(s);
      for (const motif of REVENDICATIONS_INTERDITES) {
        expect(texte, `revendication client dans ${s.slug} (motif ${motif})`).not.toMatch(motif);
      }
    }
  });

  it("déclare une redirection 301 par ancien article de blog", () => {
    const avecAncien = SECTEURS.filter((s) => s.ancienSlugBlog !== null);
    expect(avecAncien).toHaveLength(11);
    expect(REDIRECTIONS_SECTEURS).toHaveLength(11);
    for (const r of REDIRECTIONS_SECTEURS) {
      expect(r.source).toMatch(/^\/blog\//);
      expect(r.destination).toMatch(/^\/secteurs\//);
    }
    const sources = REDIRECTIONS_SECTEURS.map((r) => r.source);
    expect(new Set(sources).size, "redirection en double").toBe(sources.length);
  });

  // Une redirection qui part d'un slug inexistant ne redirige rien : le maillage
  // et le jus SEO de l'article se perdraient en silence.
  it("ne redirige que depuis des articles de blog réellement existants", () => {
    const connus = new Set(POSTS.map((p) => p.slug));
    for (const s of SECTEURS) {
      expect(connus.has(s.ancienSlugBlog ?? ""), `article inconnu ${s.ancienSlugBlog} (${s.slug})`)
        .toBe(true);
    }
  });

  it("ne référence que des secteurs existants dans les secteursPhares des pays", () => {
    const connus = new Set(SECTEURS.map((s) => s.slug));
    for (const p of PAYS) {
      for (const slug of p.secteursPhares) {
        expect(connus.has(slug), `secteur inconnu ${slug} dans ${p.slug}`).toBe(true);
      }
    }
  });

  it("expose getSecteur et secteursPublies", () => {
    expect(getSecteur("restaurant")?.nom).toBe("Restaurant");
    expect(getSecteur("inconnu")).toBeUndefined();
    expect(secteursPublies().every((s) => s.publie)).toBe(true);
  });
});

/**
 * Les 25 villes tier 1, avec pays et slug imposés par le plan. Les slugs sont des
 * identifiants d'URL : sans accent, sans espace, et repris verbatim par le moteur
 * de maillage de la tâche 5. Un renommage casse des liens, pas seulement un test.
 */
const VILLES_ATTENDUES: ReadonlyArray<readonly [slug: string, nom: string, pays: string]> = [
  ["cotonou", "Cotonou", "benin"],
  ["porto-novo", "Porto-Novo", "benin"],
  ["parakou", "Parakou", "benin"],
  ["abomey-calavi", "Abomey-Calavi", "benin"],
  ["bohicon", "Bohicon", "benin"],
  ["abidjan", "Abidjan", "cote-divoire"],
  ["bouake", "Bouaké", "cote-divoire"],
  ["yamoussoukro", "Yamoussoukro", "cote-divoire"],
  ["san-pedro", "San-Pédro", "cote-divoire"],
  ["korhogo", "Korhogo", "cote-divoire"],
  ["dakar", "Dakar", "senegal"],
  ["thies", "Thiès", "senegal"],
  ["touba", "Touba", "senegal"],
  ["saint-louis", "Saint-Louis", "senegal"],
  ["mbour", "Mbour", "senegal"],
  ["douala", "Douala", "cameroun"],
  ["yaounde", "Yaoundé", "cameroun"],
  ["garoua", "Garoua", "cameroun"],
  ["bafoussam", "Bafoussam", "cameroun"],
  ["bamenda", "Bamenda", "cameroun"],
  ["lome", "Lomé", "togo"],
  ["sokode", "Sokodé", "togo"],
  ["kara", "Kara", "togo"],
  ["kpalime", "Kpalimé", "togo"],
  ["atakpame", "Atakpamé", "togo"],
];

/** Tout le texte d'une ville qui finira sur la page publiée. */
function textePublieVille(v: Ville): string {
  return [v.enBref, v.angle, ...v.faq.map((f) => `${f.q} ${f.r}`)].join(" ");
}

describe("données villes", () => {
  it("contient les 25 villes tier 1 attendues, slug et pays verbatim", () => {
    expect(VILLES.map((v) => [v.slug, v.nom, v.pays])).toEqual(
      VILLES_ATTENDUES.map((t) => [...t]),
    );
  });

  it("n'a pas de slug de ville en double", () => {
    const slugs = VILLES.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // Le slug sert d'URL : un accent ou une majuscule ici casse le maillage.
  it("n'utilise que des slugs sûrs en URL", () => {
    for (const v of VILLES) {
      expect(v.slug, `slug non URL-safe : ${v.slug}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("rattache chaque ville à un pays connu", () => {
    const connus = new Set(PAYS.map((p) => p.slug));
    for (const v of VILLES) {
      expect(connus.has(v.pays), `pays inconnu ${v.pays} pour ${v.slug}`).toBe(true);
    }
  });

  it("couvre les 5 pays, 5 villes chacun", () => {
    for (const p of PAYS) {
      expect(villesDuPays(p.slug).length, `villes manquantes pour ${p.slug}`).toBe(5);
    }
  });

  it("classe toutes les villes de la vague 1 en tier 1 et renseigne leur région", () => {
    for (const v of VILLES) {
      expect(v.tier, `tier inattendu pour ${v.slug}`).toBe(1);
      expect(v.region.trim().length, `region manquante pour ${v.slug}`).toBeGreaterThan(2);
    }
  });

  // G1 : aucun chiffre sans source valide. Une ville sans population est licite,
  // une ville avec une population non sourcée ne l'est pas.
  it("référence une source existante pour chaque population de ville", () => {
    for (const v of VILLES) {
      if (v.population) {
        expect(sourceExiste(v.population.source), `source inconnue pour ${v.slug}`).toBe(true);
        expect(v.population.annee).toBeGreaterThan(1990);
        expect(v.population.valeur).toBeGreaterThan(0);
      }
    }
  });

  // G1 : recensement et estimation ne se citent pas de la même façon.
  it("qualifie chaque population de ville de recensement ou d'estimation", () => {
    for (const v of VILLES) {
      if (v.population) {
        expect(["recensement", "estimation"], `nature invalide pour ${v.slug}`)
          .toContain(v.population.nature);
      }
    }
  });

  // G3 : angle rédigé à la main, propre à la ville.
  it("a un angle d'au moins 150 caractères par ville", () => {
    for (const v of VILLES) {
      expect(v.angle.length, `angle trop court pour ${v.slug}`).toBeGreaterThanOrEqual(150);
    }
  });

  it("a un angle différent pour chaque ville", () => {
    const angles = VILLES.map((v) => v.angle);
    expect(new Set(angles).size).toBe(angles.length);
  });

  // Un angle qui ne nomme jamais sa ville vaudrait pour n'importe quelle autre.
  it("ancre chaque angle dans sa propre ville", () => {
    for (const v of VILLES) {
      expect(v.angle, `angle générique pour ${v.slug}`).toContain(v.nom);
    }
  });

  it("a un enBref de ville de moins de 50 mots", () => {
    for (const v of VILLES) {
      expect(v.enBref.trim().split(/\s+/).length, `enBref trop long pour ${v.slug}`).toBeLessThan(50);
    }
  });

  it("propose 5 à 8 questions de FAQ par ville", () => {
    for (const v of VILLES) {
      expect(v.faq.length, `FAQ hors bornes pour ${v.slug}`).toBeGreaterThanOrEqual(5);
      expect(v.faq.length, `FAQ hors bornes pour ${v.slug}`).toBeLessThanOrEqual(8);
    }
  });

  // 25 pages qui se répondent pareil se cannibalisent en recherche.
  it("ne pose ni ne répond deux fois la même chose, toutes villes confondues", () => {
    const questions = VILLES.flatMap((v) => v.faq.map((f) => f.q));
    expect(new Set(questions).size, "question recopiée d'une ville à l'autre").toBe(questions.length);
    const reponses = VILLES.flatMap((v) => v.faq.map((f) => f.r));
    expect(new Set(reponses).size, "réponse recopiée d'une ville à l'autre").toBe(reponses.length);
  });

  // Les villes partagent leur espace de recherche avec les pays et les secteurs.
  it("ne recopie aucune question des pages pays ou secteur", () => {
    const ailleurs = new Set([
      ...PAYS.flatMap((p) => p.faq.map((f) => f.q)),
      ...SECTEURS.flatMap((s) => s.faq.map((f) => f.q)),
    ]);
    for (const v of VILLES) {
      for (const f of v.faq) {
        expect(ailleurs.has(f.q), `question déjà posée ailleurs (${v.slug}) : ${f.q}`).toBe(false);
      }
    }
  });

  // AEO : plafond de 60 mots par réponse, sans exception.
  it("répond en 60 mots maximum à chaque question de ville", () => {
    for (const v of VILLES) {
      for (const f of v.faq) {
        const mots = f.r.trim().split(/\s+/).length;
        expect(mots, `réponse trop longue (${mots} mots) dans ${v.slug} : ${f.q}`)
          .toBeLessThanOrEqual(60);
      }
    }
  });

  it("pose des questions de ville qui se terminent par un point d'interrogation", () => {
    for (const v of VILLES) {
      for (const f of v.faq) {
        expect(f.q.trim().endsWith("?"), `question mal formée dans ${v.slug} : ${f.q}`).toBe(true);
      }
    }
  });

  it("ne référence que des secteurs existants dans secteursDominants", () => {
    const connus = new Set(SECTEURS.map((s) => s.slug));
    for (const v of VILLES) {
      expect(v.secteursDominants.length, `secteursDominants insuffisant pour ${v.slug}`)
        .toBeGreaterThanOrEqual(3);
      expect(new Set(v.secteursDominants).size, `secteur en double dans ${v.slug}`)
        .toBe(v.secteursDominants.length);
      for (const slug of v.secteursDominants) {
        expect(connus.has(slug), `secteur inconnu ${slug} dans ${v.slug}`).toBe(true);
      }
    }
  });

  it("liste au moins 3 quartiers d'affaires par ville", () => {
    for (const v of VILLES) {
      expect(v.quartiersAffaires.length, `quartiers insuffisants pour ${v.slug}`)
        .toBeGreaterThanOrEqual(3);
      for (const q of v.quartiersAffaires) {
        expect(q.trim().length, `quartier vide dans ${v.slug}`).toBeGreaterThan(1);
      }
    }
  });

  it("n'utilise pas de tiret long dans le contenu ville publié", () => {
    for (const v of VILLES) {
      expect(textePublieVille(v), `tiret long dans ${v.slug}`).not.toContain("—");
    }
  });

  it("ne revendique aucun client ni résultat client dans les villes", () => {
    for (const v of VILLES) {
      const texte = textePublieVille(v);
      for (const motif of REVENDICATIONS_INTERDITES) {
        expect(texte, `revendication client dans ${v.slug} (motif ${motif})`).not.toMatch(motif);
      }
    }
  });

  /**
   * Wapy n'escalade PAS sur information manquante (brain.py:129-133), ne répond
   * qu'en français (brain.py:45-47), se connecte par QR code sans saisie de numéro
   * (wa.py:73-79), et ses consignes de fiche sont une directive de prompt adressée
   * à un LLM, pas un verrou. Ces trois erreurs ont déjà été écrites de bonne foi.
   */
  it("ne promet ni escalade automatique ni déterminisme absolu", () => {
    const interdits = [
      /d[eè]s qu(e |'une? )[^.]{0,40}(sort du cadre|d[ée]passe|n'est pas pr[ée]vu)/i,
      /(transmet|passe la main|alerte)[^.]{0,40}d[èe]s qu'(une |il )?(information|info|question)[^.]{0,20}manque/i,
      /\b(garantit|verrouille|verrouill[ée]e?s?|à la lettre|ne fera jamais|ne se trompe jamais)\b/i,
      /\btoujours la bonne réponse\b/i,
      /r[ée]pond (aussi )?en anglais|r[ée]pond dans la langue (du|de)/i,
      /(saisis(sez)?|entrez|renseignez|tapez)[^.]{0,40}num[ée]ro[^.]{0,40}(pour (la )?conne(cter|xion)|pour lier)/i,
    ];
    for (const v of VILLES) {
      const texte = textePublieVille(v);
      for (const motif of interdits) {
        expect(texte, `promesse non tenue par le code dans ${v.slug} (motif ${motif})`)
          .not.toMatch(motif);
      }
    }
  });

  // billing.py publie des quotas de conversations qu'aucun code n'applique :
  // les afficher serait annoncer une limite qui n'existe pas.
  it("n'annonce aucun quota de conversations", () => {
    for (const v of VILLES) {
      expect(textePublieVille(v), `quota de conversations annoncé dans ${v.slug}`)
        .not.toMatch(/\d[\d\s]*conversations?\s*(\/|par )\s*mois|limite de conversations/i);
    }
  });

  it("garde toutes les villes non publiées en vague 1", () => {
    expect(villesPubliees()).toHaveLength(0);
    for (const v of VILLES) {
      expect(v.publie, `ville publiée trop tôt : ${v.slug}`).toBe(false);
    }
  });

  it("expose getVille", () => {
    expect(getVille("cotonou")?.nom).toBe("Cotonou");
    expect(getVille("inconnu")).toBeUndefined();
  });
});
