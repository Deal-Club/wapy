import { describe, it, expect } from "vitest";
import {
  pagesPubliees,
  liensSortants,
  liensEntrants,
  auditMaillage,
  ancre,
} from "@/lib/maillage";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { COMPARATIFS_PUBLIES, getComparatif } from "@/content/comparatifs";
import { CONCURRENTS } from "@/content/concurrents";

describe("ancres déterministes", () => {
  it("rend toujours la même ancre pour la même graine", () => {
    const v = ["chatbot WhatsApp Bénin", "assistant WhatsApp au Bénin", "Wapy au Bénin"];
    expect(ancre(v, "cotonou")).toBe(ancre(v, "cotonou"));
  });

  it("choisit une ancre parmi les variantes fournies", () => {
    const v = ["a", "b", "c"];
    expect(v).toContain(ancre(v, "graine-quelconque"));
  });

  it("répartit les ancres entre plusieurs graines", () => {
    const v = ["a", "b", "c"];
    const obtenues = new Set(
      ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"].map((g) => ancre(v, g)),
    );
    expect(obtenues.size).toBeGreaterThan(1);
  });
});

describe("graphe des pages publiées", () => {
  it("inclut l'accueil, les pays publiés et les secteurs publiés", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(urls).toContain("/");
    for (const p of paysPublies()) expect(urls).toContain(`/chatbot-whatsapp/${p.slug}`);
    for (const s of secteursPublies()) expect(urls).toContain(`/secteurs/${s.slug}`);
  });

  it("exclut les villes non publiées", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(urls.some((u) => u.startsWith("/chatbot-whatsapp/benin/"))).toBe(false);
  });

  it("n'a pas d'url en double", () => {
    const urls = pagesPubliees().map((p) => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("liens", () => {
  it("ne pointe que vers des pages publiées", () => {
    const publiees = new Set(pagesPubliees().map((p) => p.url));
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(publiees.has(lien.href), `${page.url} pointe vers ${lien.href} non publiée`).toBe(true);
      }
    }
  });

  it("ne crée jamais d'auto-lien", () => {
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(lien.href).not.toBe(page.url);
      }
    }
  });

  it("donne une ancre non vide à chaque lien", () => {
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        expect(lien.ancre.trim().length).toBeGreaterThan(2);
      }
    }
  });

  // Les deux sens de l'équivalence liensEntrants ↔ liensSortants, vérifiés sur
  // tout le graphe et pas sur une seule cible choisie au hasard (une seule
  // cible laisserait passer un bug qui n'affecterait que d'autres pages).
  //
  // Sens 1 : pas de sous-comptage. Tout lien sortant de A vers B doit
  // réapparaître dans liensEntrants(B) — sinon auditMaillage() sous-estime le
  // maillage réel d'une page et pourrait la signaler à tort comme en défaut.
  it("chaque lien sortant se retrouve dans les entrants de sa cible, sur tout le graphe", () => {
    for (const page of pagesPubliees()) {
      for (const lien of liensSortants(page.url)) {
        const entrants = liensEntrants(lien.href);
        expect(
          entrants.some((e) => e.href === page.url),
          `${page.url} -> ${lien.href} absent de liensEntrants(${lien.href})`,
        ).toBe(true);
      }
    }
  });

  // Sens 2 : pas de sur-comptage. Tout entrant déclaré pour une page B doit
  // correspondre à un vrai lien sortant de sa source vers B — sinon
  // auditMaillage() pourrait compter un faux entrant et masquer un
  // sous-maillage réel sans qu'aucun test ne le signale.
  it("chaque entrant déclaré correspond à un vrai lien sortant de sa source, sur tout le graphe", () => {
    for (const page of pagesPubliees()) {
      for (const entrant of liensEntrants(page.url)) {
        expect(
          liensSortants(entrant.href).some((l) => l.href === page.url),
          `liensEntrants(${page.url}) déclare ${entrant.href} sans lien sortant réel vers ${page.url}`,
        ).toBe(true);
      }
    }
  });
});

// G2 : garde-fou du maillage
describe("audit de maillage", () => {
  it("ne laisse aucune page publiée sous 3 liens entrants", () => {
    const defauts = auditMaillage();
    expect(defauts, `pages sous-maillées : ${JSON.stringify(defauts)}`).toEqual([]);
  });
});

/** Texte réellement publié par une page comparatif, tableau et légende compris. */
function textePublie(c: (typeof COMPARATIFS_PUBLIES)[number]): string {
  return [
    c.titre,
    c.enBref,
    ...c.sections.flatMap((s) => [s.titre, ...s.paragraphes]),
    ...c.tableau.lignes.flatMap((l) => c.tableau.colonnes.map((col) => l[col.cle] ?? "")),
    c.tableau.legende,
    ...c.faq.flatMap((f) => [f.q, f.r]),
  ].join(" ");
}

