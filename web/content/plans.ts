import type { Colonne, Ligne } from "@/components/seo/TableauComparatif";

/**
 * Les trois plans de Wapy et les options qui s'y ajoutent.
 *
 * Tout ce fichier est repris de `saas/billing.py` : les clés (`slug`), les
 * libellés (`nom`), la composition de chaque plan (`FEATURES` et `PLANS`,
 * lignes 20 à 50) et les options (`ADDONS`, lignes 53 à 64). Rien n'y est
 * déduit d'un document de planification.
 *
 * AUCUN MONTANT N'EST PUBLIÉ, ET C'EST DÉLIBÉRÉ.
 * `prix` est absent de chaque entrée. Les prix de `saas/billing.py:33` portent
 * la mention « à ajuster librement », la grille est en cours de révision, et
 * publier un montant reviendrait à s'engager commercialement sur une valeur
 * destinée à changer. Le champ existe malgré tout, optionnel : le jour où la
 * grille est arrêtée, renseigner `prix` ici, dans ce seul fichier, suffit à
 * faire apparaître les montants sur `/tarifs` (via `montantAffiche` et
 * `lignesTarifs`) et à faire émettre l'AggregateOffer de la page (via
 * `offresPubliables`). Aucun gabarit n'est à toucher. Les deux branches,
 * prix absent et prix renseigné, sont couvertes par `tests/entite.test.ts`.
 *
 * AUCUN QUOTA DE CONVERSATIONS N'EST PUBLIÉ NON PLUS.
 * `saas/billing.py:38,43` déclare 500 et 2 500 conversations par mois et
 * `billing.py:61` vend un add-on « +1 000 conversations », mais aucun code ne
 * les applique : `entitlements_for` recopie la limite, personne ne la lit. Les
 * seules limites réellement contrôlées sont `agents` (`saas/app.py:285-289`) et
 * `documents` (`saas/app.py:696-698`) : ce sont les seules décrites ici.
 */

export type Devise = "XOF";

export type Plan = {
  /** Clé du plan côté plateforme (`saas/billing.py:34-50`). */
  slug: string;
  /** Libellé publié par la plateforme (champ `label`). */
  nom: string;
  /** Ce à quoi le plan répond, en une phrase. */
  resume: string;
  /**
   * Montant mensuel. Absent tant que la grille tarifaire n'est pas arrêtée :
   * voir l'en-tête de ce fichier. Renseigner ce champ suffit à publier le prix.
   */
  prix?: number;
  devise: Devise;
  periode: "mois";
  /** Fonctions incluses, reprises de `FEATURES` pour ce plan. */
  inclus: string[];
  /** Limites réellement appliquées par le code, et elles seules. */
  limites: string[];
};

/** Une option facturée en plus du plan (`ADDONS` de `saas/billing.py`). */
export type Option = {
  slug: string;
  nom: string;
  /** Même règle que pour un plan : absent tant qu'aucun montant n'est arrêté. */
  prix?: number;
  devise: Devise;
  periode: "mois";
};

/** Durée de l'essai gratuit, en jours (`saas/billing.py:14`, TRIAL_DAYS). */
export const JOURS_ESSAI = 7;

export const PLANS: Plan[] = [
  {
    slug: "essentiel",
    nom: "Starter",
    resume: "Répondre aux messages et enregistrer les demandes, sans rien de plus.",
    devise: "XOF",
    periode: "mois",
    inclus: [
      "Assistant WhatsApp sur le numéro que vous utilisez déjà",
      "Réponses tirées de la fiche que vous remplissez",
      "Carnet des réservations, commandes et paiements",
      "Passage de main au responsable quand un humain est nécessaire",
      "Base de connaissances alimentée par vos documents",
    ],
    limites: ["Un compte collaborateur en plus du vôtre", "Trois documents dans la base de connaissances"],
  },
  {
    slug: "pro",
    nom: "Pro",
    resume: "Le plan complet : rendez-vous, chat du site web, vocaux et justificatifs.",
    devise: "XOF",
    periode: "mois",
    inclus: [
      "Tout ce que contient le plan Starter",
      "Prise de rendez-vous sur vos créneaux",
      "Chat pour votre site web, alimenté par la même fiche",
      "Lecture des justificatifs de paiement envoyés en image",
      "Transcription des notes vocales",
      "Suggestions d'amélioration de votre fiche",
      "Support prioritaire",
    ],
    limites: ["Trois comptes collaborateurs en plus du vôtre", "Dix documents dans la base de connaissances"],
  },
  {
    slug: "business",
    nom: "Business",
    resume: "Pour une entreprise qui veut brancher son propre stock et ouvrir les accès.",
    devise: "XOF",
    periode: "mois",
    inclus: [
      "Tout ce que contient le plan Pro",
      "Connexion à la base de votre entreprise pour les stocks et les produits",
      "Le modèle d'intelligence artificielle le plus avancé des trois plans",
    ],
    limites: ["Comptes collaborateurs sans limite", "Documents sans limite"],
  },
];

