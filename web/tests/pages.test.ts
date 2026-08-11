import { describe, it, expect } from "vitest";
import PagePays, {
  generateStaticParams as paramsPays,
} from "@/app/chatbot-whatsapp/[pays]/page";
import { generateStaticParams as paramsSecteur } from "@/app/secteurs/[secteur]/page";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { VILLES, villesDuPays } from "@/content/villes";
import { hrefs, section, textes } from "./arbre-react";

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
