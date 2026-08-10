/** Une source citable. Tout chiffre publié doit pointer vers l'une d'elles. */
export type Source = {
  id: string;
  label: string;
  url: string;
  /** Date de consultation, ISO court : "2026-08-10". */
  consulteLe: string;
};

/** Une valeur numérique publiable. La source est obligatoire (garde-fou G1). */
export type Chiffre = {
  valeur: number;
  annee: number;
  /** id d'une entrée de SOURCES. */
  source: string;
};

export type QuestionReponse = {
  q: string;
  /** Réponse de 40 à 60 mots (contrainte AEO). */
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