/**
 * Options activables en plus d'un plan.
 *
 * L'add-on « +1 000 conversations » de `saas/billing.py:61` est volontairement
 * absent : il augmente une limite qu'aucun code n'applique, le vendre serait
 * facturer une contrainte inexistante.
 */
export const OPTIONS: Option[] = [
  { slug: "booking", nom: "Prise de rendez-vous", devise: "XOF", periode: "mois" },
  { slug: "webchat", nom: "Chat pour site web", devise: "XOF", periode: "mois" },
  { slug: "vision", nom: "Lecture des justificatifs de paiement", devise: "XOF", periode: "mois" },
  { slug: "voice", nom: "Transcription des notes vocales", devise: "XOF", periode: "mois" },
  { slug: "suggestions", nom: "Suggestions d'amélioration de la fiche", devise: "XOF", periode: "mois" },
  { slug: "data_connector", nom: "Connexion à la base de l'entreprise", devise: "XOF", periode: "mois" },
  { slug: "priority_support", nom: "Support prioritaire", devise: "XOF", periode: "mois" },
  { slug: "agents_3", nom: "Trois comptes collaborateurs de plus", devise: "XOF", periode: "mois" },
  { slug: "documents_10", nom: "Dix documents de plus", devise: "XOF", periode: "mois" },
];

/** Nom d'usage de la devise en Afrique de l'Ouest. `XOF` est le code ISO. */
const DEVISE_AFFICHEE: Record<Devise, string> = { XOF: "FCFA" };

/**
 * Montant d'un plan ou d'une option, prêt à afficher, ou `null` tant qu'aucun
 * prix n'est renseigné. Aucun gabarit ne lit `prix` directement : c'est ici que
 * se décide si un montant paraît, donc ici seulement qu'il faudrait se tromper.
 */
export function montantAffiche(o: {
  prix?: number;
  devise: Devise;
  periode: "mois";
}): string | null {
  if (o.prix === undefined) return null;
  return `${o.prix.toLocaleString("fr-FR")} ${DEVISE_AFFICHEE[o.devise]} par ${o.periode}`;
}

/**
 * Ce qui remplace le montant tant que la grille n'est pas arrêtée. Une mention
 * explicite plutôt qu'une case vide : un tableau tarifaire à colonne vide se
 * lit comme un oubli, et le lecteur cherche le prix ailleurs.
 */
export const TARIF_NON_PUBLIE = "Non publié à ce jour";

export const COLONNES_TARIFS: Colonne[] = [
  { cle: "plan", libelle: "Plan" },
  { cle: "inclus", libelle: "Ce que le plan contient" },
  { cle: "limites", libelle: "Limites appliquées" },
  { cle: "tarif", libelle: "Tarif mensuel" },
];

/** Lignes du tableau de `/tarifs`. Le montant n'y paraît que s'il existe. */
export function lignesTarifs(plans: Plan[]): Ligne[] {
  return plans.map((p) => ({
    plan: p.nom,
    inclus: p.inclus.join(". "),
    limites: p.limites.join(". "),
    tarif: montantAffiche(p) ?? TARIF_NON_PUBLIE,
  }));
}

/**
 * Offres au format attendu par `offerLd`, restreintes à celles qui portent un
 * montant. Le tableau est vide aujourd'hui, et `offerLd` lève sur un tableau
 * vide : la page teste donc la longueur avant d'émettre le balisage, plutôt
 * que d'annoncer une AggregateOffer sans prix.
 */
export function offresPubliables(plans: Plan[]): { nom: string; prix: number; devise: string }[] {
  return plans.flatMap((p) =>
    p.prix === undefined ? [] : [{ nom: p.nom, prix: p.prix, devise: p.devise }],
  );
}
