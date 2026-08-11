import { describe, it, expect } from "vitest";
import PagePays, {
  generateStaticParams as paramsPays,
} from "@/app/chatbot-whatsapp/[pays]/page";
import { generateStaticParams as paramsSecteur } from "@/app/secteurs/[secteur]/page";
import PageComparatif, {
  generateStaticParams as paramsComparatif,
} from "@/app/comparatif/[slug]/page";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { VILLES, villesDuPays } from "@/content/villes";
import { hrefs, parcourir, section, textes } from "./arbre-react";

/**
 * Invariant surveillé ici : aucune page n'est générée pour une donnée non
 * publiée. Une entrée `publie: false` qui obtiendrait tout de même sa route
 * mettrait en ligne du contenu que personne n'a validé, sans que rien d'autre
 * dans la suite ne s'en aperçoive.
 */
describe("génération statique", () => {
  it("génère une route par pays publié", () => {
    expect(paramsPays().map((p) => p.pays).sort()).toEqual(
      paysPublies().map((p) => p.slug).sort(),
    );
  });

  it("génère une route par secteur publié", () => {
    expect(paramsSecteur().map((p) => p.secteur).sort()).toEqual(
      secteursPublies().map((s) => s.slug).sort(),
    );
  });

  /**
   * Vague 1 : les 25 villes sont toutes en `publie: false`. Si cette prémisse
   * cessait d'être vraie sans que les pages villes existent, la page pays
   * produirait des liens vers des routes absentes.
   */
  it("ne publie aucune ville en vague 1", () => {
    expect(VILLES.filter((v) => v.publie).map((v) => v.slug)).toEqual([]);
  });

  it("génère une route par comparatif publié", () => {
    expect(paramsComparatif().map((p) => p.slug).sort()).toEqual(
      COMPARATIFS_PUBLIES.map((c) => c.slug).sort(),
    );
  });
});

/**
 * Un sommaire est le seul composant capable de produire des liens morts à
 * l'intérieur d'une même page : ses ancres sont écrites d'un côté, les `id` des
 * sections de l'autre. Sur le silo comparatif, les deux viennent de sources
 * différentes (les sections du contenu, `tableau` et `faq` du gabarit), ce qui
 * rend la divergence d'autant plus facile.
 */
describe("pages comparatif", () => {
  /**
   * `parcourir` ne descend que dans les `children` : les composants enfants
   * (`Sommaire`, `FAQ`, `PagesLiees`) ne sont pas exécutés, seules leurs props
   * sont observables. C'est suffisant, et même préférable ici : ce qu'on veut
   * vérifier est ce que la PAGE transmet, le rendu de ces composants étant
   * leur affaire.
   */
  function prop<T>(slug: string, nom: string): T | undefined {
    let trouve: T | undefined;
    parcourir(PageComparatif({ params: { slug } }), (el) => {
      const p = el.props as Record<string, unknown>;
      if (trouve === undefined && p[nom] !== undefined) trouve = p[nom] as T;
    });
    return trouve;
  }

  it("pointe chaque entrée de sommaire vers une section réellement rendue", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const entrees = prop<{ id: string; libelle: string }[]>(c.slug, "entrees");
      expect(entrees, `sommaire absent de /comparatif/${c.slug}`).toBeDefined();
      const ancres = (entrees ?? []).map((e) => e.id);
      // Sections du contenu, plus les deux ancres posées par le gabarit.
      expect(ancres, `sommaire incomplet sur /comparatif/${c.slug}`).toEqual([
        ...c.sections.map((s) => s.id),
        "tableau",
        "faq",
      ]);

      const arbre = PageComparatif({ params: { slug: c.slug } });
      for (const a of ancres) {
        // « faq » est posée par le composant FAQ, non exécuté ici : elle est
        // couverte par la constante partagée ID_FAQ côté composant.
        if (a === "faq") continue;
        expect(section(arbre, a), `ancre morte #${a} sur /comparatif/${c.slug}`).not.toBeNull();
      }
    }
  });

  it("transmet le tableau et la FAQ du contenu aux composants qui les rendent", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      expect(textes(PageComparatif({ params: { slug: c.slug } })), `titre absent de ${c.slug}`)
        .toContain(c.titre);
      expect(prop(c.slug, "lignes"), `tableau absent de /comparatif/${c.slug}`).toEqual(
        c.tableau.lignes,
      );
      expect(prop(c.slug, "items"), `FAQ absente de /comparatif/${c.slug}`).toEqual(c.faq);
    }
  });

  it("renvoie vers les secteurs liés, via le moteur de maillage", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const liens = prop<{ href: string }[]>(c.slug, "liens") ?? [];
      const hrefsLiens = liens.map((l) => l.href);
      for (const secteur of c.secteursLies) {
        expect(hrefsLiens, `lien secteur manquant sur /comparatif/${c.slug}`).toContain(
          `/secteurs/${secteur}`,
        );
      }
    }
  });

  it("garde le fil d'Ariane et l'appel à l'action de chaque page", () => {
    for (const c of COMPARATIFS_PUBLIES) {
      const liens = hrefs(PageComparatif({ params: { slug: c.slug } }));
      expect(liens, `fil d'Ariane incomplet sur ${c.slug}`).toContain("/comparatif");
      expect(liens, `appel à l'action absent sur ${c.slug}`).toContain("/signup");
    }
  });
});

/**
 * La section « villes couvertes » a deux branches, et une seule est empruntée
 * par les données de la vague 1. Ce fichier couvre la branche non publiée ;
 * `pages-vague2.test.ts` couvre l'autre, sur des villes republiées par mock.
 * Sans ce couple, la branche publiée resterait du code mort jusqu'à la vague 2,
 * exactement le défaut relevé à la tâche 5.
 */
describe("section « villes couvertes » (vague 1, aucune ville publiée)", () => {
  it("nomme les villes du pays sans les rendre cliquables", () => {
    for (const p of paysPublies()) {
      const villes = section(PagePays({ params: { pays: p.slug } }), "villes");
      expect(villes, `section villes absente pour ${p.slug}`).not.toBeNull();

      expect(
        hrefs(villes),
        `lien vers une ville non publiée sur /chatbot-whatsapp/${p.slug}`,
      ).toEqual([]);

      const attendues = villesDuPays(p.slug);
      expect(attendues.length, `aucune ville rattachée à ${p.slug}`).toBeGreaterThan(0);
      const rendu = textes(villes);
      for (const v of attendues) {
        expect(rendu, `${v.nom} absente de /chatbot-whatsapp/${p.slug}`).toContain(v.nom);
      }
    }
  });
});
