import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  organizationLd,
  websiteLd,
  softwareApplicationLd,
  serviceLd,
  faqLd,
  breadcrumbLd,
  itemListLd,
  howToLd,
  articleLd,
  offerLd,
  ORGANIZATION_ID,
} from "@/lib/schema";
import type { OrganizationRefLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
import type { JsonLdData } from "@/components/seo/JsonLd";

describe("organizationLd", () => {
  it("décrit Wapy factuellement, sans revendication de clientèle ni superlatif", () => {
    const ld = organizationLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Organization");
    expect(ld.name).toBe("Wapy");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.logo).toBe(`${SITE_URL}/icons/icon-512.png`);
    expect(Array.isArray(ld.sameAs)).toBe(true);
    expect(ld.sameAs).toHaveLength(0);
    expect(ld.areaServed).toEqual(["BJ", "CI", "SN", "CM", "TG"]);
    expect(ORGANIZATION_ID).toBe(`${SITE_URL}#organization`);
    expect(ld["@id"]).toBe(ORGANIZATION_ID);

    const descriptionEnMinuscule = ld.description.toLowerCase();
    const motsInterdits = [
      "leader",
      "meilleur",
      "numero 1",
      "n°1",
      "clients satisfaits",
      "des milliers",
      "des centaines",
      "premier",
    ];
    for (const mot of motsInterdits) {
      expect(descriptionEnMinuscule).not.toContain(mot);
    }
    // Aucun tiret long dans les chaînes produites.
    expect(ld.description).not.toContain("—");
    expect(ld.description).not.toContain("–");
    // Régression : le texte français doit rester accentué (ronde de
    // correction 1, défaut IMPORTANT 2 : le texte était entièrement
    // désaccentué alors qu'il part dans le JSON-LD lu par Google/LLM).
    expect(ld.description).toMatch(/[éèàçôîïâêûü]/i);
  });
});

describe("websiteLd", () => {
  it("produit un WebSite en français avec un publisher Organization référencé et résolu", () => {
    const ld = websiteLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.name).toBe("Wapy");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.inLanguage).toBe("fr");
    // Ronde de correction 2, défaut IMPORTANT 1 : le publisher doit porter
    // à la fois le @id (consolidation d'entité entre pages) et les données
    // inline (@type, name, url), sinon une page qui n'émet pas aussi
    // organizationLd() laisserait ce nœud non résolu pour les validateurs,
    // qui évaluent une URL à la fois sans @graph consolidé.
    expect(ld.publisher).toEqual({
      "@id": ORGANIZATION_ID,
      "@type": "Organization",
      name: "Wapy",
      url: SITE_URL,
    });
  });
});

describe("softwareApplicationLd", () => {
  it("produit un SoftwareApplication web en français", () => {
    const ld = softwareApplicationLd();
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("Wapy");
    expect(ld.applicationCategory).toBe("BusinessApplication");
    expect(ld.operatingSystem).toBe("Web");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.inLanguage).toBe("fr");
  });
});

describe("serviceLd", () => {
  it("produit un Service avec areaServed Country, un provider référencé et résolu, et availableLanguage", () => {
    const ld = serviceLd({
      nom: "Chatbot WhatsApp Benin",
      description: "Assistant WhatsApp pour les entreprises béninoises.",
      url: `${SITE_URL}/chatbot-whatsapp/benin`,
      areaServed: { type: "Country", nom: "Benin" },
    });
    expect(ld["@type"]).toBe("Service");
    expect(ld.name).toBe("Chatbot WhatsApp Benin");
    expect(ld.url).toBe(`${SITE_URL}/chatbot-whatsapp/benin`);
    expect(ld.provider).toEqual({
      "@id": ORGANIZATION_ID,
      "@type": "Organization",
      name: "Wapy",
      url: SITE_URL,
    });
    expect(ld.areaServed).toEqual({ "@type": "Country", name: "Benin" });
    expect(ld.availableLanguage).toBe("fr");
    // "Service" est un Intangible : "inLanguage" n'existe pas sur ce type
    // (ronde de correction 1, défaut IMPORTANT 3).
    expect("inLanguage" in ld).toBe(false);
  });

  it("produit un Service avec areaServed City", () => {
    const ld = serviceLd({
      nom: "Chatbot WhatsApp Cotonou",
      description: "Assistant WhatsApp pour les entreprises de Cotonou.",
      url: `${SITE_URL}/chatbot-whatsapp/benin/cotonou`,
      areaServed: { type: "City", nom: "Cotonou" },
    });
    expect(ld.areaServed).toEqual({ "@type": "City", name: "Cotonou" });
  });
});

