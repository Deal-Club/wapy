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

/**
 * Noms de pays terminés par un « e » qui restent masculins, et prennent donc
 * « au » et non « en ».
 *
 * La règle générale du français (nom de pays en « e » = féminin) couvre les cinq
 * pays de la vague 1, mais elle a des exceptions connues. Les lister est un
 * geste conscient ; deviner le genre d'un pays n'en est pas un. Ce garde-fou
 * sert la vague 2, où d'autres pays entreront dans le silo.
 */
const PAYS_MASCULINS_EN_E = new Set([
  "Belize",
  "Cambodge",
  "Mexique",
  "Mozambique",
  "Suriname",
  "Zimbabwe",
]);

/**
 * Préfixe un nom de pays de sa préposition de lieu.
 *
 * « Bénin » -> « au Bénin », « Côte d'Ivoire » -> « en Côte d'Ivoire ». Écrire
 * `au ${p.nom}` dans un gabarit produit « au Côte d'Ivoire » sur une page
 * entière, faute qu'aucun test de données ne peut rattraper puisque la donnée,
 * elle, est juste.
 */
export function auPays(nom: string): string {
  const feminin = nom.endsWith("e") && !PAYS_MASCULINS_EN_E.has(nom);
  return `${feminin ? "en" : "au"} ${nom}`;
}
