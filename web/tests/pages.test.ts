import { describe, it, expect } from "vitest";
import { generateStaticParams as paramsPays } from "@/app/chatbot-whatsapp/[pays]/page";
import { generateStaticParams as paramsSecteur } from "@/app/secteurs/[secteur]/page";
import { paysPublies } from "@/content/pays";
import { secteursPublies } from "@/content/secteurs";
import { VILLES } from "@/content/villes";

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
   * Vague 1 : les 25 villes sont toutes en `publie: false`. La section « villes
   * couvertes » des pages pays les affiche donc en texte simple, sans lien, et
   * ne devient cliquable qu'au passage à `true`. Si cette prémisse cesse d'être
   * vraie sans que les pages villes existent, la page pays produirait des liens
   * vers des routes absentes : ce test le signale avant le build.
   */
  it("ne publie aucune ville en vague 1", () => {
    expect(VILLES.filter((v) => v.publie).map((v) => v.slug)).toEqual([]);
  });
});