describe("contenu des comparatifs", () => {
  it("compte 8 pages publiées", () => {
    expect(COMPARATIFS_PUBLIES).toHaveLength(8);
  });

  it("n'a pas de slug en double", () => {
    const slugs = COMPARATIFS_PUBLIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("a un enBref de moins de 50 mots", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(c.enBref.trim().split(/\s+/).length, `enBref trop long pour ${c.slug}`).toBeLessThan(50);
    }
  });

  it("propose au moins 2 sections et 5 questions par page", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(c.sections.length, `sections insuffisantes pour ${c.slug}`).toBeGreaterThanOrEqual(2);
      expect(c.faq.length, `FAQ insuffisante pour ${c.slug}`).toBeGreaterThanOrEqual(5);
    }
  });

  it("donne un identifiant d'ancrage unique et non vide à chaque section", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const ids = c.sections.map((s) => s.id);
      for (const id of ids) {
        expect(id, `identifiant de section vide dans ${c.slug}`).toMatch(/^[a-z0-9-]+$/);
      }
      expect(new Set(ids).size, `identifiants de section en double dans ${c.slug}`).toBe(ids.length);
      // « tableau » et « faq » sont posés par la page elle-même : une section qui
      // les reprendrait produirait deux éléments de même id et un sommaire ambigu.
      expect(ids, `id réservé repris dans ${c.slug}`).not.toContain("tableau");
      expect(ids, `id réservé repris dans ${c.slug}`).not.toContain("faq");
    }
  });

  it("remplit chaque cellule du tableau", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(c.tableau.lignes.length, `tableau vide dans ${c.slug}`).toBeGreaterThan(1);
      for (const ligne of c.tableau.lignes) {
        for (const col of c.tableau.colonnes) {
          expect(ligne[col.cle], `cellule vide ${col.cle} dans ${c.slug}`).toBeTruthy();
        }
      }
    }
  });

  it("répond en 60 mots maximum à chaque question", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      for (const f of c.faq) {
        const mots = f.r.trim().split(/\s+/).length;
        expect(mots, `réponse trop longue (${mots} mots) dans ${c.slug} : ${f.q}`)
          .toBeLessThanOrEqual(60);
        expect(f.q.trim().endsWith("?"), `question sans point d'interrogation : ${f.q}`).toBe(true);
      }
    }
  });

  it("ne pose jamais deux fois la même question, tous comparatifs confondus", () => {
    const questions = COMPARATIFS_PUBLIES.flatMap((c) => c.faq.map((f) => f.q));
    expect(new Set(questions).size, "question de FAQ en double").toBe(questions.length);
  });

  it("n'utilise pas de tiret long", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(textePublie(c), `tiret long dans ${c.slug}`).not.toMatch(/[—–]/);
    }
  });

  it("n'affiche aucun prix de Wapy", () => {
    // Les montants de `saas/billing.py` sont provisoires et n'ont pas été
    // validés commercialement : publier un prix Wapy engagerait une offre qui
    // n'existe pas. Les tarifs des tiers, eux, sont relevés et datés.
    for (const c of COMPARATIFS_PUBLIES) {
      // Les cellules « wapy » du tableau ne doivent porter aucun montant.
      for (const ligne of c.tableau.lignes) {
        const cellule = [ligne.wapy ?? "", ligne.outil === "Wapy" ? Object.values(ligne).join(" ") : ""]
          .join(" ");
        expect(cellule, `montant dans la ligne Wapy de ${c.slug}`).not.toMatch(
          /\d[\d\s]*\s*(FCFA|XOF|EUR|€)/,
        );
      }
      // Et aucune phrase du corps ne doit rattacher un montant à Wapy.
      const corps = [c.enBref, ...c.sections.flatMap((s) => s.paragraphes), ...c.faq.map((f) => f.r)]
        .join(" ");
      const phrases = corps.split(/(?<=[.!?])\s+/).filter((p) => /wapy|chez nous|notre/i.test(p));
      for (const phrase of phrases) {
        expect(phrase, `prix de Wapy annoncé dans ${c.slug}`).not.toMatch(
          /\d[\d\s]*\s*(FCFA|XOF|EUR|€)/,
        );
      }
    }
  });

  it("n'annonce aucun quota de conversations", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(textePublie(c), `quota de conversations annoncé dans ${c.slug}`).not.toMatch(
        /\d[\d\s]*conversations?\s*(\/|par )\s*mois|limite de conversations/i,
      );
    }
  });

  /**
   * Mêmes garde-fous que pour les pages pays et ville : Wapy n'escalade pas sur
   * information manquante (brain.py:129-133), ne répond qu'en français
   * (brain.py:46-47), et se connecte par QR code sans saisie de numéro
   * (wa.py:73-79). Une page comparative est le premier endroit où l'on est
   * tenté de surpromettre.
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
    for (const c of COMPARATIFS_PUBLIES) {
      for (const motif of interdits) {
        expect(textePublie(c), `promesse non tenue par le code dans ${c.slug} (motif ${motif})`)
          .not.toMatch(motif);
      }
    }
  });

  it("ne revendique aucun client ni résultat client", () => {
    const interdits = [
      /nos clients|nos utilisateurs|nos établissements/i,
      /témoignage|avis clients?/i,
      /ont vu leurs?|ont augmenté|ont gagné|ont doublé/i,
      /déjà adopté|nous font confiance|rejoignez les/i,
    ];
    for (const c of COMPARATIFS_PUBLIES) {
      for (const motif of interdits) {
        expect(textePublie(c), `revendication client dans ${c.slug} (motif ${motif})`).not.toMatch(
          motif,
        );
      }
    }
  });
});

/**
 * Garde-fou central du silo décision. Ce que ces pages disent des tiers ne peut
 * venir que de `content/concurrents.ts`, relevé à la source. Et chaque
 * concurrent doit voir ses points forts EXPOSÉS : une page qui masquerait
 * l'avantage d'un concurrent serait contredite au premier lecteur qui le
 * connaît, et une source contredite cesse d'être citée.
 */