describe("faqLd", () => {
  it("produit une Question et une Answer par entrée, dans l'ordre fourni", () => {
    const ld = faqLd([
      { q: "Question un ?", r: "Réponse un." },
      { q: "Question deux ?", r: "Réponse deux." },
    ]);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Question un ?",
      acceptedAnswer: { "@type": "Answer", text: "Réponse un." },
    });
    expect(ld.mainEntity[1].name).toBe("Question deux ?");
    expect(ld.mainEntity[1].acceptedAnswer.text).toBe("Réponse deux.");
  });
});

describe("breadcrumbLd", () => {
  it("numérote les éléments à partir de 1, dans l'ordre fourni", () => {
    const ld = breadcrumbLd([
      { nom: "Accueil", url: SITE_URL },
      { nom: "Benin", url: `${SITE_URL}/chatbot-whatsapp/benin` },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Benin",
        item: `${SITE_URL}/chatbot-whatsapp/benin`,
      },
    ]);
  });
});

describe("itemListLd", () => {
  it("numérote les entrées et conserve les url fournies", () => {
    const ld = itemListLd([
      { nom: "Wapy", url: SITE_URL },
      { nom: "Autre outil", url: "https://exemple.test" },
    ]);
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Wapy", url: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Autre outil", url: "https://exemple.test" },
    ]);
  });
});

describe("howToLd", () => {
  it("numérote les étapes à partir de 1, dans l'ordre fourni", () => {
    const ld = howToLd({
      nom: "Configurer Wapy",
      etapes: [
        { nom: "Connecter WhatsApp", texte: "Scanner le QR code depuis WhatsApp Web." },
        { nom: "Renseigner les informations", texte: "Ajouter les informations de l'entreprise." },
      ],
    });
    expect(ld["@type"]).toBe("HowTo");
    expect(ld.name).toBe("Configurer Wapy");
    expect(ld.step).toHaveLength(2);
    expect(ld.step[0]).toEqual({
      "@type": "HowToStep",
      position: 1,
      name: "Connecter WhatsApp",
      text: "Scanner le QR code depuis WhatsApp Web.",
    });
    expect(ld.step[1].position).toBe(2);
  });
});

describe("articleLd", () => {
  it("n'inclut articleSection que si elle est fournie", () => {
    const sansSection = articleLd({
      titre: "Titre de l'article",
      description: "Description de l'article.",
      url: `${SITE_URL}/blog/article`,
      publieLe: "2026-01-01",
      modifieLe: "2026-02-01",
      auteur: "Wapy",
    });
    expect(sansSection["@type"]).toBe("Article");
    expect(sansSection.mainEntityOfPage).toBe(`${SITE_URL}/blog/article`);
    expect(sansSection.author).toEqual({ "@type": "Person", name: "Wapy" });
    expect(sansSection.publisher).toEqual({
      "@id": ORGANIZATION_ID,
      "@type": "Organization",
      name: "Wapy",
      url: SITE_URL,
    });
    expect("articleSection" in sansSection).toBe(false);

    const avecSection = articleLd({
      titre: "Titre de l'article",
      description: "Description de l'article.",
      url: `${SITE_URL}/blog/article`,
      publieLe: "2026-01-01",
      modifieLe: "2026-02-01",
      auteur: "Wapy",
      section: "Restaurant",
    });
    expect(avecSection.articleSection).toBe("Restaurant");
  });
});

describe("offerLd", () => {
  it("calcule lowPrice, highPrice et offerCount à partir de la liste d'offres", () => {
    const ld = offerLd([
      { nom: "Starter", prix: 15000, devise: "XOF" },
      { nom: "Pro", prix: 35000, devise: "XOF" },
    ]);
    expect(ld["@type"]).toBe("AggregateOffer");
    expect(ld.priceCurrency).toBe("XOF");
    expect(ld.lowPrice).toBe(15000);
    expect(ld.highPrice).toBe(35000);
    expect(ld.offerCount).toBe(2);
    expect(ld.offers).toEqual([
      { "@type": "Offer", name: "Starter", price: 15000, priceCurrency: "XOF" },
      { "@type": "Offer", name: "Pro", price: 35000, priceCurrency: "XOF" },
    ]);
  });

  it("lève une erreur explicite plutôt que de produire des prix null pour une liste vide", () => {
    // Math.min()/Math.max() sur [] renvoient +/-Infinity, que JSON.stringify
    // transforme en null : JSON syntaxiquement valide mais rejeté par le
    // test des résultats enrichis de Google (ronde de correction 1, défaut
    // IMPORTANT 1).
    expect(() => offerLd([])).toThrow(/au moins une offre/i);
  });

  it("lève une erreur explicite si les offres mélangent des devises différentes", () => {
    // Le projet manipule XOF et XAF (content/types.ts) : sans ce garde-fou,
    // priceCurrency prendrait silencieusement la devise de la seule
    // première offre, incohérente avec lowPrice/highPrice calculés sur des
    // devises mélangées (ronde de correction 1, défaut voisin de IMPORTANT 1).
    expect(() =>
      offerLd([
        { nom: "Starter", prix: 15000, devise: "XOF" },
        { nom: "Pro", prix: 35000, devise: "XAF" },
      ]),
    ).toThrow(/devise/i);
  });
});

