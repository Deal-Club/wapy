import { SITE_URL } from "@/lib/site";
import type { QuestionReponse } from "@/content/types";

const CTX = "https://schema.org";
type Context = { "@context": typeof CTX };

/**
 * Types de retour précis pour chaque schéma JSON-LD produit. Une fonction qui
 * renverrait `Record<string, unknown>` obligerait les appelants (tests inclus)
 * à indexer un `unknown` pour lire un champ imbriqué, ce qui échoue en
 * TypeScript strict sans cast. Chaque schéma a donc sa propre forme.
 */

/**
 * Identifiant stable du nœud Organization, référencé depuis les autres
 * schémas (publisher, provider) pour consolider l'entité Wapy à travers le
 * site plutôt que de dupliquer une copie inline sur chaque page.
 */
export const ORGANIZATION_ID = `${SITE_URL}#organization`;

export type OrganizationLd = Context & {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo: string;
  description: string;
  areaServed: string[];
  sameAs: string[];
};

/**
 * Référence vers le nœud Organization consolidé (voir ORGANIZATION_ID),
 * augmentée des données minimales inline (@type, name, url). Le site
 * injecte les blocs JSON-LD indépendamment page par page, sans @graph
 * consolidé, et les validateurs évaluent une URL à la fois : un @id seul,
 * sans données inline, laisserait le nœud non résolu sur toute page qui
 * référence publisher/provider sans émettre aussi organizationLd() (ce
 * qui restait vrai avant ce correctif, voir ronde de correction 2, défaut
 * IMPORTANT 1). Le @id partagé permet la consolidation d'entité entre
 * pages ; les données inline gardent chaque page valide isolément.
 */
export type OrganizationRefLd = {
  "@id": string;
  "@type": "Organization";
  name: string;
  url: string;
};

/** Référence complète (@id + données inline) vers l'entité Organization. */
function organizationRef(): OrganizationRefLd {
  return { "@id": ORGANIZATION_ID, "@type": "Organization", name: "Wapy", url: SITE_URL };
}

export type WebSiteLd = Context & {
  "@type": "WebSite";
  name: string;
  url: string;
  inLanguage: string;
  publisher: OrganizationRefLd;
};

export type SoftwareApplicationLd = Context & {
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  inLanguage: string;
};

export type AreaServedLd = { "@type": "Country" | "City"; name: string };

export type ServiceLd = Context & {
  "@type": "Service";
  name: string;
  description: string;
  url: string;
  serviceType: string;
  provider: OrganizationRefLd;
  areaServed: AreaServedLd;
  /**
   * `Service` est un `Intangible`, pas un `CreativeWork` : `inLanguage` n'y
   * est pas défini par schema.org, `availableLanguage` est la propriété
   * correcte pour ce type.
   */
  availableLanguage: string;
};

export type QuestionLd = {
  "@type": "Question";
  name: string;
  acceptedAnswer: { "@type": "Answer"; text: string };
};

export type FaqLd = Context & {
  "@type": "FAQPage";
  mainEntity: QuestionLd[];
};

export type BreadcrumbItemLd = {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
};

export type BreadcrumbLd = Context & {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItemLd[];
};

export type ItemListEntryLd = {
  "@type": "ListItem";
  position: number;
  name: string;
  url: string;
};

export type ItemListLd = Context & {
  "@type": "ItemList";
  itemListElement: ItemListEntryLd[];
};

export type HowToStepLd = {
  "@type": "HowToStep";
  position: number;
  name: string;
  text: string;
};

export type HowToLd = Context & {
  "@type": "HowTo";
  name: string;
  inLanguage: string;
  step: HowToStepLd[];
};

export type ArticleLd = Context & {
  "@type": "Article";
  headline: string;
  description: string;
  mainEntityOfPage: string;
  datePublished: string;
  dateModified: string;
  author: { "@type": "Person"; name: string };
  publisher: OrganizationRefLd;
  articleSection?: string;
  inLanguage: string;
};

export type OfferEntryLd = {
  "@type": "Offer";
  name: string;
  price: number;
  priceCurrency: string;
};

export type OfferLd = Context & {
  "@type": "AggregateOffer";
  priceCurrency: string;
  lowPrice: number;
  highPrice: number;
  offerCount: number;
  offers: OfferEntryLd[];
};