describe("honnêteté des pages wapy-vs", () => {
  it("publie une page par concurrent vérifié", () => {
    for (const c of CONCURRENTS) {
      expect(getComparatif(`wapy-vs-${c.slug}`), `page absente pour ${c.slug}`).toBeDefined();
    }
  });

  it("expose chaque point fort du concurrent, mot pour mot", () => {
    for (const c of CONCURRENTS) {
      const page = getComparatif(`wapy-vs-${c.slug}`);
      if (!page) throw new Error(`page wapy-vs-${c.slug} absente`);
      const texte = textePublie(page);
      for (const fort of c.pointsForts) {
        expect(texte, `point fort masqué sur wapy-vs-${c.slug} : ${fort}`).toContain(fort);
      }
    }
  });

  it("expose aussi ses limites, sans en ajouter", () => {
    for (const c of CONCURRENTS) {
      const page = getComparatif(`wapy-vs-${c.slug}`);
      if (!page) throw new Error(`page wapy-vs-${c.slug} absente`);
      const texte = textePublie(page);
      for (const limite of c.pointsFaibles) {
        expect(texte, `limite absente de wapy-vs-${c.slug} : ${limite}`).toContain(limite);
      }
    }
  });

  it("date et source chaque tableau qui parle d'un tiers", () => {
    for (const c of CONCURRENTS) {
      const page = getComparatif(`wapy-vs-${c.slug}`);
      if (!page) throw new Error(`page wapy-vs-${c.slug} absente`);
      expect(page.tableau.legende, `source absente sur wapy-vs-${c.slug}`).toContain(c.url);
      expect(page.tableau.legende, `date de relevé absente sur wapy-vs-${c.slug}`).toMatch(
        /11 août 2026/,
      );
    }
  });

  /**
   * NéoBot est le concurrent le plus proche, et son site est une application
   * monopage dont la FAQ n'est pas rendue côté serveur : son mode de connexion
   * à WhatsApp n'a pas pu être relevé et n'est pas dans sa fiche. C'est
   * précisément le point de comparaison qu'on aurait envie d'écrire.
   */
  it("n'attribue à aucun concurrent un mode de connexion à WhatsApp non relevé", () => {
    for (const c of CONCURRENTS) {
      const page = getComparatif(`wapy-vs-${c.slug}`);
      if (!page) throw new Error(`page wapy-vs-${c.slug} absente`);
      const texte = textePublie(page);
      const phrases = texte.split(/(?<=[.!?])\s+/);
      for (const phrase of phrases) {
        if (!phrase.includes(c.nom)) continue;
        if (/qr code|code qr|appareils connect/i.test(phrase)) {
          const ancre = c.pointsForts.concat(c.pointsFaibles, [c.positionnement]);
          expect(
            ancre.some((champ) => phrase.includes(champ)),
            `mode de connexion prêté à ${c.nom} : « ${phrase} »`,
          ).toBe(true);
        }
      }
    }
  });

  it("dit ce que Wapy ne fait pas sur chaque page wapy-vs", () => {
    for (const c of CONCURRENTS) {
      const page = getComparatif(`wapy-vs-${c.slug}`);
      if (!page) throw new Error(`page wapy-vs-${c.slug} absente`);
      const texte = textePublie(page);
      expect(texte, `limites de Wapy absentes de wapy-vs-${c.slug}`).toMatch(
        /français uniquement|ne répond qu'en français|n'envoie ni campagne|pas d'API officielle|n'encaisse pas/i,
      );
    }
  });
});
