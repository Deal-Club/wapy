/**
 * Fiches des concurrents cités par les pages comparatives `wapy-vs-*`.
 *
 * Règle qui gouverne ce fichier : aucune information n'y entre si elle n'a pas
 * été lue sur le site de l'éditeur lui-même, à la date portée par
 * `sourceVerif`. Pas de reprise d'un comparatif tiers, pas de caractéristique
 * déduite du positionnement, pas de tarif reconstitué de mémoire. Un champ qui
 * dit « l'éditeur ne publie pas ce chiffre » est exact ; un chiffre plausible
 * ne l'est pas.
 *
 * L'enjeu n'est pas éditorial. Décrire faussement un tiers sur une page
 * publique expose à une mise en cause, et un comparatif pris en défaut sur un
 * point vérifiable cesse d'être cité. Les `pointsFaibles` sont donc des limites
 * factuelles, opposables au site de l'éditeur (une devise, une langue, un
 * supplément facturé), jamais des jugements de valeur.
 *
 * Ce fichier décrit les concurrents, PAS la comparaison avec Wapy. Aucune
 * incise du type « ce que Wapy ne fait pas » n'y a sa place : le schéma ne
 * porte aucun champ pour la contrepartie Wapy, donc une telle incise n'est
 * relue par personne et vieillit en silence. C'est exactement ainsi que la
 * seule erreur factuelle de la première version s'est glissée ici, en
 * affirmant que Wapy ne traitait que WhatsApp alors qu'il expose aussi un chat
 * web (`saas/webchat.py:127`, `brain/brain.py:44`). La comparaison est le
 * travail de la tâche 14, qui a les deux côtés sous les yeux.
 *
 * Le relevé complet, avec l'URL consultée et la citation qui soutient chaque
 * champ, est consigné dans
 * `.superpowers/sdd/2026-08-10-seo-vague1/task-13-report.md`.
 */
export type Concurrent = {
  slug: string;
  nom: string;
  url: string;
  positionnement: string;
  pointsForts: string[];
  pointsFaibles: string[];
  tarifIndicatif: string;
  /** Date de vérification des informations sur le site de l'éditeur. */
  sourceVerif: string;
};

