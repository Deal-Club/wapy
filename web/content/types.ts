/** Une source citable. Tout chiffre publié doit pointer vers l'une d'elles. */
export type Source = {
  id: string;
  label: string;
  url: string;
  /** Date de consultation, ISO court : "2026-08-10". */
  consulteLe: string;
};

/**
 * Comment un chiffre a été produit.
 *
 * - `recensement` : dénombrement exhaustif conduit par un tiers (RGPH...).
 * - `estimation` : projection ou modélisation, avec sa marge d'incertitude.
 * - `mesure` : relevé direct et reproductible sur un artefact logiciel (nombre
 *   d'entrées d'un fichier de contenu, nombre de tests collectés par la suite).
 *   Ni un recensement de population ni une estimation : la valeur se rejoue en
 *   lançant une commande, et c'est cette commande qui fait foi.
 */
export const NATURES_CHIFFRE = ["recensement", "estimation", "mesure"] as const;

export type NatureChiffre = (typeof NATURES_CHIFFRE)[number];

/** Une valeur numérique publiable. La source est obligatoire (garde-fou G1). */
export type Chiffre = {
  valeur: number;
  annee: number;
  /** id d'une entrée de SOURCES. */
  source: string;
  /**
   * Comment le chiffre a été produit. Obligatoire : un dénombrement exhaustif,
   * une estimation modélisée et une mesure logicielle ne se citent pas de la
   * même façon, et l'omission silencieuse de cette distinction est précisément
   * ce qu'on veut empêcher.
   */
  nature: NatureChiffre;
};

export type QuestionReponse = {
  q: string;
  /**
   * Réponse courte, orientée AEO. Règle appliquée par les tests : 60 mots
   * maximum, sans exception. Cible rédactionnelle indicative : 40 à 60 mots,
   * non imposée par un test.
   */
  r: string;
};

export type Pays = {
  slug: string;
  nom: string;
  gentile: string;
  indicatif: string;
  monnaie: "XOF" | "XAF";
  capitale: string;
  capitaleEconomique?: string;
  mobileMoney: string[];
  operateurs: string[];
  particularites: string[];
  population?: Chiffre;
  /** Réponse directe, moins de 50 mots. */
  enBref: string;
  /** Paragraphe unique rédigé à la main, 150 caractères minimum (G3). */
  angle: string;
  faq: QuestionReponse[];
  secteursPhares: string[];
  publie: boolean;
};

export type Ville = {
  slug: string;
  nom: string;
  /** slug du pays. */
  pays: string;
  region: string;
  population?: Chiffre;
  quartiersAffaires: string[];
  secteursDominants: string[];
  tier: 1 | 2 | 3;
  enBref: string;
  angle: string;
  faq: QuestionReponse[];
  publie: boolean;
};

export type Secteur = {
  slug: string;
  nom: string;
  nomPluriel: string;
  /** Étiquette d'affichage, reprise des tags du blog. */
  tag: string;
  /** Ancien slug d'article de blog, pour la redirection 301. */
  ancienSlugBlog: string | null;
  motCle: string;
  enBref: string;
  angle: string;
  douleurs: string[];
  faq: QuestionReponse[];
  publie: boolean;
};

export type Preuve = {
  id: string;
  libelle: string;
  chiffre?: Chiffre;
  /** Formulation publiable de la preuve. */
  texte: string;
};
