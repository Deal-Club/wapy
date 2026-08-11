import type { Preuve } from "./types";

/**
 * Preuves techniques publiables.
 *
 * Chaque chiffre est un relevé refait le 2026-08-11 sur ce dépôt, jamais une
 * valeur reprise d'un document de planification. La commande qui rejoue la
 * mesure est notée au-dessus de la preuve : si elle ne donne plus le même
 * résultat, c'est la preuve qu'il faut corriger, pas la commande.
 *
 * Wapy n'a aucun client en production. Aucune preuve ne peut donc porter un
 * volume d'usage, un résultat obtenu ou une référence de clientèle : seules des
 * propriétés vérifiables du logiciel et du contenu sont publiables ici.
 */
export const PREUVES: Preuve[] = [
  {
    // Mesure : entrées de `SECTEURS` dans web/content/secteurs.ts, toutes
    // marquées `publie: true`. Relevé le 2026-08-11 : 11.
    id: "secteurs-couverts",
    libelle: "Secteurs ayant leur guide dédié",
    chiffre: { valeur: 11, annee: 2026, source: "wapy-plateforme", nature: "mesure" },
    texte:
      "Onze secteurs ont leur guide dédié sur ce site, de la restauration au garage automobile, chacun avec ses questions types et son vocabulaire propre. À l'inscription, le secteur se choisit dans une liste plus large et reste saisissable librement.",
  },
  {
    // Mesure : `python -m pytest tests/ -q` à la racine du dépôt.
    // Relevé le 2026-08-11 : 134 tests collectés, 134 réussis.
    id: "tests-backend",
    libelle: "Tests automatisés du backend",
    chiffre: { valeur: 134, annee: 2026, source: "wapy-plateforme", nature: "mesure" },
    texte:
      "Le backend est couvert par 134 tests automatisés, qui vérifient notamment la normalisation des numéros de téléphone, le choix de l'assistant entre répondre et passer la main à un humain, et l'enregistrement des demandes. La suite se rejoue en une commande.",
  },
  {
    // Pas de chiffre : la propriété décrite est qualitative. La décrire par un
    // nombre de formats gérés donnerait un faux air de mesure à une phrase qui
    // n'en est pas une.
    id: "formats-numeros",
    libelle: "Résolution des formats de numéros",
    texte:
      "Wapy demande à WhatsApp le véritable identifiant d'un numéro au lieu de le deviner. Les variantes plausibles d'une même ligne sont soumises, et seule celle qui existe vraiment est retenue. Cela règle le cas des numéros béninois passés de 8 à 10 chiffres et des indicatifs saisis de façons différentes.",
  },
];

export function getPreuve(id: string): Preuve | undefined {
  return PREUVES.find((p) => p.id === id);
}