export function organizationLd(): OrganizationLd {
  return {
    "@context": CTX,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Wapy",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "Wapy est un assistant WhatsApp pour les entreprises, conçu pour l'Afrique francophone. Il répond aux messages reçus sur WhatsApp à partir des informations fournies par l'entreprise.",
    areaServed: ["BJ", "CI", "SN", "CM", "TG"],
    sameAs: [],
  };
}

export function websiteLd(): WebSiteLd {
  return {
    "@context": CTX,
    "@type": "WebSite",
    name: "Wapy",
    url: SITE_URL,
    inLanguage: "fr",
    publisher: organizationRef(),
  };
}

export function softwareApplicationLd(): SoftwareApplicationLd {
  return {
    "@context": CTX,
    "@type": "SoftwareApplication",
    name: "Wapy",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    inLanguage: "fr",
  };
}

export function serviceLd(a: {
  nom: string;
  description: string;
  url: string;
  areaServed: { type: "Country" | "City"; nom: string };
}): ServiceLd {
  return {
    "@context": CTX,
    "@type": "Service",
    name: a.nom,
    description: a.description,
    url: a.url,
    serviceType: "Assistant WhatsApp automatisé",
    provider: organizationRef(),
    areaServed: { "@type": a.areaServed.type, name: a.areaServed.nom },
    availableLanguage: "fr",
  };
}

export function faqLd(faq: QuestionReponse[]): FaqLd {
  return {
    "@context": CTX,
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.r },
    })),
  };
}

export function breadcrumbLd(items: { nom: string; url: string }[]): BreadcrumbLd {
  return {
    "@context": CTX,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nom,
      item: it.url,
    })),
  };
}

export function itemListLd(items: { nom: string; url: string }[]): ItemListLd {
  return {
    "@context": CTX,
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nom,
      url: it.url,
    })),
  };
}

export function howToLd(a: { nom: string; etapes: { nom: string; texte: string }[] }): HowToLd {
  return {
    "@context": CTX,
    "@type": "HowTo",
    name: a.nom,
    inLanguage: "fr",
    step: a.etapes.map((e, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: e.nom,
      text: e.texte,
    })),
  };
}

export function articleLd(a: {
  titre: string;
  description: string;
  url: string;
  publieLe: string;
  modifieLe: string;
  auteur: string;
  section?: string;
}): ArticleLd {
  return {
    "@context": CTX,
    "@type": "Article",
    headline: a.titre,
    description: a.description,
    mainEntityOfPage: a.url,
    datePublished: a.publieLe,
    dateModified: a.modifieLe,
    author: { "@type": "Person", name: a.auteur },
    publisher: organizationRef(),
    ...(a.section ? { articleSection: a.section } : {}),
    inLanguage: "fr",
  };
}

export function offerLd(offres: { nom: string; prix: number; devise: string }[]): OfferLd {
  if (offres.length === 0) {
    // Math.min()/Math.max() sur un tableau vide renvoient ±Infinity, que
    // JSON.stringify transforme en null : un AggregateOffer avec des prix
    // null est syntaxiquement valide mais rejeté par le test des résultats
    // enrichis de Google. Échec explicite plutôt que JSON silencieusement
    // invalide.
    throw new Error("offerLd nécessite au moins une offre.");
  }
  const devises = new Set(offres.map((o) => o.devise));
  if (devises.size > 1) {
    // Le projet manipule XOF et XAF (content/types.ts) : des devises
    // mélangées produiraient un lowPrice/highPrice incohérent avec la seule
    // priceCurrency annoncée au niveau de l'AggregateOffer. Comportement
    // explicite : on refuse plutôt que de choisir silencieusement une devise.
    throw new Error(
      `offerLd nécessite une devise unique pour toutes les offres (reçues : ${[...devises].join(", ")}).`,
    );
  }
  return {
    "@context": CTX,
    "@type": "AggregateOffer",
    priceCurrency: offres[0].devise,
    lowPrice: Math.min(...offres.map((o) => o.prix)),
    highPrice: Math.max(...offres.map((o) => o.prix)),
    offerCount: offres.length,
    offers: offres.map((o) => ({
      "@type": "Offer",
      name: o.nom,
      price: o.prix,
      priceCurrency: o.devise,
    })),
  };
}

/** Union de tous les schémas produits par ce module, pour typer le composant JsonLd. */
export type JsonLdSchema =
  | OrganizationLd
  | WebSiteLd
  | SoftwareApplicationLd
  | ServiceLd
  | FaqLd
  | BreadcrumbLd
  | ItemListLd
  | HowToLd
  | ArticleLd
  | OfferLd;