describe("cohérence de l'entité Organization consolidée", () => {
  it("le même @id et les mêmes données inline relient organizationLd, websiteLd.publisher, serviceLd.provider et articleLd.publisher", () => {
    // Ronde de correction 2, défaut IMPORTANT 1 : dérivé des champs réels
    // de organizationLd() (pas une valeur recopiée en dur), pour que ce
    // test échoue si l'entité consolidée divergeait entre les fonctions
    // productrices.
    const org = organizationLd();
    const referenceAttendue: OrganizationRefLd = {
      "@id": org["@id"],
      "@type": "Organization",
      name: org.name,
      url: org.url,
    };

    expect(websiteLd().publisher).toEqual(referenceAttendue);

    const service = serviceLd({
      nom: "Service test",
      description: "Description de test.",
      url: `${SITE_URL}/test`,
      areaServed: { type: "Country", nom: "Benin" },
    });
    expect(service.provider).toEqual(referenceAttendue);

    const article = articleLd({
      titre: "Titre",
      description: "Description.",
      url: `${SITE_URL}/blog/article`,
      publieLe: "2026-01-01",
      modifieLe: "2026-02-01",
      auteur: "Wapy",
    });
    expect(article.publisher).toEqual(referenceAttendue);
  });
});

describe("composant JsonLd", () => {
  it("échappe les < pour empêcher une chaîne de données de fermer la balise script", () => {
    const donneesPiegees = faqLd([
      { q: "Question piégée", r: "Réponse </script><script>alert(1)</script> injectée." },
    ]);
    const html = renderToStaticMarkup(createElement(JsonLd, { data: donneesPiegees }));

    expect(html).not.toContain("</script><script>alert(1)</script>");
    // Seul "<" est échappé (le regex du brief est /</g) : ">" reste littéral.
    expect(html).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
  });

  it("rend un script application/ld+json contenant le JSON sérialisé des données", () => {
    const html = renderToStaticMarkup(createElement(JsonLd, { data: websiteLd() }));

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain(`"url":"${SITE_URL}"`);
  });

  it("accepte à l'exécution un objet JSON-LD ad hoc non défini dans schema.ts (prop élargi, défaut 4)", () => {
    // Ronde de correction 1, point 4 : le prop "data" ne doit plus être
    // limité à l'union fermée des 10 schémas de schema.ts, pour qu'une
    // tâche future (LocalBusiness, Person, Review, @graph...) n'ait pas à
    // modifier ce composant. Ce test vérifie le comportement à l'exécution.
    // Avant la ronde de correction 2 (tests/ exclu du typecheck), c'était
    // une vérification uniquement à l'exécution : les types sont effacés à
    // l'exécution, donc ce test seul passait deja avec l'ancienne union
    // fermée sans rien démontrer côté typage. Depuis que tests/ est
    // typechecké (point 2 du rapport), le literal ci-dessous est lui-même
    // vérifié par le compilateur (confirmé en réintroduisant temporairement
    // l'ancienne union : ce fichier ne compile plus). L'assertion de type
    // dédiée ci-dessous (_verifElargissementJsonLdData) rend cette garantie
    // explicite, sans dépendre de l'inférence de type d'un literal non
    // annoté.
    const donneesLocalBusiness = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Exemple non défini dans schema.ts",
    };
    const html = renderToStaticMarkup(createElement(JsonLd, { data: donneesLocalBusiness }));

    expect(html).toContain('"@type":"LocalBusiness"');
    expect(html).toContain('"name":"Exemple non défini dans schema.ts"');
  });
});

/**
 * Assertion de type, pas d'assertion Vitest : démontre que JsonLdData
 * accepte un schéma qui n'existe pas dans l'union fermée JsonLdSchema de
 * schema.ts (LocalBusiness n'a pas de fonction productrice ici). Avec
 * l'ancien type `data: JsonLdSchema`, cette ligne échouerait à la
 * compilation (LocalBusiness n'étant assignable à aucune des 10 branches de
 * l'union). Ce test ne peut exister utilement que parce que tests/ est
 * désormais couvert par le typecheck du projet (ronde de correction 2,
 * point 2) : avant ce changement, une régression sur ce point serait passée
 * inaperçue par `npm test` (Vitest transpile sans vérifier les types) et par
 * `npm run build` (qui ne typecheckait pas tests/).
 */
const _verifElargissementJsonLdData: JsonLdData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Vérification de type uniquement, jamais utilisée à l'exécution",
};
void _verifElargissementJsonLdData;
