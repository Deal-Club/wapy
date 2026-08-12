import { describe, it, expect } from "vitest";
import { FAQ_GLOBALE } from "@/content/faq-globale";
import {
  PLANS,
  OPTIONS,
  JOURS_ESSAI,
  TARIF_NON_PUBLIE,
  COLONNES_TARIFS,
  montantAffiche,
  lignesTarifs,
  offresPubliables,
  type Plan,
} from "@/content/plans";
import { ETAPES } from "@/content/etapes";
import PageAPropos from "@/app/a-propos/page";
import PageTarifs from "@/app/tarifs/page";
import PageFaq from "@/app/faq/page";
import PageCommentCaMarche from "@/app/comment-ca-marche/page";
import Accueil from "@/app/page";
import { auditMaillage, liensSortants, type Lien } from "@/lib/maillage";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { hrefs, parcourir, section, textes } from "./arbre-react";

/**
 * Valeur d'une prop transmise par la page, où qu'elle se trouve dans l'arbre.
 *
 * `parcourir` ne descend que dans les `children` : les composants enfants
 * (`PagesLiees`, `FAQ`, `TableauComparatif`) ne sont pas exécutés, seules leurs
 * props sont observables. C'est ce qu'on veut vérifier ici, le rendu de ces
 * composants étant leur affaire et non celle de la page.
 */
function prop<T>(racine: unknown, nom: string): T | undefined {
  let trouve: T | undefined;
  parcourir(racine, (el) => {
    const p = el.props as Record<string, unknown>;
    if (trouve === undefined && p[nom] !== undefined) trouve = p[nom] as T;
  });
  return trouve;
}

/**
 * Texte réellement rendu par une page entité, aplati en une seule chaîne. Les
 * composants enfants ne sont pas exécutés (cf. `arbre-react`), leurs props le
 * sont : ce qui est mesuré ici est ce que la PAGE publie.
 */
function textePage(racine: unknown): string {
  return textes(racine).join(" ");
}

/**
 * Wapy n'a aucun client en production : aucune page ne peut invoquer une
 * clientèle, un témoignage ou un résultat obtenu. Motifs repris de
 * `donnees.test.ts`, où ils gardent déjà les silos pays, secteur et ville.
 */
