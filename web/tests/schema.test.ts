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
} from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";

describe("organizationLd", () => {
  it("decrit Wapy factuellement, sans revendication de clientele ni superlatif", () => {
    const ld = organizationLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Organization");
    expect(ld.name).toBe("Wapy");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.logo).toBe(`${SITE_URL}/icons/icon-512.png`);
    expect(Array.isArray(ld.sameAs)).toBe(true);
    expect(ld.sameAs).toHaveLength(0);
    expect(ld.areaServed).toEqual(["BJ", "CI", "SN", "CM", "TG"]);

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
    // Aucun tiret long dans les chaines produites.
    expect(ld.description).not.toContain("\u2014");
    expect(ld.description).not.toContain("\u2013");
  });
});

describe("websiteLd", () => {
  it("produit un WebSite en francais avec un publisher Organization", () => {
    const ld = websiteLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.name).toBe("Wapy");
    expect(ld.url).toBe(SITE_URL);
    expect(ld.inLanguage).toBe("fr");
    expect(ld.publisher).toEqual({ "@type": "Organization", name: "Wapy", url: SITE_URL });
  });
});

describe("softwareApplicationLd", () => {
  it("produit un SoftwareApplication web en francais", () => {
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
  it("produit un Service avec areaServed Country et un provider Organization", () => {
    const ld = serviceLd({
      nom: "Chatbot WhatsApp Benin",
      description: "Assistant WhatsApp pour les entreprises beninoises.",
      url: `${SITE_URL}/chatbot-whatsapp/benin`,
      areaServed: { type: "Country", nom: "Benin" },
    });
    expect(ld["@type"]).toBe("Service");
    expect(ld.name).toBe("Chatbot WhatsApp Benin");
    expect(ld.url).toBe(`${SITE_URL}/chatbot-whatsapp/benin`);
    expect(ld.provider).toEqual({ "@type": "Organization", name: "Wapy", url: SITE_URL });
    expect(ld.areaServed).toEqual({ "@type": "Country", name: "Benin" });
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
  it("produit une Question et une Answer par entree, dans l'ordre fourni", () => {
    const ld = faqLd([
      { q: "Question un ?", r: "Reponse un." },
      { q: "Question deux ?", r: "Reponse deux." },
    ]);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Question un ?",
      acceptedAnswer: { "@type": "Answer", text: "Reponse un." },
    });
    expect(ld.mainEntity[1].name).toBe("Question deux ?");
    expect(ld.mainEntity[1].acceptedAnswer.text).toBe("Reponse deux.");
  });
});

describe("breadcrumbLd", () => {
  it("numerote les elements a partir de 1, dans l'ordre fourni", () => {
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
  it("numerote les entrees et conserve les url fournies", () => {
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
  it("numerote les etapes a partir de 1, dans l'ordre fourni", () => {
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
    expect(sansSection.publisher).toEqual({ "@type": "Organization", name: "Wapy", url: SITE_URL });
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
  it("calcule lowPrice, highPrice et offerCount a partir de la liste d'offres", () => {
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
});

describe("composant JsonLd", () => {
  it("echappe les < pour empecher une chaine de donnees de fermer la balise script", () => {
    const donneesPiegees = faqLd([
      { q: "Question piegee", r: "Reponse </script><script>alert(1)</script> injectee." },
    ]);
    const html = renderToStaticMarkup(createElement(JsonLd, { data: donneesPiegees }));

    expect(html).not.toContain("</script><script>alert(1)</script>");
    // Seul "<" est echappe (le regex du brief est /</g) : ">" reste litteral.
    expect(html).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
  });

  it("rend un script application/ld+json contenant le JSON serialise des donnees", () => {
    const html = renderToStaticMarkup(createElement(JsonLd, { data: websiteLd() }));

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain(`"url":"${SITE_URL}"`);
  });
});
