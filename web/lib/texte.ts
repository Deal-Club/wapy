/**
 * Petites transformations de texte pour les pages publiques.
 *
 * Partagées plutôt que recopiées : `resume` produit les meta descriptions, la
 * chaîne que les moteurs affichent réellement sous le titre, et deux copies
 * divergentes donneraient deux troncatures différentes pour la même donnée.
 */

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