const REVENDICATIONS_INTERDITES = [
  /nos clients|nos utilisateurs|nos établissements|nos restaurants|nos salons/i,
  /témoignage|avis clients?/i,
  /ont vu leurs?|ont augmenté|ont gagné|ont doublé|ont constaté/i,
  /(centaines|milliers|dizaines) d[eu']/i,
  /déjà adopté|nous font confiance|rejoignez les/i,
];

/**
 * Promesses que le code ne tient pas. Mêmes motifs que `donnees.test.ts` :
 * l'assistant n'escalade PAS sur information manquante (`brain/brain.py:134-138`),
 * ne répond qu'en français (`brain/brain.py:50-52`), se connecte par QR code sans
 * saisie de numéro (`saas/wa.py:73-79`), et ses consignes de fiche sont une
 * directive de prompt adressée à un modèle, pas un verrou.
 */
const PROMESSES_INTERDITES = [
  /d[eè]s qu(e |'une? )[^.]{0,40}(sort du cadre|d[ée]passe|n'est pas pr[ée]vu)/i,
  /(transmet|passe la main|alerte)[^.]{0,40}d[èe]s qu'(une |il )?(information|info|question)[^.]{0,20}manque/i,
  /\b(garantit|verrouille|verrouill[ée]e?s?|à la lettre|ne fera jamais|ne se trompe jamais)\b/i,
  /\btoujours la bonne réponse\b/i,
  /r[ée]pond (aussi )?en anglais|r[ée]pond dans la langue (du|de)/i,
  /(saisis(sez)?|entrez|renseignez|tapez)[^.]{0,40}num[ée]ro[^.]{0,40}(pour (la )?conne(cter|xion)|pour lier)/i,
];

/**
 * `saas/billing.py:38,43` déclare 500 et 2 500 conversations par mois et un
 * add-on « +1 000 conversations », mais aucun code ne les applique. Annoncer un
 * de ces quotas serait vendre une limite qui n'existe pas, et un plafond qu'on
 * n'applique pas est aussi une promesse implicite de tout ce qui est en dessous.
 */
const QUOTA_CONVERSATIONS = /\d[\d\s  ]*conversations?\s*(\/|par )\s*mois|limite de conversations|quota de conversations/i;

/**
 * Un montant en francs CFA sous ses formes publiables. Sert à prouver l'absence
 * de prix, donc doit rester large : un chiffre suivi de FCFA, F CFA, XOF ou du
 * symbole, quelle que soit l'espace de groupement (fine insécable comprise).
 */
const MONTANT = /\d[\d\s  .,]*\s*(FCFA|F\s?CFA|XOF|francs? CFA)/i;

describe("FAQ globale", () => {
  it("propose au moins 10 questions", () => {
    expect(FAQ_GLOBALE.length).toBeGreaterThanOrEqual(10);
  });

  it("ne pose jamais deux fois la même question", () => {
    const questions = FAQ_GLOBALE.map((f) => f.q);
    expect(new Set(questions).size).toBe(questions.length);
  });

  /**
   * Plafond de 60 mots, comme les FAQ des silos pays, secteur et ville
   * (`donnees.test.ts`) : au-delà, la réponse cesse d'être extractible telle
   * quelle par un moteur. Le plancher de 20 mots écarte la réponse creuse.
   */
  it("garde des réponses entre 20 et 60 mots", () => {
    for (const f of FAQ_GLOBALE) {
      const mots = f.r.trim().split(/\s+/).length;
      expect(mots, `réponse trop courte (${mots} mots) : ${f.q}`).toBeGreaterThanOrEqual(20);
      expect(mots, `réponse trop longue (${mots} mots) : ${f.q}`).toBeLessThanOrEqual(60);
    }
  });

  it("pose de vraies questions", () => {
    for (const f of FAQ_GLOBALE) {
      expect(f.q.trim().endsWith("?"), `question sans point d'interrogation : ${f.q}`).toBe(true);
    }
  });

  it("n'utilise aucun tiret long", () => {
    for (const f of FAQ_GLOBALE) {
      expect(`${f.q} ${f.r}`, `tiret long dans : ${f.q}`).not.toMatch(/[—–]/);
    }
  });

  it("n'invoque aucune clientèle ni aucun résultat client", () => {
    for (const f of FAQ_GLOBALE) {
      for (const motif of REVENDICATIONS_INTERDITES) {
        expect(`${f.q} ${f.r}`, `revendication de clientèle dans : ${f.q}`).not.toMatch(motif);
      }
    }
  });

  it("ne promet ni escalade automatique ni déterminisme absolu", () => {
    for (const f of FAQ_GLOBALE) {
      for (const motif of PROMESSES_INTERDITES) {
        expect(`${f.q} ${f.r}`, `promesse non tenue par le code dans : ${f.q}`).not.toMatch(motif);
      }
    }
  });

  it("n'annonce aucun quota de conversations", () => {
    for (const f of FAQ_GLOBALE) {
      expect(`${f.q} ${f.r}`, `quota de conversations dans : ${f.q}`).not.toMatch(
        QUOTA_CONVERSATIONS,
      );
    }
  });

  it("n'affiche aucun montant", () => {
    for (const f of FAQ_GLOBALE) {
      expect(`${f.q} ${f.r}`, `montant publié dans : ${f.q}`).not.toMatch(MONTANT);
    }
  });
});

describe("plans", () => {
  it("décrit les trois plans de la plateforme, sous leurs clés réelles", () => {
    expect(PLANS.map((p) => p.slug)).toEqual(["essentiel", "pro", "business"]);
  });

  it("dit ce que chaque plan contient et quelles limites lui sont appliquées", () => {
    for (const p of PLANS) {
      expect(p.inclus.length, `plan ${p.slug} trop peu décrit`).toBeGreaterThan(2);
      expect(p.limites.length, `limites absentes du plan ${p.slug}`).toBeGreaterThan(0);
      expect(p.devise).toBe("XOF");
      expect(p.periode).toBe("mois");
    }
  });

  it("annonce l'essai gratuit de 7 jours de la plateforme", () => {
    // saas/billing.py:14 : TRIAL_DAYS = 7.
    expect(JOURS_ESSAI).toBe(7);
  });

  // --- Branche 1 : la grille est arrêtée, les montants sont publiés ----------

  it("renseigne le prix de chaque plan et de chaque option", () => {
    for (const p of PLANS) expect(p.prix, `prix manquant pour le plan ${p.slug}`).toBeGreaterThan(0);
    for (const o of OPTIONS) expect(o.prix, `prix manquant pour l'option ${o.slug}`).toBeGreaterThan(0);
  });

  it("rend un montant pour chaque plan, aucune case ne reste vide", () => {
    for (const p of PLANS) {
      expect(montantAffiche(p), `montant absent pour le plan ${p.slug}`).toMatch(MONTANT);
    }
    for (const ligne of lignesTarifs(PLANS)) {
      expect(ligne.tarif, `tarif non publié pour ${ligne.plan}`).not.toBe(TARIF_NON_PUBLIE);
      expect(ligne.tarif).toMatch(MONTANT);
    }
  });

  it("émet une offre structurée par plan", () => {
    // `offerLd` lève sur un tableau vide : il faut donc qu'il soit rempli.
    expect(offresPubliables(PLANS)).toHaveLength(PLANS.length);
    for (const o of offresPubliables(PLANS)) expect(o.prix).toBeGreaterThan(0);
  });

  it("classe les plans par prix croissant", () => {
    const prix = PLANS.map((p) => p.prix ?? 0);
    expect(prix).toEqual([...prix].sort((a, b) => a - b));
  });

  // --- Branche 2 : prix renseigné (état futur, une seule édition de plans.ts) -

  /** Copie d'un plan réel augmentée d'un montant, pour éprouver l'autre branche. */
  const PLAN_AVEC_PRIX: Plan = { ...PLANS[0], prix: 12345 };

  it("affiche le montant dès que le champ prix est renseigné", () => {
    const rendu = montantAffiche(PLAN_AVEC_PRIX);
    expect(rendu).not.toBeNull();
    expect(rendu ?? "").toMatch(MONTANT);
    expect((rendu ?? "").replace(/[\s  ]/g, "")).toContain("12345");
    expect(rendu ?? "").toContain("FCFA");
  });

  it("place ce montant dans la ligne de tableau du plan concerné", () => {
    const [ligne] = lignesTarifs([PLAN_AVEC_PRIX]);
    expect(ligne.tarif).not.toBe(TARIF_NON_PUBLIE);
    expect(ligne.tarif).toMatch(MONTANT);
  });

  it("expose alors ce plan comme offre structurée", () => {
    expect(offresPubliables([PLAN_AVEC_PRIX])).toEqual([
      { nom: PLAN_AVEC_PRIX.nom, prix: 12345, devise: "XOF" },
    ]);
  });

  // --- Contenu des plans ----------------------------------------------------

  it("annonce un quota de conversations sur chaque plan", () => {
    // Le quota n'est publiable que parce qu'il est appliqué (saas/usage.py,
    // `quota_atteint`). Annoncer une limite que personne ne contrôle serait
    // vendre une contrainte fictive ; ne pas annoncer une limite appliquée
    // serait pire encore.
    for (const p of PLANS) {
      expect(p.limites.join(" "), `quota absent du plan ${p.slug}`).toMatch(QUOTA_CONVERSATIONS);
    }
  });

  it("n'utilise aucun tiret long", () => {
    const texte = [
      ...PLANS.flatMap((p) => [p.nom, p.resume, ...p.inclus, ...p.limites]),
      ...OPTIONS.map((o) => o.nom),
      TARIF_NON_PUBLIE,
    ].join(" ");
    expect(texte).not.toMatch(/[—–]/);
  });
});

describe("étapes de mise en route", () => {
  it("décrit la mise en route en 3 à 6 étapes", () => {
    expect(ETAPES.length).toBeGreaterThanOrEqual(3);
    expect(ETAPES.length).toBeLessThanOrEqual(6);
  });

  it("donne à chaque étape un nom et un texte utilisables par le balisage HowTo", () => {
    for (const e of ETAPES) {
      expect(e.nom.trim().length, `nom d'étape vide`).toBeGreaterThan(3);
      expect(e.texte.trim().length, `étape trop courte : ${e.nom}`).toBeGreaterThan(80);
    }
  });

  it("n'utilise aucun tiret long et ne promet rien que le code ne tienne", () => {
    for (const e of ETAPES) {
      const texte = `${e.nom} ${e.texte}`;
      expect(texte, `tiret long dans l'étape : ${e.nom}`).not.toMatch(/[—–]/);
      for (const motif of PROMESSES_INTERDITES) {
        expect(texte, `promesse non tenue par le code dans l'étape : ${e.nom}`).not.toMatch(motif);
      }
      expect(texte, `montant dans l'étape : ${e.nom}`).not.toMatch(MONTANT);
    }
  });
});

/** Les 4 routes entité, avec la page qui les rend. */
const PAGES_ENTITE: { url: string; page: () => unknown }[] = [
  { url: "/a-propos", page: PageAPropos },
  { url: "/tarifs", page: PageTarifs },
  { url: "/faq", page: PageFaq },
  { url: "/comment-ca-marche", page: PageCommentCaMarche },
];

describe("pages entité", () => {
  it("relie chaque page aux piliers, via le moteur de maillage", () => {
    for (const { url, page } of PAGES_ENTITE) {
      const attendus = liensSortants(url);
      expect(attendus.length, `aucun lien sortant calculé pour ${url}`).toBeGreaterThan(2);
      // Comparaison au tableau entier : une page qui filtrerait ou réordonnerait
      // les liens du moteur casserait le compte d'entrants sur lequel repose
      // `auditMaillage`, sans qu'aucune assertion « contient » ne le voie.
      expect(prop<Lien[]>(page(), "liens"), `bloc de liens absent de ${url}`).toEqual(attendus);
    }
  });

  it("garde le fil d'Ariane et l'appel à l'action de chaque page", () => {
    for (const { url, page } of PAGES_ENTITE) {
      const liens = hrefs(page());
      expect(liens, `fil d'Ariane absent de ${url}`).toContain("/");
      expect(liens, `appel à l'action absent de ${url}`).toContain("/signup");
    }
  });

  it("n'invoque aucune clientèle ni aucun résultat client", () => {
    for (const { url, page } of PAGES_ENTITE) {
      const texte = textePage(page());
      for (const motif of REVENDICATIONS_INTERDITES) {
        expect(texte, `revendication de clientèle sur ${url}`).not.toMatch(motif);
      }
    }
  });

  it("ne promet rien que le code ne tienne", () => {
    for (const { url, page } of PAGES_ENTITE) {
      const texte = textePage(page());
      for (const motif of PROMESSES_INTERDITES) {
        expect(texte, `promesse non tenue par le code sur ${url}`).not.toMatch(motif);
      }
    }
  });

  it("n'utilise aucun tiret long dans le texte publié", () => {
    for (const { url, page } of PAGES_ENTITE) {
      expect(textePage(page()), `tiret long sur ${url}`).not.toMatch(/[—–]/);
    }
  });

  it("publie les montants et les quotas sur la page tarifs", () => {
    const tarifs = PAGES_ENTITE.find((p) => p.url === "/tarifs");
    expect(tarifs, "page /tarifs introuvable").toBeDefined();
    const texte = textePage(tarifs!.page());
    expect(texte, "aucun montant sur /tarifs").toMatch(MONTANT);
    expect(texte, "aucun quota de conversations sur /tarifs").toMatch(QUOTA_CONVERSATIONS);
  });
});

describe("page tarifs", () => {
  it("nomme les trois plans et annonce l'essai gratuit", () => {
    const texte = textePage(PageTarifs());
    for (const p of PLANS) expect(texte, `plan ${p.nom} absent de /tarifs`).toContain(p.nom);
    expect(texte).toMatch(/sept jours/i);
  });

  it("publie le tarif d'entrée et explique ce qui est compté", () => {
    // Un tarif sans unité de compte n'est pas un tarif : le visiteur ne peut pas
    // savoir ce qu'il achète. La page doit porter les deux.
    const texte = textePage(PageTarifs());
    expect(texte, "aucun montant en francs CFA").toMatch(MONTANT);
    expect(texte, "l'unité facturée n'est pas expliquée").toMatch(/conversation/i);
    expect(texte, "le comportement au plafond n'est pas dit").toMatch(/plafond|attente/i);
    expect(texte, "mention « non publié » résiduelle").not.toContain(TARIF_NON_PUBLIE);
  });
});

/**
 * `content/sources.ts` fait pointer la source « wapy-plateforme » vers
 * `/a-propos` : chaque chiffre mesuré du site y renvoie par le lien « Source »
 * de `BlocPreuve`. Si cette page ne publie pas la méthode de mesure, le lien
 * mène à une page qui ne justifie rien et l'ancrage se perd.
 */
describe("page à propos", () => {
  it("publie la méthode des deux chiffres mesurés du site", () => {
    const texte = textePage(PageAPropos());
    expect(texte, "méthode du nombre de guides sectoriels absente").toContain(
      "content/secteurs.ts",
    );
    expect(texte, "méthode du nombre de tests backend absente").toContain("pytest");
  });
});

describe("page comment ça marche", () => {
  it("rend chaque étape de la mise en route", () => {
    const texte = textePage(PageCommentCaMarche());
    for (const e of ETAPES) {
      expect(texte, `étape absente : ${e.nom}`).toContain(e.nom);
    }
  });
});

describe("accueil", () => {
  it("porte tous les liens sortants calculés pour la racine", () => {
    // C'est de l'accueil que les pays, secteurs et comparatifs tirent
    // l'essentiel de leurs liens entrants : le bloc doit porter le tableau
    // complet du moteur, pas un extrait.
    expect(prop<Lien[]>(Accueil(), "liens"), "bloc de liens absent de l'accueil").toEqual(
      liensSortants("/"),
    );
  });

  it("garde ses liens de conversion et de navigation", () => {
    const liens = hrefs(Accueil());
    expect(liens).toContain("/signup");
    expect(liens, "lien vers la FAQ complète absent").toContain("/faq");
  });

  /**
   * La maquette de conversation du hero est le seul endroit du site où un
   * montant paraît : « 3 500 FCFA » y est le prix d'un plat d'un restaurant
   * fictif, ce que dirait l'assistant d'un CLIENT. Il est exclu par son
   * identifiant plutôt que par une exception dans le motif, pour que le reste
   * de la page reste sous la même garde que les 4 pages entité.
   */
  it("ne publie ni montant ni quota de conversations, maquette de démonstration exclue", () => {
    const maquette = new Set(textes(section(Accueil(), "maquette-conversation")));
    expect(maquette.size, "maquette de conversation introuvable").toBeGreaterThan(0);
    const texte = textes(Accueil())
      .filter((t) => !maquette.has(t))
      .join(" ");
    expect(texte, "montant publié sur l'accueil").not.toMatch(MONTANT);
    expect(texte, "quota de conversations sur l'accueil").not.toMatch(QUOTA_CONVERSATIONS);
  });

  it("n'invoque aucune clientèle ni aucun résultat client", () => {
    const texte = textePage(Accueil());
    for (const motif of REVENDICATIONS_INTERDITES) {
      expect(texte, "revendication de clientèle sur l'accueil").not.toMatch(motif);
    }
  });
});

/**
 * Les 4 pages entité étaient déjà déclarées publiées par `pagesPubliees()` alors
 * qu'aucune route ne les rendait. Maintenant qu'elles existent, le graphe doit
 * rester exactement dans l'état que l'audit exige.
 */
describe("maillage après publication des pages entité", () => {
  it("ne laisse aucune page publiée sous 3 liens entrants", () => {
    const defauts = auditMaillage();
    expect(defauts, `pages sous-maillées : ${JSON.stringify(defauts)}`).toEqual([]);
  });

  it("garde les 8 comparatifs publiés", () => {
    expect(COMPARATIFS_PUBLIES).toHaveLength(8);
  });
});
