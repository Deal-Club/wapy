import type { Source } from "./types";
import { SITE_URL } from "@/lib/site";

/**
 * Registre des sources citables.
 *
 * Les `id` sont des slugs opaques et stables : d'autres données y référent, on
 * ne les renomme pas. Le `label` et l'`url`, eux, doivent décrire exactement le
 * document réellement consulté.
 */
export const SOURCES: Record<string, Source> = {
  // --- Populations nationales ---------------------------------------------
  "insae-benin-rgph4": {
    id: "insae-benin-rgph4",
    // L'institut béninois s'appelle INStaD (Institut National de la Statistique
    // et de la Démographie) et non plus INSAE.
    label: "INStaD Bénin, RGPH4 (2013), statistiques démographiques",
    url: "https://instad.bj/statistiques/statistiques-demographiques",
    consulteLe: "2026-08-10",
  },
  "ansd-senegal-rgphae": {
    id: "ansd-senegal-rgphae",
    label: "ANSD Sénégal, principaux résultats du RGPH-5 (2023)",
    url: "https://www.ansd.sn/actualite/les-principaux-resultats-du-5e-recensement-general-de-la-population-et-de-lhabitat-du",
    consulteLe: "2026-08-10",
  },
  "ins-cotedivoire-rgph": {
    id: "ins-cotedivoire-rgph",
    label: "INS Côte d'Ivoire, RGPH 2021, résultats globaux définitifs",
    url: "https://data.gouv.ci/datasets/recensement-de-la-population-ivoirienne",
    consulteLe: "2026-08-10",
  },
  "bucrep-cameroun-rgph": {
    id: "bucrep-cameroun-rgph",
    label: "BUCREP Cameroun, Estimation de la population du Cameroun en 2023 (octobre 2024)",
    url: "https://bucrep.org/download/25879/",
    consulteLe: "2026-08-10",
  },
  "inseed-togo-rgph": {
    id: "inseed-togo-rgph",
    label: "INSEED Togo, résultats définitifs du RGPH-5 (novembre 2022)",
    url: "https://inseed.tg/resultats-definitifs-du-rgph-5-novembre-2022/",
    consulteLe: "2026-08-10",
  },

  // --- Populations urbaines (villes) --------------------------------------
  // Ces entrées pointent le document qui porte l'effectif PAR VILLE, distinct de
  // celui qui porte le total national : un tableau national ne prouve pas un
  // chiffre communal.
  "anstat-cotedivoire-rgph2021-localites": {
    id: "anstat-cotedivoire-rgph2021-localites",
    label:
      "ANStat Côte d'Ivoire, RGPH 2021, résultats globaux définitifs (octobre 2022), tableau 4 : effectifs des localités de plus de 100 000 habitants",
    url: "https://www.anstat.ci/assets/publications/files/File_val_indicateur1701358694.pdf",
    consulteLe: "2026-08-10",
  },
  "inseed-togo-rgph5-villes": {
    id: "inseed-togo-rgph5-villes",
    label:
      "INSEED Togo, RGPH-5 (2022), livret 01 « Distribution spatiale de la population résidente par sexe », tableau 49 : effectif de la population résidente des villes du Togo",
    url: "https://inseed.tg/download/6616/",
    consulteLe: "2026-08-10",
  },

  // --- Plans de numérotation nationaux ------------------------------------
  "arcep-benin-numerotation-2024": {
    id: "arcep-benin-numerotation-2024",
    label: "ARCEP Bénin, passage des numéros de 8 à 10 chiffres au 30 novembre 2024",
    url: "https://arcep.bj/a-partir-de-30-novembre-2024-les-numeros-de-telephone-au-benin-passent-de-08-a-10-chiffres/",
    consulteLe: "2026-08-10",
  },
  // Source réelle : la page d'Orange Côte d'Ivoire, qui rapporte la décision de
  // l'ARTCI. L'id nomme l'éditeur de la page, pas le régulateur.
  "orange-ci-numerotation-2021": {
    id: "orange-ci-numerotation-2021",
    label: "Orange Côte d'Ivoire, plan national de numérotation à 10 chiffres (rapporte la décision ARTCI du 31 janvier 2021)",
    url: "https://www.orange.ci/fr/plan-national-de-numerotation-a-10-chiffres.html",
    consulteLe: "2026-08-10",
  },
  "artp-senegal-numerotation-uit": {
    id: "artp-senegal-numerotation-uit",
    label: "UIT, plan de numérotage du Sénégal (+221), communication de l'ARTP du 3.X.2023",
    url: "https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000B80006PDFF.pdf",
    consulteLe: "2026-08-10",
  },
  "art-cameroun-numerotation-uit": {
    id: "art-cameroun-numerotation-uit",
    label: "UIT, plan de numérotage du Cameroun (+237), communication de l'ART du 6.X.2014",
    url: "https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000240001PDFF.pdf",
    consulteLe: "2026-08-10",
  },
  "arcep-togo-numerotation-uit": {
    id: "arcep-togo-numerotation-uit",
    label: "UIT, plan de numérotage du Togo (+228), communication de l'ARCEP du 11.I.2021",
    url: "https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000D10003PDFF.pdf",
    consulteLe: "2026-08-10",
  },

  // --- Mesures internes ----------------------------------------------------
  // Le code de Wapy n'est pas publié : il n'existe aucune URL de dépôt public
  // vers laquelle pointer, et fabriquer une adresse GitHub serait une source
  // fausse. On pointe donc la page qui portera la méthode de mesure, à charge
  // pour elle de publier la commande qui rejoue chaque chiffre.
  "wapy-plateforme": {
    id: "wapy-plateforme",
    label: "Wapy, mesures relevées sur la plateforme et méthode publiée sur la page À propos",
    url: `${SITE_URL}/a-propos`,
    consulteLe: "2026-08-11",
  },
};

export function sourceExiste(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SOURCES, id);
}
