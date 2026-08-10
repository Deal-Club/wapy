import type { Pays } from "./types";

/**
 * Pays de la vague 1 du silo géographique.
 *
 * Règle G1 : tout `population` pointe vers une source du registre `SOURCES`,
 * avec l'année de la collecte officielle. Aucune valeur estimée ni extrapolée.
 * Un pays sans chiffre officiel identifiable reste sans `population`.
 */
export const PAYS: Pays[] = [
  {
    slug: "benin",
    nom: "Bénin",
    gentile: "béninois",
    indicatif: "+229",
    monnaie: "XOF",
    capitale: "Porto-Novo",
    capitaleEconomique: "Cotonou",
    mobileMoney: ["MTN MoMo", "Moov Money", "Celtiis Cash"],
    operateurs: ["MTN Bénin", "Moov Africa Bénin", "Celtiis"],
    particularites: [
      "Numéros passés de 8 à 10 chiffres, les deux formats circulent encore",
      "WhatsApp sert de vitrine principale à beaucoup de commerces sans site web",
      "Paiement majoritairement Mobile Money, rarement par carte",
    ],
    // Pas de `population` : le dernier dénombrement publié par l'INStaD est le
    // RGPH4 de 2013 (10 008 749), qui sous-estime la réalité de 2026 de 25 à 30 %.
    // Le RGPH5 n'a pas encore livré de résultat national. On préfère l'omission
    // à un chiffre exact mais trompeur.
    enBref:
      "Au Bénin, un assistant WhatsApp répond aux clients 24h/24 avec les informations de l'entreprise : horaires, prix, disponibilité. Wapy se configure en quelques minutes, sans code, et transmet au responsable ce qui mérite un humain.",
    angle:
      "Au Bénin, le commerce se joue sur WhatsApp avant de se jouer en boutique. Un client de Cotonou écrit à trois vendeurs le même soir et achète chez celui qui répond en premier. La difficulté n'est pas le manque de demandes, c'est de répondre à toutes, y compris après la fermeture et pendant les heures de forte affluence.",
    faq: [
      {
        q: "Wapy fonctionne-t-il avec un numéro béninois en 10 chiffres ?",
        r: "Le compte de l'établissement se connecte par QR code, aucun numéro n'y est saisi. Là où vous en tapez un, pour le responsable ou pour inviter un collaborateur, Wapy essaie les variantes en 8 et en 10 chiffres et envoie un code sur WhatsApp : seule la vraie ligne le reçoit.",
      },
      {
        q: "Faut-il un compte WhatsApp Business ?",
        r: "Non. Wapy se connecte au compte WhatsApp que vous utilisez déjà, professionnel ou classique, par un simple scan de QR code. Aucun changement de numéro ni migration n'est nécessaire.",
      },
      {
        q: "L'assistant peut-il gérer les paiements Mobile Money ?",
        r: "Wapy informe le client des moyens de paiement acceptés et transmet vos coordonnées MTN MoMo ou Moov Money. Il n'encaisse pas lui-même : la transaction reste entre le client et votre compte habituel.",
      },
      {
        q: "Que se passe-t-il si le réseau coupe ?",
        r: "L'assistant ne tourne pas sur votre téléphone mais sur un serveur, votre appareil peut donc être éteint ou hors réseau. Les messages qu'un client envoie pendant sa propre coupure arrivent quand sa connexion revient, et un message livré deux fois n'est traité qu'une seule fois.",
      },
      {
        q: "Combien de temps pour mettre en place l'assistant ?",
        r: "Quelques minutes. Vous décrivez votre activité, l'IA génère une première fiche complète avec vos informations, votre catalogue et vos questions fréquentes, puis vous corrigez ce qui doit l'être avant de connecter WhatsApp.",
      },
      {
        q: "Le client sait-il qu'il parle à un assistant ?",
        r: "Le ton reste celui de votre établissement, chaleureux et direct. Dès qu'une demande sort du cadre prévu, réclamation ou cas particulier, Wapy prévient le responsable et laisse la main à un humain.",
      },
    ],
    secteursPhares: ["restaurant", "boutique", "salon-de-beaute"],
    publie: true,
  },
  {
    slug: "cote-divoire",
    nom: "Côte d'Ivoire",
    gentile: "ivoirien",
    indicatif: "+225",
    monnaie: "XOF",
    capitale: "Yamoussoukro",
    capitaleEconomique: "Abidjan",
    mobileMoney: ["Orange Money", "MTN MoMo", "Moov Money", "Wave"],
    operateurs: ["Orange Côte d'Ivoire", "MTN Côte d'Ivoire", "Moov Africa Côte d'Ivoire"],
    particularites: [
      "Numéros à 10 chiffres depuis le 31 janvier 2021, avec un préfixe 07, 05 ou 01 selon l'opérateur",
      "Abidjan concentre l'essentiel de l'activité commerciale, des livraisons et des sièges",
      "Le Mobile Money est le mode de règlement courant, les frais de transfert ayant beaucoup baissé",
      "Beaucoup de commerces publient leur catalogue en statut WhatsApp plutôt que sur un site",
    ],
    population: {
      valeur: 29389150,
      annee: 2021,
      source: "ins-cotedivoire-rgph",
      nature: "recensement",
    },
    enBref:
      "En Côte d'Ivoire, Wapy répond sur WhatsApp à la place du commerçant : horaires, adresse, tarifs, disponibilité, modalités de livraison. L'assistant se configure sans code et passe la main au responsable pour les réclamations et les cas où un humain est vraiment nécessaire.",
    angle:
      "À Abidjan, une demande commerciale commence rarement par un appel : elle commence par un message WhatsApp envoyé depuis un embouteillage de Cocody ou une cour de Yopougon. Pendant ce temps, le commerçant est au comptoir, en livraison ou chez son fournisseur. Aux heures de pointe, les messages s'empilent pendant des heures, et le client a souvent déjà écrit à deux concurrents avant d'obtenir une réponse.",
    faq: [
      {
        q: "Mon numéro a changé lors du passage aux 10 chiffres, faut-il refaire quelque chose ?",
        r: "Non, rien à refaire. Depuis le 31 janvier 2021, votre numéro porte un préfixe 07, 05 ou 01 selon votre opérateur. Pour le numéro du responsable, Wapy essaie les variantes plausibles et envoie un code de vérification sur WhatsApp, plutôt que de deviner un format à votre place.",
      },
      {
        q: "L'assistant comprend-il le français tel qu'on l'écrit à Abidjan ?",
        r: "Les clients écrivent vite, avec des abréviations, des fautes de frappe et des tournures locales, et l'assistant s'attache à l'intention plutôt qu'à la forme exacte. Il répond en français, la seule langue de réponse prévue à ce jour, dans le ton que vous avez indiqué.",
      },
      {
        q: "Puis-je empêcher l'assistant de répondre à certains numéros ?",
        r: "Oui. Vous tenez une liste de numéros exclus, et l'assistant ne répond jamais à ceux-là. C'est utile pour vos fournisseurs, vos proches ou vos employés, dont les messages n'ont pas à être traités comme des demandes de clients. En revanche, aucune plage horaire d'activité n'existe.",
      },
      {
        q: "Comment l'assistant traite-t-il une demande de livraison dans Abidjan ?",
        r: "Wapy annonce les communes que vous desservez, vos délais habituels et vos frais de livraison, tels que vous les avez renseignés. Il collecte ensuite le quartier et le point de repère du client, enregistre la commande et vous la transmet pour que vous organisiez la course.",
      },
      {
        q: "Que devient un client qui veut négocier le prix ?",
        r: "L'assistant s'en tient à votre fiche et n'annonce jamais un tarif qui n'y figure pas. Devant une demande de remise que rien ne prévoit, il répond sans s'engager. Vous pouvez lui écrire une consigne qui lui dit exactement quoi faire dans ce cas, il la suivra.",
      },
      {
        q: "Faut-il laisser mon téléphone allumé en permanence ?",
        r: "Non. Une fois le compte connecté, l'assistant répond depuis le service, pas depuis votre appareil. Vous pouvez éteindre votre téléphone, être en déplacement ou dans une zone sans réseau : les conversations continuent et vous les retrouvez à votre retour.",
      },
    ],
    secteursPhares: ["immobilier", "garage-auto", "restaurant"],
    publie: true,
  },
  {
    slug: "senegal",
    nom: "Sénégal",
    gentile: "sénégalais",
    indicatif: "+221",
    monnaie: "XOF",
    capitale: "Dakar",
    capitaleEconomique: "Dakar",
    mobileMoney: ["Wave", "Orange Money", "Free Money"],
    operateurs: ["Orange Sénégal", "Free Sénégal", "Expresso Sénégal"],
    particularites: [
      "Plan de numérotation fermé à 9 chiffres, encadré par l'ARTP",
      "Le transfert d'argent par Mobile Money est entré dans les habitudes, y compris pour de petits montants",
      "Les clients passent du français au wolof dans un même message et envoient beaucoup de notes vocales",
      "Dakar concentre les sièges, les commerces et la majorité des livraisons",
    ],
    population: {
      valeur: 18126390,
      annee: 2023,
      source: "ansd-senegal-rgphae",
      nature: "recensement",
    },
    enBref:
      "Au Sénégal, Wapy tient la conversation WhatsApp de votre établissement : horaires, adresse, tarifs, réservations, moyens de paiement. Il répond à partir de votre fiche, sans jamais inventer, et ne passe la main qu'en cas de réclamation ou de demande explicite de parler à quelqu'un.",
    angle:
      "À Dakar, la journée d'un commerçant est hachée : approvisionnement le matin, livraisons l'après-midi, et un téléphone qui vibre sans interruption entre les deux. Les clients écrivent en français, glissent un mot en wolof, ou dictent une note vocale en marchant. Ils attendent une réponse tout de suite, et celui qui répond seulement le lendemain matin découvre que la commande est partie ailleurs.",
    faq: [
      {
        q: "Wapy comprend-il un message qui mélange français et wolof ?",
        r: "L'assistant répond en français, seule langue de réponse prévue à ce jour, y compris quand un mot ou une formule wolof se glisse dans la question. Il ne s'appuie que sur votre fiche : si l'information manque, il dit qu'il se renseigne plutôt que d'improviser une réponse.",
      },
      {
        q: "Beaucoup de mes clients envoient des notes vocales, comment cela se passe ?",
        r: "Les notes vocales sont transcrites, puis l'assistant répond au contenu comme si le client avait écrit. C'est une option facturée en plus du forfait de base. Si la transcription échoue, l'assistant remercie le client et lui demande d'écrire sa demande en quelques mots.",
      },
      {
        q: "Puis-je indiquer que je suis payé par Wave ou par Orange Money ?",
        r: "Oui. Vous renseignez les moyens que vous acceptez et le numéro sur lequel vous recevez les règlements. L'assistant les communique quand le client demande comment payer. Il ne déclenche aucune transaction : l'argent circule directement entre le client et votre compte.",
      },
      {
        q: "Mon numéro sénégalais fait 9 chiffres, faut-il un format particulier ?",
        r: "Non. La connexion se fait par un scan de QR code depuis le compte WhatsApp que vous utilisez déjà, quel que soit l'opérateur. Le plan sénégalais compte 9 chiffres après l'indicatif +221, et c'est ce numéro qui vous identifie. Rien à changer, ni carte SIM ni abonnement.",
      },
      {
        q: "L'assistant peut-il prendre des réservations pour mon établissement ?",
        r: "Avec l'option rendez-vous, il propose vos créneaux libres et, quand le client en choisit un, enregistre la réservation, la confirme et vous notifie. Sans cette option, il récolte la date, le nombre de personnes et le nom, confirme au client et vous transmet la demande.",
      },
      {
        q: "Est-ce que cela coûte quelque chose à mes clients ?",
        r: "Non. Vos clients écrivent depuis leur WhatsApp habituel, comme ils le feraient pour vous joindre directement. Ils ne téléchargent rien, ne créent aucun compte et ne paient rien de plus que leur forfait internet. Pour eux, la conversation ressemble à n'importe quel échange.",
      },
    ],
    secteursPhares: ["hotel", "agence-voyage", "clinique-pharmacie"],
    publie: true,
  },
  {
    slug: "cameroun",
    nom: "Cameroun",
    gentile: "camerounais",
    indicatif: "+237",
    monnaie: "XAF",
    capitale: "Yaoundé",
    capitaleEconomique: "Douala",
    mobileMoney: ["MTN MoMo", "Orange Money"],
    operateurs: ["MTN Cameroun", "Orange Cameroun", "Camtel", "Nexttel"],
    particularites: [
      "Plan de numérotation fermé à 9 chiffres depuis novembre 2014, les mobiles commencent par 6",
      "Pays bilingue : une partie de la clientèle écrit en anglais, l'autre en français",
      "Douala porte le commerce et le port, Yaoundé l'administration et les décisions publiques",
      "Monnaie en franc CFA d'Afrique centrale (XAF), distincte du XOF ouest-africain",
    ],
    // Estimation modélisée du BUCREP, pas un dénombrement : le Cameroun n'a pas
    // recensé sa population depuis 2005 et le 4e RGPH est en préparation.
    population: {
      valeur: 28856127,
      annee: 2023,
      source: "bucrep-cameroun-rgph",
      nature: "estimation",
    },
    enBref:
      "Au Cameroun, Wapy répond sur WhatsApp aux questions courantes de vos clients : horaires, adresse, tarifs en francs CFA, disponibilité. L'assistant se configure sans code et transmet au responsable les demandes qui exigent un arbitrage humain.",
    angle:
      "Au Cameroun, un même commerce reçoit dans la même heure un message en français depuis Douala et une question en anglais depuis Bamenda ou Buea. S'ajoute la distance entre la ville où se traite le négoce et celle où se prennent les décisions administratives. Répondre vite, dans la bonne langue et sans se tromper de tarif finit par occuper une personne à plein temps.",
    faq: [
      {
        q: "Mes clients écrivent en français et en anglais, comment l'assistant s'adapte-t-il ?",
        r: "Autant le dire clairement : l'assistant répond en français, c'est la seule langue prévue par son fonctionnement actuel. Un client qui écrit en anglais reçoit donc une réponse en français. Si votre clientèle est majoritairement anglophone, mieux vaut le savoir avant de vous engager.",
      },
      {
        q: "Les numéros camerounais commencent par 6, est-ce un problème pour la connexion ?",
        r: "Aucun. Le plan camerounais compte 9 chiffres et réserve le 6 aux mobiles depuis novembre 2014. Wapy se connecte au compte WhatsApp associé à ce numéro par un scan de QR code, sans saisie manuelle de format ni configuration particulière chez votre opérateur.",
      },
      {
        q: "Puis-je gérer deux établissements, un à Douala et un à Yaoundé ?",
        r: "Chaque établissement se gère comme un compte à part : sa fiche, son numéro et sa propre connexion WhatsApp. Un client qui écrit au numéro de Douala reçoit donc les informations de Douala. Il n'existe pas de fiche unique qui servirait les deux adresses à la fois.",
      },
      {
        q: "L'assistant sait-il annoncer des prix en francs CFA ?",
        r: "Oui. Vous saisissez vos tarifs en XAF dans votre catalogue et l'assistant les reprend tels quels, sans conversion ni arrondi. S'il existe des variantes, tailles ou formules, mieux vaut les détailler : l'assistant ne devine jamais un prix que vous n'avez pas renseigné.",
      },
      {
        q: "Que se passe-t-il quand un client demande un devis détaillé ?",
        r: "Wapy pose les questions de cadrage prévues par votre consigne, comme la quantité, le délai ou le lieu, enregistre la demande et vous la notifie avec le récapitulatif. Le chiffrage reste à vous, l'assistant n'avance aucun montant qui ne figure pas dans votre fiche.",
      },
      {
        q: "Puis-je reprendre la main sur une conversation ?",
        r: "Oui. Quand l'assistant passe la main, vous recevez une alerte sur WhatsApp : vous citez ce message et votre réponse part au client, sous votre identité habituelle. La conversation vous reste tant que vous ne tapez pas la commande de retour, qui la rend à l'assistant.",
      },
    ],
    secteursPhares: ["ecole", "evenementiel-traiteur", "clinique-pharmacie"],
    publie: true,
  },
  {
    slug: "togo",
    nom: "Togo",
    gentile: "togolais",
    indicatif: "+228",
    monnaie: "XOF",
    capitale: "Lomé",
    capitaleEconomique: "Lomé",
    mobileMoney: ["T-Money", "Flooz"],
    operateurs: ["Togocom", "Moov Africa Togo"],
    particularites: [
      "Plan de numérotation fermé à 8 chiffres, encadré par l'ARCEP",
      "Lomé est à la fois la capitale politique et le cœur économique du pays",
      "T-Money et Flooz couvrent l'essentiel des règlements par téléphone",
      "Le port de Lomé irrigue un corridor commercial vers les pays sans littoral",
    ],
    population: {
      valeur: 8095498,
      annee: 2022,
      source: "inseed-togo-rgph",
      nature: "recensement",
    },
    enBref:
      "Au Togo, Wapy répond aux clients sur WhatsApp avec les informations de votre activité : horaires, adresse, tarifs, délais, moyens de paiement. La mise en place prend quelques minutes et ne demande ni site web ni compétence technique.",
    angle:
      "Au Togo, presque tout se joue à Lomé : le marché, le port, les bureaux et la clientèle tiennent dans un rayon de quelques kilomètres, ce qui rend la concurrence immédiate et très visible. Un artisan ou un commerçant traite ses commandes entre deux déplacements, avec son téléphone pour seul bureau. Les demandes arrivent souvent tard le soir, quand le client rentre enfin chez lui et pense à commander.",
    faq: [
      {
        q: "Les numéros togolais font 8 chiffres, Wapy les reconnaît-il ?",
        r: "Oui. Le plan togolais compte 8 chiffres après l'indicatif +228, aussi bien chez Togocom que chez Moov Africa. La connexion se fait par un scan de QR code depuis le compte WhatsApp que vous utilisez déjà, sans saisir vous-même le moindre format.",
      },
      {
        q: "Puis-je annoncer que j'accepte T-Money ou Flooz ?",
        r: "Oui. Vous indiquez les moyens acceptés et le numéro qui reçoit les règlements, et l'assistant les communique dès qu'un client demande comment payer. Wapy ne traite aucun paiement lui-même : la somme part directement du client vers votre compte, comme aujourd'hui.",
      },
      {
        q: "Mon activité est artisanale et souvent sur mesure, l'assistant sait-il en parler ?",
        r: "Il présente ce que vous savez faire, vos matériaux, vos délais habituels et vos fourchettes de prix, à condition de les avoir renseignés. Pour une pièce vraiment particulière, il rassemble le besoin du client et vous le transmet, sans s'engager sur un prix à votre place.",
      },
      {
        q: "L'assistant peut-il donner mon adresse avec un point de repère à Lomé ?",
        r: "Oui, et c'est même conseillé. Beaucoup d'adresses se décrivent mieux par un repère que par un nom de rue. Vous rédigez l'itinéraire comme vous l'expliqueriez au téléphone, et l'assistant s'appuie dessus sans jamais inventer une adresse qui ne figure pas dans votre fiche.",
      },
      {
        q: "Que fait Wapy lorsqu'il ne connaît pas la réponse ?",
        r: "Il ne l'invente pas, c'est la première règle de son fonctionnement. Il dit qu'il se renseigne, ou propose le moyen de contact indiqué dans votre fiche. Il ne dérange le responsable que si le client insiste, ou si le sujet est une réclamation ou un litige.",
      },
      {
        q: "Dois-je changer ma façon de travailler pour utiliser l'assistant ?",
        r: "Non. Vous gardez votre numéro, votre compte WhatsApp et vos habitudes. Le seul vrai travail est de mettre par écrit ce que vous répétez déjà toute la journée : horaires, tarifs, délais. Cette fiche se corrige ensuite à tout moment, en quelques secondes.",
      },
    ],
    secteursPhares: ["artisan", "boutique", "hotel"],
    publie: true,
  },
];

export function getPays(slug: string): Pays | undefined {
  return PAYS.find((p) => p.slug === slug);
}

export function paysPublies(): Pays[] {
  return PAYS.filter((p) => p.publie);
}
