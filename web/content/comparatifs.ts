export type Comparatif = {
  slug: string;
  titre: string;
  /** Ancre par défaut utilisée par le maillage. */
  ancre: string;
  /** Slugs de secteurs à lier depuis cette page. */
  secteursLies: string[];
  publie: boolean;
};

export const COMPARATIFS: Comparatif[] = [
  {
    slug: "whatsapp-business-reponse-automatique",
    titre: "Réponse automatique WhatsApp Business : ce qu'elle fait et ce qu'elle ne fait pas",
    ancre: "réponse automatique WhatsApp Business",
    // immobilier et école : deux secteurs où les questions pratiques répétitives
    // (disponibilité d'un bien, frais de scolarité) sont le cas d'usage typique
    // d'une réponse automatique.
    secteursLies: ["restaurant", "boutique", "immobilier", "ecole"],
    publie: true,
  },
  {
    slug: "alternative-whatsapp-business",
    titre: "Alternative à WhatsApp Business pour répondre vraiment à vos clients",
    ancre: "alternative à WhatsApp Business",
    // artisan et garage automobile : métiers de terrain, mains prises, typiquement
    // à la recherche d'une vraie alternative à l'appli WhatsApp Business seule.
    secteursLies: ["boutique", "salon-de-beaute", "artisan", "garage-auto"],
    publie: true,
  },
  {
    slug: "repondre-whatsapp-la-nuit",
    titre: "Répondre aux clients sur WhatsApp la nuit et le week-end",
    ancre: "répondre sur WhatsApp la nuit",
    // événementiel/traiteur et agence de voyage : demandes concentrées le soir, le
    // week-end ou depuis l'étranger à des heures décalées.
    secteursLies: ["restaurant", "hotel", "evenementiel-traiteur", "agence-voyage"],
    publie: true,
  },
  {
    slug: "meilleur-chatbot-whatsapp-afrique-2026",
    titre: "Meilleur chatbot WhatsApp en Afrique en 2026 : le comparatif",
    ancre: "meilleur chatbot WhatsApp en Afrique",
    // Comparatif généraliste : couvre l'ensemble des secteurs du silo métier,
    // conforme à son sujet (un tour d'horizon, pas un cas d'usage unique).
    secteursLies: [
      "restaurant",
      "boutique",
      "hotel",
      "immobilier",
      "ecole",
      "artisan",
      "agence-voyage",
      "evenementiel-traiteur",
      "garage-auto",
    ],
    publie: true,
  },
  // 4 pages "wapy-vs-[concurrent]" ajoutées en tâche 12, après identification
  // des concurrents réels. Elles restent absentes tant qu'ils ne sont pas vérifiés.
];

export const COMPARATIFS_PUBLIES = COMPARATIFS.filter((c) => c.publie);
