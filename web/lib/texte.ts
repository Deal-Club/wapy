/**
 * Petites transformations de texte pour les pages publiques.
 *
 * Partagées plutôt que recopiées : `resume` produit les meta descriptions, la
 * chaîne que les moteurs affichent réellement sous le titre, et deux copies
 * divergentes donneraient deux troncatures différentes pour la même donnée.
 */

import type { Pays } from "@/content/types";

/**
 * Tronque à `max` caractères sans couper un mot.
 *
 * Un `slice(0, 155)` brut coupe au milieu d'un mot une fois sur deux. On
 * recule jusqu'au dernier espace, on retire la ponctuation laissée en fin de
 * chaîne, et on marque la coupure par des points de suspension.
 */
export function resume(texte: string, max = 155): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max);
  const espace = coupe.lastIndexOf(" ");
  const garde = espace > 0 ? coupe.slice(0, espace) : coupe;
  return `${garde.replace(/[\s,;:.]+$/, "")}…`;
}

/** « chatbot WhatsApp restaurant » -> « Chatbot WhatsApp restaurant ». */
export function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * Préfixe un nom de pays de sa préposition de lieu.
 *
 * « Bénin » -> « au Bénin », « Côte d'Ivoire » -> « en Côte d'Ivoire ».
 *
 * Écrire `au ${p.nom}` dans un gabarit produit « au Côte d'Ivoire » sur une page
 * entière, faute qu'aucun test de données ne peut rattraper puisque la donnée,
 * elle, est juste. La préposition est donc LUE dans `Pays.preposition`, jamais
 * déduite du nom : une première version de cette fonction devinait le genre à
 * la terminaison du nom, ce qui marchait pour les cinq pays de la vague 1 et
 * se serait trompé sur Djibouti, Madagascar, Maurice, les Comores ou la RDC.
 * Le choix appartient à la donnée, où le typage le rend obligatoire.
 */
export function auPays(pays: Pick<Pays, "nom" | "preposition">): string {
  return `${pays.preposition} ${pays.nom}`;
}