export const CONCURRENTS: Concurrent[] = [
  {
    slug: "neobot",
    nom: "NéoBot",
    url: "https://neobot-ai.com",
    positionnement:
      "Assistant IA WhatsApp développé au Cameroun. L'éditeur le présente comme « l'assistant IA WhatsApp conçu pour les entreprises africaines », « conçu pour les PME africaines », et situe son équipe à « Yaoundé, Cameroun ».",
    pointsForts: [
      "Éditeur africain : « NéoBot est développé à Yaoundé », et le pied de page de sa page comparative porte la mention « Made in Cameroon »",
      "Tarif publié directement en francs CFA, sans conversion : 20 000 FCFA par mois",
      "Paiement annoncé par Orange Money, MTN, Wave et Stripe",
      "Assistant annoncé en français et en anglais, et qui « comprend le pidgin camerounais »",
      "Essai de 14 jours annoncé sans carte bancaire, avec inscription en libre-service depuis le site",
    ],
    pointsFaibles: [
      "Une seule formule publiée, plafonnée à 3 000 messages WhatsApp par mois et 1 agent IA actif",
      "Base de connaissance bornée à 3 fichiers PDF dans la formule publiée",
      "Support annoncé « par email » dans la formule publiée",
      "Le tarif d'appel de 10 000 FCFA par mois est présenté comme une « offre fondateur » réservée à 10 places",
    ],
    tarifIndicatif:
      "20 000 FCFA par mois (formule Essential), après 14 jours d'essai gratuit sans carte ; offre fondateur affichée à 10 000 FCFA par mois pour 10 places (relevé 2026-08-11)",
    sourceVerif: "2026-08-11",
  },
  {
    slug: "botnation-ai",
    nom: "Botnation AI",
    url: "https://botnation.ai",
    // Titre de la page WhatsApp de l'éditeur, repris tel quel.
    positionnement:
      "Éditeur français de chatbots no-code. Sa page WhatsApp s'intitule « Chatbot WhatsApp IA : automatisez vos conversations 24h/24 » et annonce une solution reposant « sur l'API officielle WhatsApp Business ».",
    pointsForts: [
      "Éditeur établi en France : adresse à Paris et ligne de support français publiées sur le site",
      "Repose sur l'API officielle WhatsApp Business, selon la FAQ de l'éditeur",
      "Annonce des données « hébergées sur notre plateforme, sous juridiction française et européenne » et une conformité RGPD",
      "Formule d'entrée gratuite pour créer et tester avant tout abonnement",
      "Chatbot déployable au-delà de WhatsApp (Messenger, Instagram, site web)",
    ],
    pointsFaibles: [
      "Tarifs publiés en euros uniquement, aucun montant en francs CFA sur la page tarifs",
      "Le coût des messages facturés par Meta s'ajoute à l'abonnement : l'éditeur annonce « deux coûts distincts »",
      "Site publié en français et en anglais seulement (hreflang fr et en)",
    ],
    tarifIndicatif:
      "gratuit pour créer et tester, puis à partir de 39 EUR par mois, hors messages facturés par Meta (relevé 2026-08-11)",
    sourceVerif: "2026-08-11",
  },
  {
    slug: "callbell",
    nom: "Callbell",
    url: "https://www.callbell.eu",
    positionnement:
      "Boîte de réception partagée multi-agents. L'éditeur se présente comme « le seul outil qui vous permet de centraliser tous les messages de Whatsapp Business, Facebook Messenger, Instagram Direct et Telegram dans une seule plateforme ».",
    pointsForts: [
      "Site, offre et tarifs entièrement disponibles en français",
      "Éditeur qui se déclare « une entreprise SaaS fondée à Paris en 2019 »",
      "Centralise WhatsApp Business, Messenger, Instagram Direct et Telegram dans une même boîte de réception",
      "Pensé pour le travail à plusieurs agents sur les mêmes conversations",
      "Compte gratuit pour démarrer, annoncé à 0 EUR par mois",
    ],
    pointsFaibles: [
      "Facturation par utilisateur et par mois, en euros : le coût augmente avec la taille de l'équipe",
      "Le canal WhatsApp est facturé 50 EUR par mois en supplément de l'abonnement par utilisateur",
      "La création de bots fait l'objet d'un module facturé 20 EUR par mois, et les campagnes WhatsApp d'un module à 59 EUR par mois",
      "Engagement minimum de 3 mois annoncé sur la page tarifs",
    ],
    tarifIndicatif:
      "14 EUR par mois et par utilisateur (offre Gestion de chat), 18 EUR pour Gestion de chat Plus, canal WhatsApp 50 EUR par mois en sus (relevé 2026-08-11)",
    sourceVerif: "2026-08-11",
  },
  {
    slug: "lafricamobile",
    nom: "LAfricaMobile",
    url: "https://lafricamobile.com",
    positionnement:
      "Opérateur de messagerie professionnelle basé à Dakar, qui se présente comme « la 1ère plateforme de communication et de marketing mobile en Afrique ». Sa page WhatsApp propose d'« intégrer WhatsApp Business Platform pour automatiser les conversations, envoyer des notifications, recueillir des réponses et gérer vos relations client à grande échelle ».",
    pointsForts: [
      "Éditeur africain : siège social publié à Dakar, Immeuble CFI, 11 Rue Vincens",
      "Assistance téléphonique sur un numéro sénégalais, annoncée du lundi au dimanche de 08h à 23h (GMT)",
      "Site et parcours de devis en français",
      "Gamme multicanale au-delà de WhatsApp : Push SMS, Pull SMS, USSD, Push Vocal, Airtime, paiement",
      "Certification ISO 27001 affichée sur le site",
    ],
    pointsFaibles: [
      "Aucun tarif publié : la page « Pricing » est un formulaire « Demandez un devis »",
      "Les crédits de test offerts à l'inscription (10 SMS, 10 sessions USSD, 10 messages vocaux, 100 XOF d'Airtime) ne couvrent pas WhatsApp",
      "Aucune formule en libre-service annoncée pour WhatsApp : il faut passer par un conseiller",
    ],
    tarifIndicatif:
      "aucun tarif publié, la page Pricing renvoie vers un formulaire de demande de devis (relevé 2026-08-11)",
    sourceVerif: "2026-08-11",
  },
];
