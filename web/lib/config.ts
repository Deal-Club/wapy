/**
 * Corps de la requête `PUT /api/config`.
 *
 * `GET /api/config` renvoie plus que ce que la page de configuration possède :
 * il y joint le numéro du responsable, les identifiants entrants du staff, le
 * modèle, le numéro WhatsApp lié et les compteurs d'usage. Renvoyer l'objet tel
 * quel fait donc écrire à cette page des champs qui ne lui appartiennent pas.
 *
 * Ce n'est pas théorique. Le numéro du responsable a été déplacé vers l'écran
 * « Connexion WhatsApp » (vérification par code), mais il continuait de
 * transiter dans le corps de la requête. Pour un établissement qui n'en a pas
 * encore — c'est-à-dire tout nouvel inscrit, puisque l'étape WhatsApp vient
 * après la configuration — la page envoyait une chaîne vide, que le garde-fou
 * du serveur rejette à juste titre : effacer ce numéro rendrait toute escalade
 * silencieuse. Résultat, la configuration devenait impossible à enregistrer.
 *
 * La règle est donc : cette page n'envoie que ce qu'elle édite.
 */

/** Champs présents dans la réponse GET mais édités ailleurs, ou en lecture seule. */
export const CHAMPS_NON_POSSEDES = [
  // Édités par leurs propres cartes, avec leur propre bouton d'enregistrement :
  // les renvoyer ici écraserait leur état avec une version périmée.
  "booking",
  "documents",
  // Édité à l'écran « Connexion WhatsApp », par vérification d'un code.
  "staff_numbers",
  "staff_inbound_ids",
  // Renvoyés par le serveur pour affichage, jamais modifiables ici.
  "wapy_model",
  "linked_number",
  "ai_remaining",
  "ai_limit",
] as const;

/** Ne garde que les champs que la page de configuration édite réellement. */
export function corpsConfig(config: Record<string, unknown>): Record<string, unknown> {
  const exclus = new Set<string>(CHAMPS_NON_POSSEDES);
  return Object.fromEntries(Object.entries(config ?? {}).filter(([cle]) => !exclus.has(cle)));
}
