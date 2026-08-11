import { SITE_URL } from "@/lib/site";
import type { QuestionReponse } from "@/content/types";

const CTX = "https://schema.org";
type Context = { "@context": typeof CTX };

/**
 * Types de retour precis pour chaque schema JSON-LD produit. Une fonction qui
 * renverrait `Record<string, unknown>` obligerait les appelants (tests inclus)
 * a indexer un `unknown` pour lire un champ imbrique, ce qui echoue en
 * TypeScript strict sans cast. Chaque schema a donc sa propre forme.
 */

export type OrganizationLd = Context & {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  areaServed: string[];
  sameAs: string[];
};

export type OrganizationRefLd = { "@type": "Organization"; name: string; url: string };

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
  inLanguage: string;
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
    name: "Wapy",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "Wapy est un assistant WhatsApp pour les entreprises, concu pour l'Afrique francophone. Il repond aux messages recus sur WhatsApp a partir des informations fournies par l'entreprise.",
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
    publisher: { "@type": "Organization", name: "Wapy", url: SITE_URL },
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
    serviceType: "Assistant WhatsApp automatise",
    provider: { "@type": "Organization", name: "Wapy", url: SITE_URL },
    areaServed: { "@type": a.areaServed.type, name: a.areaServed.nom },
    inLanguage: "fr",
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
    publisher: { "@type": "Organization", name: "Wapy", url: SITE_URL },
    ...(a.section ? { articleSection: a.section } : {}),
    inLanguage: "fr",
  };
}

export function offerLd(offres: { nom: string; prix: number; devise: string }[]): OfferLd {
  return {
    "@context": CTX,
    "@type": "AggregateOffer",
    priceCurrency: offres[0]?.devise ?? "XOF",
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

/** Union de tous les schemas produits par ce module, pour typer le composant JsonLd. */
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
