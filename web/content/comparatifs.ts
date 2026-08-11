import type { QuestionReponse } from "./types";
import { CONCURRENTS, type Concurrent } from "./concurrents";

/**
 * Silo décision : les 8 pages `/comparatif/<slug>`.
 *
 * Deux règles gouvernent la rédaction de ce fichier, et elles ne sont pas des
 * scrupules mais des conditions d'efficacité.
 *
 * 1. Sur les CONCURRENTS : aucune caractéristique n'est écrite ici si elle ne
 *    figure pas dans `content/concurrents.ts`, dont chaque champ a été relevé
 *    sur le site de l'éditeur. Rien n'est complété de mémoire, rien n'est
 *    déduit d'un positionnement. Les pages `wapy-vs-*` sont pour cette raison
 *    CONSTRUITES depuis `CONCURRENTS` : les cellules du tableau et l'essentiel
 *    du corps sont des reprises littérales des champs, et les rares phrases
 *    rédigées à la main portent en commentaire le champ dont elles viennent.
 *    Chaque concurrent voit ses points forts exposés, y compris là où il
 *    dépasse Wapy : un classement où l'auteur se met premier et où les autres
 *    n'ont que des défauts se fait contredire, et une source contredite cesse
 *    d'être citée.
 *
 * 2. Sur WAPY : toute affirmation est soutenue par le code du produit.
 *    Réponses en français uniquement (`brain/brain.py:46-47`), information
 *    manquante qui ne déclenche PAS de transfert mais un « je me renseigne »
 *    (`brain/brain.py:129-133`), escalade rare et cadrée (`brain.py:114-128`),
 *    conduite de la demande jusqu'à son enregistrement (`brain.py:51-65`),
 *    connexion par QR code au compte existant (`saas/wa.py:73-79`), essai de
 *    7 jours (`saas/billing.py:14`), facturation en francs CFA
 *    (`saas/billing.py:15`), groupes et diffusions ignorés
 *    (`saas/bot.py:42`), chat web (`saas/webchat.py`).
 *
 * AUCUN prix de Wapy n'est affiché : les montants de `saas/billing.py` sont
 * provisoires et n'ont pas été validés commercialement. L'essai de 7 jours et
 * la facturation en francs CFA, eux, sont publiables.
 */
export type Comparatif = {
  slug: string;
  titre: string;
  /** Ancre par défaut utilisée par le maillage. */
  ancre: string;
  /** Slugs de secteurs à lier depuis cette page. */
  secteursLies: string[];
  /** Réponse directe, moins de 50 mots. */
  enBref: string;
  /** Corps rédigé, paragraphes de 2 à 4 lignes. */
  sections: { id: string; titre: string; paragraphes: string[] }[];
  /** Tableau du comparatif, colonnes libres. */
  tableau: {
    colonnes: { cle: string; libelle: string }[];
    lignes: Record<string, string>[];
    legende: string;
  };
  faq: QuestionReponse[];
  publie: boolean;
};

/** Date de relevé des fiches concurrents, en toutes lettres pour le corps de texte. */
const RELEVE_LE = "11 août 2026";

/** Ce que Wapy fait, formulé une fois et réutilisé par les tableaux. */
const WAPY_FORTS =
  "Répond seul à partir de la fiche que vous remplissez, conclut réservations et commandes puis notifie le responsable, se connecte au compte WhatsApp existant en scannant un QR code, facturation en francs CFA";

/** Ce que Wapy ne fait pas. Même exigence de vérifiabilité que pour les concurrents. */
const WAPY_LIMITES =
  "Réponses en français uniquement, pas d'API officielle Meta donc pas d'envoi en nombre ni de campagne, n'encaisse pas les paiements des clients finaux";

const WAPY_TARIF = "Abonnement mensuel en francs CFA, essai gratuit de 7 jours";

const THEMATIQUES: Comparatif[] = [
  {
    slug: "whatsapp-business-reponse-automatique",
    titre: "Réponse automatique WhatsApp Business : ce qu'elle fait et ce qu'elle ne fait pas",
    ancre: "réponse automatique WhatsApp Business",
    // immobilier et école : deux secteurs où les questions pratiques répétitives
    // (disponibilité d'un bien, frais de scolarité) sont le cas d'usage typique
    // d'une réponse automatique.
    secteursLies: ["restaurant", "boutique", "immobilier", "ecole"],
    enBref:
      "La réponse automatique de WhatsApp Business envoie un texte fixe : message d'absence, message d'accueil, réponses rapides déclenchées au clavier. Elle prévient le client que son message est arrivé, elle ne répond pas à la question qu'il a posée.",
    sections: [
      {
        id: "fonctions",
        titre: "Ce que l'application propose vraiment",
        paragraphes: [
          "L'application WhatsApp Business réunit sous le nom de réponse automatique trois fonctions qu'on confond souvent. Le message d'absence part en dehors des horaires que vous définissez. Le message d'accueil part au premier contact. Les réponses rapides sont des textes enregistrés que vous rappelez par un raccourci pendant la conversation : elles vous font gagner du temps, mais c'est vous qui les déclenchez.",
          "S'y ajoute le catalogue, où vous publiez vos articles avec leur prix et leur photo. Le client peut le parcourir et vous envoyer un article dans le fil. Là encore, c'est lui qui cherche, et c'est vous qui répondez ensuite.",
          "Ces fonctions ont un mérite que rien ne remplace : l'application est gratuite, elles s'activent en quelques minutes, et le texte part exactement comme vous l'avez écrit, dans la langue que vous voulez. Pour une entreprise qui reçoit trois messages par jour et les traite le soir, c'est suffisant, et il n'y a aucune raison de payer davantage.",
        ],
      },
      {
        id: "limites",
        titre: "Là où le texte fixe s'arrête",
        paragraphes: [
          "Un message d'absence dit la même chose à tout le monde. Celui qui demande le prix d'une chambre, celui qui veut savoir si vous livrez à l'autre bout de la ville et celui qui veut annuler reçoivent le même paragraphe. Aucun des trois n'a sa réponse, et les trois attendent.",
          "Le deuxième effet est plus discret : la réponse automatique ferme la conversation au lieu de l'ouvrir. Elle annonce un délai. Pendant ce délai, le client écrit au commerce suivant, celui qui lui répondra pour de bon.",
          "Enfin, rien n'est enregistré. Une demande de réservation arrivée à 22h reste un message parmi d'autres dans un fil, à retrouver le lendemain matin en remontant l'historique, avec le risque d'en oublier une au passage.",
        ],
      },
      {
        id: "assistant",
        titre: "Ce que change un assistant qui lit votre fiche",
        paragraphes: [
          "Un assistant comme Wapy ne choisit pas un texte dans une liste : il lit la demande et compose sa réponse à partir de la fiche que vous remplissez, vos horaires, votre catalogue, vos tarifs, vos consignes. Il pose les questions qui manquent, confirme au client, enregistre la commande ou la réservation et vous envoie le récapitulatif.",
          "Ses limites sont aussi nettes que ses capacités. Il répond en français, la seule langue prévue à ce jour. Quand une information manque à votre fiche, il ne vous dérange pas pour autant : il dit qu'il se renseigne et que quelqu'un reviendra vers le client, plutôt que d'avancer un prix ou une disponibilité qu'il n'a pas. Il ne vous passe la main que dans les cas rares où un humain est indispensable, une réclamation, un sujet sensible, ou un client qui demande explicitement à vous parler.",
          "Les deux approches ne s'excluent pas. Rien n'empêche de garder le message d'absence pour une fermeture annuelle et de confier le quotidien à un assistant : le compte WhatsApp reste le vôtre, l'assistant s'y connecte en scannant un QR code, sans changement de numéro ni migration de conversations.",
        ],
      },
    ],
    tableau: {
      colonnes: [
        { cle: "critere", libelle: "Critère" },
        { cle: "wb", libelle: "WhatsApp Business" },
        { cle: "wapy", libelle: "Wapy" },
      ],
      lignes: [
        {
          critere: "Répondre à une question précise",
          wb: "Non : le texte envoyé est le même pour tous",
          wapy: "Oui, depuis les informations de votre fiche",
        },
        {
          critere: "Part sans intervention",
          wb: "Le message d'absence et le message d'accueil partent seuls ; les réponses rapides se déclenchent au clavier",
          wapy: "Oui, à toute heure, sur chaque message reçu",
        },
        {
          critere: "Prendre une commande ou une réservation",
          wb: "Non, le catalogue affiche, il n'enregistre pas",
          wapy: "Oui : questions manquantes, confirmation, enregistrement",
        },
        {
          critere: "Prévenir le responsable",
          wb: "Non",
          wapy: "Oui, récapitulatif envoyé après enregistrement",
        },
        {
          critere: "Langue",
          wb: "Celle du texte que vous avez écrit",
          wapy: "Français uniquement",
        },
        {
          critere: "Coût",
          wb: "Application gratuite",
          wapy: WAPY_TARIF,
        },
        {
          critere: "Mise en service",
          wb: "Quelques minutes dans l'application",
          wapy: "Fiche à remplir, puis QR code scanné depuis le compte existant",
        },
      ],
      legende:
        "Fonctions de l'application WhatsApp Business (message d'absence, message d'accueil, réponses rapides, catalogue) mises en regard de ce que fait l'assistant Wapy. Comparatif édité par Wapy.",
    },
    faq: [
      {
        q: "La réponse automatique de WhatsApp Business est-elle gratuite ?",
        r: "Oui. L'application WhatsApp Business est gratuite et contient le message d'absence, le message d'accueil, les réponses rapides et le catalogue. C'est son avantage principal : aucune dépense, aucun intermédiaire, et un texte qui part exactement comme vous l'avez écrit.",
      },
      {
        q: "Peut-on programmer plusieurs réponses automatiques différentes ?",
        r: "Le message d'absence est unique et part en dehors de vos horaires. Les réponses rapides peuvent être aussi nombreuses que vous le voulez, mais c'est vous qui les rappelez au clavier pendant la conversation. Aucune ne se choisit toute seule selon la question posée.",
      },
      {
        q: "Comment répondre vraiment aux questions sans être devant le téléphone ?",
        r: "Il faut un outil qui lise la demande et compose sa réponse à partir de vos informations. Wapy le fait depuis une fiche que vous remplissez : horaires, catalogue, tarifs, consignes. Il conclut aussi les réservations et les commandes, puis vous envoie le récapitulatif.",
      },
      {
        q: "Faut-il quitter WhatsApp Business pour utiliser un assistant ?",
        r: "Non. Wapy se connecte au compte WhatsApp que vous utilisez déjà, professionnel ou classique, en scannant un QR code depuis les appareils connectés. Vous gardez votre numéro, vos conversations et votre catalogue. Rien n'est migré.",
      },
      {
        q: "L'assistant parle-t-il la langue de mes clients ?",
        r: "Wapy répond en français, la seule langue prévue à ce jour, quelle que soit la langue du message reçu. Le message d'absence de WhatsApp Business, lui, part dans la langue que vous avez écrite : sur ce point précis, le texte fixe est plus souple.",
      },
      {
        q: "Que devient une demande arrivée pendant la nuit ?",
        r: "Avec un message d'absence, elle attend le matin dans le fil. Avec un assistant, le client obtient sa réponse tout de suite, et sa commande ou sa réservation est enregistrée avec ce qu'il a indiqué. Vous retrouvez le récapitulatif à l'ouverture.",
      },
    ],
    publie: true,
  },
  {
    slug: "alternative-whatsapp-business",
    titre: "Alternative à WhatsApp Business pour répondre vraiment à vos clients",
    ancre: "alternative à WhatsApp Business",
    // artisan et garage automobile : métiers de terrain, mains prises, typiquement
    // à la recherche d'une vraie alternative à l'appli WhatsApp Business seule.
    secteursLies: ["boutique", "salon-de-beaute", "artisan", "garage-auto"],
    enBref:
      "Chercher une alternative à WhatsApp Business, ce n'est pas changer d'application : c'est ajouter ce qu'elle ne fait pas, répondre à la question posée. Trois familles d'outils s'en chargent, et elles ne visent ni les mêmes entreprises ni les mêmes budgets.",
    sections: [
      {
        id: "familles",
        titre: "Trois familles d'outils, trois usages",
        paragraphes: [
          "La première centralise les messages pour que plusieurs personnes y répondent. Callbell se présente comme « le seul outil qui vous permet de centraliser tous les messages de Whatsapp Business, Facebook Messenger, Instagram Direct et Telegram dans une seule plateforme », et il est pensé pour le travail à plusieurs agents sur les mêmes conversations. Ce sont toujours des humains qui répondent, mais ils ne se marchent plus dessus.",
          "La deuxième passe par l'API officielle WhatsApp Business. Botnation AI annonce une solution reposant « sur l'API officielle WhatsApp Business » et des données « hébergées sur notre plateforme, sous juridiction française et européenne ». LAfricaMobile, opérateur dont le siège social est publié à Dakar, propose d'« intégrer WhatsApp Business Platform pour automatiser les conversations, envoyer des notifications, recueillir des réponses et gérer vos relations client à grande échelle ». C'est la voie des envois en nombre.",
          "La troisième laisse un assistant répondre seul, à partir des informations de l'entreprise. NéoBot, dont l'éditeur indique qu'il est « développé à Yaoundé », se présente comme « l'assistant IA WhatsApp conçu pour les entreprises africaines ». Wapy relève de cette famille : il répond sur le compte WhatsApp déjà utilisé, depuis une fiche remplie par l'établissement, et conclut réservations et commandes avant de prévenir le responsable.",
        ],
      },
      {
        id: "criteres",
        titre: "Cinq questions à se poser avant de choisir",
        paragraphes: [
          "En quelle monnaie payez-vous ? Botnation AI publie ses tarifs en euros uniquement et Callbell facture par utilisateur et par mois, en euros. NéoBot publie 20 000 FCFA par mois pour sa formule Essential, directement en francs CFA, et annonce le paiement par Orange Money, MTN, Wave et Stripe. Wapy facture en francs CFA.",
          "Le prix affiché est-il le prix final ? Chez Botnation AI, le coût des messages facturés par Meta s'ajoute à l'abonnement, l'éditeur annonçant « deux coûts distincts ». Chez Callbell, le canal WhatsApp est facturé 50 EUR par mois en supplément de l'abonnement par utilisateur, la création de bots fait l'objet d'un module à 20 EUR par mois et les campagnes WhatsApp d'un module à 59 EUR par mois.",
          "Pouvez-vous commencer seul ? Botnation AI propose une formule d'entrée gratuite pour créer et tester, Callbell un compte gratuit annoncé à 0 EUR par mois, NéoBot un essai de 14 jours sans carte bancaire avec inscription en libre-service. Chez LAfricaMobile, la page Pricing est un formulaire « Demandez un devis » et aucune formule en libre-service n'est annoncée pour WhatsApp. Wapy s'essaie 7 jours.",
          "Dans quelle langue vos clients écrivent-ils ? NéoBot annonce un assistant en français et en anglais, qui « comprend le pidgin camerounais ». Wapy ne répond qu'en français. Si une part de vos messages arrive en anglais ou en pidgin, c'est un critère décisif, et il ne joue pas en notre faveur.",
          "Combien de personnes répondent ? Callbell est pensé pour le travail à plusieurs agents sur les mêmes conversations, et sa facturation par utilisateur suit la taille de l'équipe. Wapy est construit autour d'un assistant qui répond seul, avec un tableau de bord depuis lequel vous reprenez la main quand il vous la passe.",
        ],
      },
      {
        id: "wapy",
        titre: "Ce que Wapy fait, et ce qu'il ne fait pas",
        paragraphes: [
          "Wapy répond aux messages reçus sur le compte WhatsApp que vous utilisez déjà, à partir d'une fiche que vous remplissez : informations, catalogue, tarifs, consignes. Il mène la demande jusqu'au bout au lieu d'accuser réception, pose les questions qui manquent, confirme au client, enregistre la commande ou la réservation et vous envoie le récapitulatif. Il répond aussi sur le chat de votre site web, avec l'option prévue à cet effet.",
          "Il ne fait pas tout, et mieux vaut le savoir avant de payer. Ses réponses sont en français, la seule langue prévue à ce jour. Il ne passe pas par l'API officielle Meta : la connexion se fait en scannant un QR code depuis le compte existant, ce qui écarte l'envoi en nombre et les campagnes, et le bot ignore les groupes comme les diffusions. Il n'encaisse pas les paiements de vos clients : il communique les coordonnées Mobile Money de l'établissement, la transaction reste entre eux et vous.",
          "Enfin, il ne vous alerte pas à la moindre hésitation. Si une information manque à la fiche, il répond qu'il se renseigne et que quelqu'un reviendra vers le client, plutôt que d'avancer un chiffre inventé. Le passage de main est réservé aux cas rares : réclamation, litige, sujet sensible, ou client qui demande explicitement une personne.",
        ],
      },
    ],
    tableau: {
      colonnes: [
        { cle: "outil", libelle: "Outil" },
        { cle: "approche", libelle: "Approche" },
        { cle: "tarif", libelle: "Tarif publié par l'éditeur" },
      ],
      lignes: [
        {
          outil: "Wapy",
          approche: "Assistant qui répond seul depuis la fiche de l'établissement, sur le compte WhatsApp existant",
          tarif: WAPY_TARIF,
        },
        ...CONCURRENTS.map((c) => ({
          outil: c.nom,
          approche: c.pointsForts[0],
          tarif: c.tarifIndicatif,
        })),
      ],
      legende: `Caractéristiques relevées sur les sites des éditeurs le ${RELEVE_LE}. La colonne « Approche » reprend le premier point fort consigné pour chaque éditeur. Comparatif édité par Wapy, qui y figure.`,
    },
    faq: [
      {
        q: "Faut-il abandonner WhatsApp Business pour passer à une alternative ?",
        r: "Non, dans la plupart des cas. Wapy se connecte au compte WhatsApp que vous utilisez déjà, professionnel ou classique, en scannant un QR code. Le numéro, les conversations et le catalogue restent les vôtres. L'alternative s'ajoute à l'application, elle ne la remplace pas.",
      },
      {
        q: "Quelle alternative coûte le moins cher ?",
        r: "Aucune ne se compare sans regarder les suppléments. Botnation AI publie une entrée gratuite puis 39 EUR par mois, hors messages facturés par Meta. Callbell facture 14 EUR par utilisateur et par mois, plus 50 EUR pour le canal WhatsApp. NéoBot publie 20 000 FCFA par mois.",
      },
      {
        q: "Existe-t-il une alternative éditée en Afrique ?",
        r: "Oui, deux au moins dans ce comparatif. NéoBot indique être développé à Yaoundé et affiche « Made in Cameroon ». LAfricaMobile publie son siège social à Dakar et une assistance téléphonique sénégalaise. Wapy, de son côté, est conçu pour l'Afrique francophone et facture en francs CFA.",
      },
      {
        q: "Peut-on payer en Mobile Money ?",
        r: "NéoBot annonce le paiement par Orange Money, MTN, Wave et Stripe. Botnation AI et Callbell publient leurs tarifs en euros. Attention à ne pas confondre le paiement de votre abonnement et celui de vos clients : Wapy n'encaisse pas les paiements des clients finaux.",
      },
      {
        q: "Une alternative permet-elle d'envoyer des messages en nombre ?",
        r: "C'est le domaine de l'API officielle WhatsApp Business, sur laquelle repose Botnation AI et que LAfricaMobile propose d'intégrer pour envoyer des notifications à grande échelle. Wapy ne le fait pas : il répond aux messages reçus, et ignore les groupes comme les diffusions.",
      },
      {
        q: "Comment choisir sans se tromper ?",
        r: "Partez de vos messages réels. Comptez ceux qui posent une vraie question, ceux qui arrivent hors des heures d'ouverture, et la langue dans laquelle ils sont écrits. Testez ensuite deux outils sur ces conversations, plutôt que de comparer des fiches produit.",
      },
    ],
    publie: true,
  },
  {
    slug: "repondre-whatsapp-la-nuit",
    titre: "Répondre aux clients sur WhatsApp la nuit et le week-end",
    ancre: "répondre sur WhatsApp la nuit",
    // événementiel/traiteur et agence de voyage : demandes concentrées le soir, le
    // week-end ou depuis l'étranger à des heures décalées.
    secteursLies: ["restaurant", "hotel", "evenementiel-traiteur", "agence-voyage"],
    enBref:
      "Les messages arrivent quand le client est libre : le soir, le dimanche, à la descente d'un vol. Trois façons de les couvrir, un message d'absence, une astreinte humaine, ou un assistant qui répond seul depuis vos informations.",
    sections: [
      {
        id: "quand",
        titre: "Quand les messages arrivent vraiment",
        paragraphes: [
          "Un client écrit quand il pense à vous, pas quand vous êtes ouvert. Le restaurant reçoit ses demandes de table pendant le service, l'hôtel à la descente d'un vol de nuit, le traiteur le dimanche soir quand la famille décide enfin de la date. L'agence de voyage, elle, reçoit des messages venus de fuseaux horaires qui ne sont pas le sien.",
          "Ces heures ont un point commun : personne n'est devant le téléphone. Or le client qui organise un événement ou cherche une chambre écrit rarement à un seul établissement. Il envoie le même message à trois ou quatre adresses et poursuit avec celle qui a répondu la première. La demande n'est pas perdue le lendemain, elle est déjà traitée ailleurs.",
        ],
      },
      {
        id: "options",
        titre: "Trois façons de couvrir la nuit",
        paragraphes: [
          "Le message d'absence de WhatsApp Business est gratuit et se règle en quelques minutes. Il annonce que vous répondrez demain, dans la langue que vous avez choisie. C'est mieux que le silence, mais le même texte part à tout le monde, et il ferme la conversation au lieu de l'ouvrir.",
          "L'astreinte humaine reste la solution la plus fine : quelqu'un lit et répond pour de vrai. Elle a un coût, et il ne baisse pas. Les outils de ce marché sont d'ailleurs facturés à la personne : Callbell, conçu pour le travail à plusieurs agents sur les mêmes conversations, facture 14 EUR par mois et par utilisateur pour son offre Gestion de chat, avec le canal WhatsApp à 50 EUR par mois en supplément.",
          "L'assistant qui répond seul est la troisième voie. Il ne dort pas, il ne coûte pas plus cher la nuit que le jour, et il travaille sur un serveur : le téléphone du responsable peut être éteint. En contrepartie, il ne sait que ce que contient sa fiche, et il ne remplace personne quand la conversation devient difficile.",
        ],
      },
      {
        id: "conclure",
        titre: "Ce qu'un assistant conclut à 23h, et ce qu'il laisse au matin",
        paragraphes: [
          "À 23h, Wapy répond sur ce que votre fiche contient : la carte et les prix, les types de chambres, les prestations et leurs durées, les délais de livraison, les moyens de paiement acceptés. Il ne s'arrête pas à l'information : il prend la commande ou la demande de réservation, pose les questions qui manquent, confirme au client, enregistre la demande et vous envoie le récapitulatif. Avec l'option rendez-vous et un agenda connecté, il propose des créneaux réellement libres.",
          "Ce qu'il laisse au matin est tout aussi net. Une réclamation, un litige ou un client qui demande explicitement à parler à quelqu'un déclenchent un passage de main : la conversation vous attend, et personne n'y répondra avant l'ouverture. Une information absente de la fiche ne le fait pas sonner chez vous non plus : il dit qu'il se renseigne et que quelqu'un reviendra vers le client, plutôt que d'inventer une disponibilité.",
          "Deux autres limites méritent d'être connues avant la première nuit. Ses réponses sont en français, la seule langue prévue à ce jour, y compris face à un message écrit dans une autre langue. Et sans l'option de transcription, il n'écoute pas les notes vocales : il remercie le client et lui demande d'écrire sa demande en quelques mots.",
        ],
      },
      {
        id: "preparer",
        titre: "Préparer la fiche avant la première nuit",
        paragraphes: [
          "La qualité des réponses nocturnes se joue dans la fiche, pas dans le réglage. Les questions qui tombent à 23h sont les plus banales : est-ce que vous êtes ouvert demain, combien coûte la formule, est-ce que vous livrez dans ce quartier, à partir de combien de personnes. Chacune trouve sa réponse si elle est écrite quelque part.",
          "Les consignes servent au reste. Vous pouvez indiquer quoi faire d'une demande de devis, quel lien envoyer pour une réservation de groupe, ou à quel moment orienter vers un rappel le lendemain. Ce sont des instructions données à l'assistant, suivies dans la très grande majorité des cas, pas un verrou technique : relisez ses premières nuits avant de le laisser seul.",
        ],
      },
    ],
    tableau: {
      colonnes: [
        { cle: "solution", libelle: "Solution" },
        { cle: "client", libelle: "Ce que reçoit le client à 23h" },
        { cle: "matin", libelle: "Ce que vous retrouvez le matin" },
      ],
      lignes: [
        {
          solution: "Message d'absence WhatsApp Business",
          client: "Un texte identique pour tous, qui annonce un délai",
          matin: "Le fil de messages à dépouiller à la main",
        },
        {
          solution: "Astreinte humaine ou boîte partagée",
          client: "Une vraie réponse, si quelqu'un est de garde",
          matin: "Les conversations traitées, et des heures à payer",
        },
        {
          solution: "Assistant Wapy",
          client: "Une réponse tirée de votre fiche, et sa demande enregistrée",
          matin: "Le récapitulatif des commandes et réservations, et les cas passés à un humain",
        },
      ],
      legende:
        "Le tarif Callbell cité dans cette page provient de sa page tarifs, relevée le 11 août 2026. Comparatif édité par Wapy.",
    },
    faq: [
      {
        q: "Peut-on vraiment répondre sur WhatsApp la nuit sans embaucher ?",
        r: "Oui, à condition d'accepter que la réponse vienne de vos informations et non d'une personne. Wapy répond depuis la fiche que vous remplissez, enregistre les commandes et les réservations et vous envoie le récapitulatif. Les cas sensibles, eux, attendent l'ouverture.",
      },
      {
        q: "Faut-il laisser son téléphone allumé la nuit ?",
        r: "Non. L'assistant tourne sur un serveur, pas sur votre téléphone : celui-ci peut être éteint ou hors réseau sans interrompre les réponses. La connexion au compte WhatsApp se fait une fois, en scannant un QR code depuis les appareils connectés.",
      },
      {
        q: "Que se passe-t-il si le client pose une question imprévue ?",
        r: "Si la fiche ne contient pas l'information et qu'aucune consigne ne la couvre, l'assistant répond qu'il se renseigne et que quelqu'un reviendra vers le client, ou pose une question de précision. Il n'invente ni prix ni disponibilité, et il ne vous réveille pas pour autant.",
      },
      {
        q: "Un client mécontent à 2h du matin obtient-il une réponse ?",
        r: "Il obtient une réponse polie, puis la conversation vous est passée : réclamation, litige et sujet sensible font partie des cas rares où l'assistant s'arrête. Personne n'y répondra avant l'ouverture, c'est la limite assumée de ce fonctionnement.",
      },
      {
        q: "L'assistant répond-il aussi le dimanche et les jours fériés ?",
        r: "Oui, il ne distingue pas les jours. Ce sont vos horaires, écrits dans la fiche, qui lui permettent de dire si vous êtes ouvert. Un traiteur ou une agence de voyage peut ainsi recueillir une demande le dimanche soir et la traiter le lundi matin.",
      },
      {
        q: "Et les messages vocaux envoyés tard le soir ?",
        r: "Sans l'option de transcription, l'assistant n'écoute pas les notes vocales : il remercie le client et lui demande d'écrire sa demande en quelques mots. Avec l'option activée, la note est transcrite avant d'être traitée comme un message écrit.",
      },
    ],
    publie: true,
  },
  {
    slug: "meilleur-chatbot-whatsapp-afrique-2026",
    titre: "Meilleur chatbot WhatsApp en Afrique en 2026 : le comparatif",
    ancre: "meilleur chatbot WhatsApp en Afrique",
    // Comparatif généraliste : couvre les 11 secteurs du silo métier, sans
    // exception. C'est cohérent avec son sujet, un tour d'horizon et non un
    // cas d'usage unique, et la section « metiers » ci-dessous nomme
    // réellement les onze, pour que ces liens ne soient pas artificiels.
    secteursLies: [
      "restaurant",
      "salon-de-beaute",
      "boutique",
      "hotel",
      "clinique-pharmacie",
      "immobilier",
      "ecole",
      "artisan",
      "agence-voyage",
      "evenementiel-traiteur",
      "garage-auto",
    ],
    enBref:
      "Il n'existe pas un meilleur chatbot WhatsApp en Afrique, mais un meilleur choix par situation. Quatre critères départagent les cinq outils comparés ici : la monnaie de facturation, la langue de vos clients, le nombre de personnes qui répondent, et l'envoi en nombre.",
    sections: [
      {
        id: "methode",
        titre: "Comment ce comparatif est établi",
        paragraphes: [
          `Chaque caractéristique citée ici a été relevée le ${RELEVE_LE} sur le site de son éditeur, et rien d'autre n'est publié. Aucun tarif n'est reconstitué de mémoire, aucune fonction n'est déduite d'un positionnement. Les prix bougent : vérifiez-les à la source avant de décider.`,
          "Deux choses que ce comparatif n'est pas. Ce n'est pas un test en conditions réelles : aucun de ces outils n'a été mis en production chez un client pour l'occasion, ce sont des offres qui sont comparées, pas des performances mesurées. Et ce n'est pas une source neutre : il est édité par Wapy, qui figure dans le classement. Lisez-le comme tel, et retenez surtout les points où un concurrent fait mieux que nous, ce sont les plus utiles.",
        ],
      },
      {
        id: "outils",
        titre: "Les cinq outils, et ce que chacun fait de mieux",
        paragraphes: [
          "Wapy est un assistant qui répond seul sur le compte WhatsApp déjà utilisé par l'entreprise, à partir d'une fiche qu'elle remplit. Il mène les demandes jusqu'à leur enregistrement, prévient le responsable, répond aussi sur le chat du site web avec l'option prévue, et facture en francs CFA après sept jours d'essai. Ce qu'il ne fait pas est aussi net : français uniquement, pas d'API officielle Meta donc pas d'envoi en nombre, et aucun encaissement des paiements de vos clients.",
          "NéoBot est l'outil le plus proche du nôtre, et sur plusieurs points il va plus loin. Son éditeur indique qu'il est « développé à Yaoundé » et affiche « Made in Cameroon ». Son assistant est annoncé en français et en anglais, et il « comprend le pidgin camerounais » : Wapy, lui, ne répond qu'en français. Son tarif est publié directement en francs CFA, 20 000 FCFA par mois, avec paiement annoncé par Orange Money, MTN, Wave et Stripe, et un essai de 14 jours sans carte bancaire, soit le double du nôtre. Sa formule publiée est plafonnée à 3 000 messages WhatsApp par mois et 1 agent IA actif, sa base de connaissance bornée à 3 fichiers PDF, et son support annoncé « par email ».",
          "Botnation AI est un éditeur français de chatbots no-code, avec une adresse à Paris et une ligne de support français publiées. Sa solution repose « sur l'API officielle WhatsApp Business » selon sa FAQ, il annonce des données « hébergées sur notre plateforme, sous juridiction française et européenne » et une conformité RGPD, une formule d'entrée gratuite pour créer et tester, et un chatbot déployable au-delà de WhatsApp, sur Messenger, Instagram et site web. Ses tarifs sont publiés en euros uniquement, et le coût des messages facturés par Meta s'ajoute à l'abonnement, l'éditeur annonçant « deux coûts distincts ».",
          "Callbell répond à un besoin que les autres ne traitent pas : plusieurs personnes qui répondent aux mêmes conversations. Il centralise WhatsApp Business, Messenger, Instagram Direct et Telegram dans une même boîte de réception, son site, son offre et ses tarifs sont entièrement en français, et l'éditeur se déclare « une entreprise SaaS fondée à Paris en 2019 ». Un compte gratuit est annoncé à 0 EUR par mois. La facturation se fait ensuite par utilisateur et par mois, en euros, le canal WhatsApp coûte 50 EUR par mois en supplément, la création de bots 20 EUR et les campagnes 59 EUR, avec un engagement minimum de 3 mois annoncé.",
          "LAfricaMobile est un opérateur de messagerie professionnelle, dont le siège social est publié à Dakar, Immeuble CFI, 11 Rue Vincens. Il annonce une assistance téléphonique sur un numéro sénégalais du lundi au dimanche de 08h à 23h (GMT), une certification ISO 27001, et une gamme qui dépasse largement WhatsApp : Push SMS, Pull SMS, USSD, Push Vocal, Airtime et paiement. Aucun tarif n'est publié, sa page Pricing étant un formulaire « Demandez un devis », et aucune formule en libre-service n'est annoncée pour WhatsApp.",
        ],
      },
      {
        id: "metiers",
        titre: "Le besoin n'est pas le même d'un métier à l'autre",
        paragraphes: [
          "Restaurants, boutiques et salons de beauté partagent le même rythme : les questions arrivent pendant le service ou pendant une pose, quand personne ne peut décrocher. Une carte, une taille disponible, la durée et le prix d'une prestation suffisent à y répondre, à condition que la fiche les contienne. Ici, un assistant qui répond seul rend plus de service qu'une boîte de réception partagée.",
          "Hôtels, agences de voyage et traiteurs se jouent sur la comparaison : le client écrit à quatre établissements et réserve chez celui qui annonce un tarif clair et une disponibilité. Cliniques et pharmacies sont à l'opposé : les questions y touchent à la santé, et il vaut mieux un assistant qui dit se renseigner qu'un outil qui avance une disponibilité de produit qu'il n'a pas.",
          "Agences immobilières, écoles et centres de formation, artisans et garages automobiles ont en commun des demandes qui ne se règlent pas en un message : un bien à visiter, des frais de scolarité et un dossier d'inscription, un devis à chiffrer, un diagnostic à poser. Dans ces métiers, l'assistant sert surtout à recueillir ce qu'il faut pour rappeler utilement, plutôt qu'à conclure seul.",
          "Ce découpage vaut plus que n'importe quel classement général : un outil pensé pour des campagnes de notifications à grande échelle et un assistant qui répond aux messages reçus ne rendent pas le même service à un garage de quartier.",
        ],
      },
      {
        id: "choisir",
        titre: "Lequel choisir selon votre situation",
        paragraphes: [
          "Si vos clients écrivent en anglais ou en pidgin, NéoBot répond à un besoin que Wapy ne couvre pas. Si plusieurs personnes doivent traiter les mêmes conversations, Callbell est construit pour cela. Si vous avez besoin d'envois en nombre ou d'un engagement écrit sur l'hébergement en Europe, Botnation AI repose sur l'API officielle et publie cet engagement. Si votre besoin dépasse WhatsApp, avec du SMS, de l'USSD ou du vocal, LAfricaMobile couvre cette gamme.",
          "Wapy vise un cas plus étroit : une entreprise d'Afrique francophone qui reçoit ses demandes en français sur WhatsApp, veut y répondre en permanence sans équipe technique, et veut que les commandes et les réservations soient enregistrées plutôt que dispersées dans un fil. Sept jours d'essai suffisent à savoir si c'est votre cas.",
        ],
      },
    ],
    tableau: {
      colonnes: [
        { cle: "outil", libelle: "Outil" },
        { cle: "forts", libelle: "Points forts" },
        { cle: "limites", libelle: "Limites" },
        { cle: "tarif", libelle: "Tarif publié" },
      ],
      lignes: [
        {
          outil: "Wapy",
          forts: WAPY_FORTS,
          limites: WAPY_LIMITES,
          tarif: WAPY_TARIF,
        },
        ...CONCURRENTS.map((c) => ({
          outil: c.nom,
          forts: c.pointsForts.join(" ; "),
          limites: c.pointsFaibles.join(" ; "),
          tarif: c.tarifIndicatif,
        })),
      ],
      legende: `Points forts, limites et tarifs des quatre éditeurs tiers relevés sur leurs sites le ${RELEVE_LE}, sans reformulation. La ligne Wapy est renseignée par nous, qui éditons ce comparatif.`,
    },
    faq: [
      {
        q: "Quel est le meilleur chatbot WhatsApp en Afrique en 2026 ?",
        r: "Aucun ne l'est pour tout le monde. Le choix se joue sur quatre critères : la monnaie dans laquelle vous payez, la langue de vos clients, le nombre de personnes qui répondent, et le besoin d'envoyer des messages en nombre. Chaque outil de ce comparatif gagne sur au moins un.",
      },
      {
        q: "Quel outil si mes clients n'écrivent pas qu'en français ?",
        r: "NéoBot. Son assistant est annoncé en français et en anglais, et il comprend le pidgin camerounais. Wapy ne répond qu'en français, quelle que soit la langue reçue. Sur ce point précis, notre outil est le moins adapté du comparatif.",
      },
      {
        q: "Faut-il passer par l'API officielle WhatsApp Business ?",
        r: "Seulement si vous envoyez des messages en nombre. Botnation AI repose dessus et LAfricaMobile propose de l'intégrer. Wapy s'en passe : la connexion se fait en scannant un QR code depuis le compte existant, sans coût de message ajouté par Meta, mais sans campagne possible.",
      },
      {
        q: "Peut-on payer son abonnement en francs CFA ?",
        r: "Chez NéoBot, oui : 20 000 FCFA par mois pour sa formule Essential, avec paiement annoncé par Orange Money, MTN, Wave et Stripe. Chez Wapy aussi, la facturation est en francs CFA. Botnation AI et Callbell publient leurs tarifs en euros uniquement.",
      },
      {
        q: "Quel outil pour une équipe de plusieurs personnes ?",
        r: "Callbell, qui est pensé pour le travail à plusieurs agents sur les mêmes conversations et centralise aussi Messenger, Instagram Direct et Telegram. Sa facturation par utilisateur suit la taille de l'équipe. Wapy, lui, est construit autour d'un assistant qui répond seul.",
      },
      {
        q: "Et si j'ai besoin de SMS ou d'USSD en plus de WhatsApp ?",
        r: "LAfricaMobile couvre cette gamme : Push SMS, Pull SMS, USSD, Push Vocal, Airtime et paiement, avec un siège publié à Dakar et une assistance téléphonique sénégalaise. Wapy ne fait que WhatsApp et, avec l'option prévue, le chat du site web.",
      },
      {
        q: "Combien de temps peut-on tester avant de payer ?",
        r: "NéoBot annonce 14 jours sans carte bancaire. Botnation AI propose une formule d'entrée gratuite pour créer et tester, Callbell un compte gratuit à 0 EUR par mois. Wapy propose 7 jours. Chez LAfricaMobile, les crédits offerts à l'inscription ne couvrent pas WhatsApp.",
      },
      {
        q: "Ce comparatif est-il neutre ?",
        r: "Non, et il vaut mieux le dire : il est édité par Wapy, qui y figure. C'est pour cela que chaque caractéristique des autres éditeurs est reprise de leur site, à la date du relevé, et que les points où ils font mieux que nous sont écrits noir sur blanc.",
      },
    ],
    publie: true,
  },
];

/**
 * Part rédigée des pages `wapy-vs-*`.
 *
 * Tout le reste de ces pages est construit depuis `CONCURRENTS`. Ce qui est
 * écrit à la main tient ici, et chaque phrase portant sur le concurrent
 * paraphrase un champ précis de sa fiche, rappelé en commentaire. Une
 * caractéristique absente de la fiche n'a pas sa place ici, même si elle
 * ferait un bon point de comparaison.
 */
type Nuance = {
  /** Résumé pour l'encart « En bref », moins de 50 mots. */
  enBref: string;
  /** Ce que le concurrent fait mieux. Au moins un paragraphe, obligatoirement. */
  avantages: string[];
  /** La contrepartie côté Wapy : ce que nous ne faisons pas. */
  contrepartie: string;
  /** Phrase de décision, en tête de la section « Comment trancher ». */
  trancher: string;
  faq: QuestionReponse[];
};

const NUANCES: Record<string, Nuance> = {
  neobot: {
    enBref:
      "NéoBot est un assistant IA WhatsApp développé à Yaoundé pour les PME africaines. Wapy vise le même besoin, avec un assistant qui répond depuis la fiche de l'établissement. Sur les langues, NéoBot va plus loin que nous.",
    avantages: [
      // pointsForts[3] (langues), pointsForts[4] (essai 14 jours sans carte),
      // pointsForts[1] (tarif publié en FCFA).
      "Sur trois points au moins, NéoBot répond à des besoins que Wapy ne couvre pas. Son assistant est annoncé en français et en anglais, et il « comprend le pidgin camerounais » : si une partie de vos clients écrit ainsi, la question est réglée avant même de comparer le reste, puisque Wapy ne répond qu'en français. Son essai dure 14 jours sans carte bancaire, contre sept jours chez nous. Et son tarif d'entrée est publié directement en francs CFA, sans conversion, à 20 000 FCFA par mois.",
      // pointsForts[0] (éditeur camerounais), pointsForts[2] (moyens de paiement),
      // pointsForts[4] (inscription en libre-service).
      "L'éditeur est camerounais et l'assume : « NéoBot est développé à Yaoundé », et le pied de page de sa page comparative porte la mention « Made in Cameroon ». Le paiement est annoncé par Orange Money, MTN, Wave et Stripe, et l'inscription se fait en libre-service depuis le site. Pour une PME d'Afrique centrale, ce sont des arguments concrets, pas des slogans.",
    ],
    contrepartie:
      "De notre côté, Wapy répond en français uniquement, y compris à un message écrit dans une autre langue, et son essai dure sept jours. Il se connecte au compte WhatsApp que vous utilisez déjà en scannant un QR code, répond depuis la fiche que vous remplissez, mène réservations et commandes jusqu'à leur enregistrement avant de vous notifier, et répond aussi sur le chat de votre site web avec l'option prévue à cet effet. Il n'encaisse pas les paiements de vos clients et n'envoie ni campagne ni message en nombre.",
    trancher:
      "La langue tranche presque seule. Si vos clients vous écrivent en anglais ou en pidgin, prenez NéoBot : Wapy ne saura pas leur répondre. Si vos conversations sont en français, comparez plutôt les bornes de la formule, l'ergonomie de la fiche et ce que chacun sait conclure sans vous.",
    faq: [
      {
        q: "NéoBot convient-il mieux que Wapy dans certains cas ?",
        r: "Oui. Son assistant est annoncé en français et en anglais, et il comprend le pidgin camerounais. Si vos clients écrivent dans ces langues, il répond à un besoin que Wapy ne couvre pas : nos réponses sont en français uniquement, quelle que soit la langue reçue.",
      },
      {
        q: "Lequel se teste le plus longtemps gratuitement ?",
        r: "NéoBot. Il annonce 14 jours d'essai sans carte bancaire, avec inscription en libre-service depuis son site. Wapy propose sept jours. Dans les deux cas, l'essai ne vaut que s'il se fait sur vos vraies conversations et non sur un scénario de démonstration.",
      },
      {
        q: "Peut-on payer en francs CFA chez l'un comme chez l'autre ?",
        r: "Oui. NéoBot publie 20 000 FCFA par mois pour sa formule Essential et annonce le paiement par Orange Money, MTN, Wave et Stripe. Wapy facture également en francs CFA. C'est ce qui distingue ces deux offres des éditeurs européens du marché.",
      },
      {
        q: "Y a-t-il une limite de messages chez NéoBot ?",
        r: "Sa formule publiée est plafonnée à 3 000 messages WhatsApp par mois et 1 agent IA actif, avec une base de connaissance bornée à 3 fichiers PDF et un support annoncé par email. Ces bornes figurent sur son site, relevées le 11 août 2026.",
      },
      {
        q: "Le tarif de 10 000 FCFA par mois est-il le prix courant ?",
        r: "Non. NéoBot le présente comme une « offre fondateur » réservée à 10 places. Le tarif publié de sa formule Essential est de 20 000 FCFA par mois, après 14 jours d'essai gratuit sans carte. Vérifiez à la source : ces montants bougent.",
      },
      {
        q: "Que fait Wapy, concrètement ?",
        r: "Il se connecte au compte WhatsApp que vous utilisez déjà en scannant un QR code, répond aux messages reçus depuis une fiche que vous remplissez, pose les questions manquantes, confirme au client, enregistre la commande ou la réservation et vous envoie le récapitulatif.",
      },
    ],
  },
  "botnation-ai": {
    enBref:
      "Botnation AI est un éditeur français de chatbots no-code dont la solution repose sur l'API officielle WhatsApp Business. Wapy se connecte au compte existant par QR code, répond en français depuis votre fiche, et facture en francs CFA.",
    avantages: [
      // pointsForts[1] (API officielle), pointsForts[2] (hébergement et RGPD).
      "Botnation AI apporte deux choses que Wapy n'a pas. D'abord l'API officielle WhatsApp Business, sur laquelle repose sa solution selon la FAQ de l'éditeur : c'est la voie prévue par Meta, celle qui ouvre les envois en nombre. Ensuite un engagement écrit sur l'hébergement, avec des données « hébergées sur notre plateforme, sous juridiction française et européenne » et une conformité RGPD annoncée. Nous ne publions pas d'engagement équivalent.",
      // pointsForts[0] (adresse et support français), pointsForts[3] (entrée
      // gratuite), pointsForts[4] (multi-canal).
      "L'éditeur est établi en France, avec une adresse à Paris et une ligne de support français publiées sur son site. Sa formule d'entrée est gratuite pour créer et tester avant tout abonnement, et son chatbot se déploie au-delà de WhatsApp, sur Messenger, Instagram et site web. Une entreprise qui reçoit ses messages sur plusieurs réseaux y trouvera une couverture que Wapy n'offre pas.",
    ],
    contrepartie:
      "Wapy ne passe pas par l'API officielle Meta : la connexion se fait en scannant un QR code depuis le compte WhatsApp existant, sans changement de numéro. Cela évite le coût par message facturé par Meta, mais écarte l'envoi en nombre et les campagnes, et le bot ignore les groupes comme les diffusions. Il répond en français uniquement, sur WhatsApp et, avec l'option prévue, sur le chat de votre site web. Ni Messenger ni Instagram ne sont couverts.",
    trancher:
      "Si l'API officielle, les campagnes ou un engagement écrit sur l'hébergement en Europe font partie de vos exigences, Botnation AI y répond et Wapy non. Si vous voulez surtout que les messages reçus obtiennent une vraie réponse, en francs CFA et sans coût par message, la question se pose dans l'autre sens.",
    faq: [
      {
        q: "Botnation AI convient-il mieux que Wapy dans certains cas ?",
        r: "Oui. Sa solution repose sur l'API officielle WhatsApp Business, et il annonce des données hébergées sous juridiction française et européenne avec une conformité RGPD. Si l'API officielle ou cet engagement d'hébergement figurent dans votre cahier des charges, il y répond, pas nous.",
      },
      {
        q: "Wapy utilise-t-il l'API officielle WhatsApp Business ?",
        r: "Non. La connexion se fait en scannant un QR code depuis le compte WhatsApp que vous utilisez déjà, sans changement de numéro. Il n'y a donc pas de coût par message facturé par Meta, mais pas d'envoi en nombre ni de campagne non plus.",
      },
      {
        q: "Quelle différence de coût entre les deux ?",
        r: "Botnation AI publie ses tarifs en euros uniquement : gratuit pour créer et tester, puis à partir de 39 EUR par mois, hors messages facturés par Meta, l'éditeur annonçant « deux coûts distincts ». Wapy facture un abonnement mensuel en francs CFA, après sept jours d'essai.",
      },
      {
        q: "Peut-on répondre ailleurs que sur WhatsApp ?",
        r: "Botnation AI annonce un chatbot déployable sur Messenger, Instagram et site web en plus de WhatsApp. Wapy répond sur WhatsApp et, avec l'option prévue à cet effet, sur le chat de votre site. Messenger et Instagram ne sont pas couverts.",
      },
      {
        q: "Peut-on tester sans payer chez l'un et chez l'autre ?",
        r: "Oui. Botnation AI propose une formule d'entrée gratuite pour créer et tester avant tout abonnement. Wapy propose sept jours d'essai. Dans les deux cas, jugez sur vos conversations réelles plutôt que sur une comparaison de fiches produit.",
      },
      {
        q: "En quelle langue chacun répond-il ?",
        r: "Le site de Botnation AI est publié en français et en anglais ; la langue de ses réponses dépend de la configuration du chatbot et se vérifie auprès de l'éditeur. Wapy, lui, répond en français uniquement, quelle que soit la langue du message reçu.",
      },
    ],
  },
  callbell: {
    enBref:
      "Callbell centralise WhatsApp Business, Messenger, Instagram Direct et Telegram dans une boîte de réception partagée entre agents. Wapy ne répartit pas les conversations entre plusieurs personnes : il y répond seul, depuis la fiche de l'établissement.",
    avantages: [
      // positionnement (citation), pointsForts[2] et [3] (multi-canal, multi-agents).
      "Callbell résout un problème que Wapy ne traite pas. Il se présente comme « le seul outil qui vous permet de centraliser tous les messages de Whatsapp Business, Facebook Messenger, Instagram Direct et Telegram dans une seule plateforme », et il est pensé pour le travail à plusieurs agents sur les mêmes conversations. Dès que trois personnes répondent au même compte, c'est ce genre d'outil qu'il faut, pas un assistant.",
      // pointsForts[0] (français), [1] (Paris 2019), [4] (compte gratuit).
      "Son site, son offre et ses tarifs sont entièrement disponibles en français, l'éditeur se déclare « une entreprise SaaS fondée à Paris en 2019 », et un compte gratuit est annoncé à 0 EUR par mois pour démarrer. Rien n'oblige à choisir tout de suite : la version gratuite permet de voir si la boîte partagée correspond à votre organisation.",
    ],
    contrepartie:
      "Wapy n'est pas une boîte de réception partagée. Quand l'assistant passe la main, la conversation apparaît dans le tableau de bord et vous y répondez depuis le web : c'est un point de reprise, pas un outil de répartition entre agents. En contrepartie, l'assistant traite lui-même l'essentiel des messages, enregistre commandes et réservations et vous notifie, sans facturation à la personne. Il répond en français uniquement, sur WhatsApp et sur le chat du site web avec l'option prévue.",
    trancher:
      "Comptez les personnes qui répondent. À plusieurs sur les mêmes conversations, Callbell est fait pour cela et Wapy ne le remplacera pas. Seul ou à deux, la vraie question est plutôt de savoir combien de messages méritent qu'un humain les lise, et ce que ferait un assistant du reste.",
    faq: [
      {
        q: "Callbell convient-il mieux que Wapy dans certains cas ?",
        r: "Oui. Si plusieurs personnes doivent répondre aux mêmes conversations, c'est exactement ce pour quoi Callbell est pensé, et il centralise en plus Messenger, Instagram Direct et Telegram. Wapy est construit autour d'un assistant qui répond seul.",
      },
      {
        q: "Quelle différence d'approche entre les deux ?",
        r: "Callbell organise le travail humain : les messages arrivent dans une boîte partagée et des agents y répondent. Wapy répond à leur place, depuis la fiche de l'établissement, et ne passe la main que dans les cas rares où un humain est indispensable.",
      },
      {
        q: "Comment le coût évolue-t-il chez Callbell ?",
        r: "Il suit la taille de l'équipe : 14 EUR par mois et par utilisateur pour l'offre Gestion de chat, 18 EUR pour Gestion de chat Plus, plus 50 EUR par mois pour le canal WhatsApp, avec un engagement minimum de 3 mois annoncé sur sa page tarifs.",
      },
      {
        q: "Faut-il payer en plus pour les bots chez Callbell ?",
        r: "Sa page tarifs annonce la création de bots comme un module facturé 20 EUR par mois, et les campagnes WhatsApp comme un module à 59 EUR par mois. Chez Wapy, l'assistant est le produit lui-même : il n'y a pas de module à ajouter pour qu'il réponde.",
      },
      {
        q: "Peut-on reprendre la main sur une conversation avec Wapy ?",
        r: "Oui. Quand l'assistant passe la main, la conversation remonte dans le tableau de bord et vous répondez depuis le web. Ce n'est pas une boîte partagée entre agents : c'est un point de reprise, prévu pour les cas où l'assistant s'arrête.",
      },
      {
        q: "Peut-on démarrer gratuitement chez l'un et chez l'autre ?",
        r: "Callbell annonce un compte gratuit à 0 EUR par mois pour démarrer. Wapy propose sept jours d'essai. Les deux se jugent sur vos vraies conversations, et sur le temps que vous passez réellement à répondre chaque jour.",
      },
    ],
  },
  lafricamobile: {
    enBref:
      "LAfricaMobile est un opérateur de messagerie professionnelle basé à Dakar, qui intègre WhatsApp Business Platform et vend aussi du SMS, de l'USSD et du vocal. Wapy ne fait qu'une chose : répondre aux messages reçus.",
    avantages: [
      // pointsForts[0] (siège Dakar), [1] (assistance téléphonique), [4] (ISO 27001).
      "LAfricaMobile apporte ce qu'un éditeur de logiciel apporte rarement. Son siège social est publié à Dakar, Immeuble CFI, 11 Rue Vincens. Son assistance téléphonique se fait sur un numéro sénégalais, annoncée du lundi au dimanche de 08h à 23h (GMT), et une certification ISO 27001 est affichée sur son site. Pour une entreprise qui veut un interlocuteur joignable au téléphone dans son fuseau horaire, cela pèse plus que n'importe quelle fonction.",
      // pointsForts[3] (gamme multicanale), positionnement (citation),
      // pointsForts[2] (site et parcours en français).
      "Sa gamme dépasse largement WhatsApp : Push SMS, Pull SMS, USSD, Push Vocal, Airtime et paiement, avec un site et un parcours de devis en français. Sa page WhatsApp propose d'« intégrer WhatsApp Business Platform pour automatiser les conversations, envoyer des notifications, recueillir des réponses et gérer vos relations client à grande échelle ». Si votre besoin est d'atteindre beaucoup de monde, c'est de ce côté qu'il faut regarder.",
    ],
    contrepartie:
      "Wapy n'envoie pas de notifications en nombre : il répond aux messages reçus, un par un, depuis la fiche de l'établissement, et ignore les groupes comme les diffusions. Il ne propose ni SMS, ni USSD, ni vocal, ne publie pas de certification ISO 27001 et n'annonce pas d'assistance téléphonique. En échange, tout se fait depuis le site : compte créé en ligne, fiche remplie dans le tableau de bord, compte WhatsApp connecté en scannant un QR code, sept jours d'essai.",
    trancher:
      "Le partage est net. Pour émettre vers beaucoup de monde, sur plusieurs canaux, avec un interlocuteur au téléphone, LAfricaMobile couvre un terrain que nous ne couvrons pas. Pour répondre aux messages qui arrivent, sans passer par un conseiller ni attendre un devis, Wapy s'ouvre le jour même.",
    faq: [
      {
        q: "LAfricaMobile convient-il mieux que Wapy dans certains cas ?",
        r: "Oui. Si vous avez besoin de SMS, d'USSD, de vocal ou d'Airtime en plus de WhatsApp, il couvre cette gamme et Wapy non. Il publie aussi une assistance téléphonique sénégalaise annoncée de 08h à 23h (GMT), sept jours sur sept, et une certification ISO 27001.",
      },
      {
        q: "Combien coûte LAfricaMobile ?",
        r: "L'éditeur ne publie aucun tarif : sa page Pricing est un formulaire « Demandez un devis », et aucune formule en libre-service n'est annoncée pour WhatsApp. Il faut donc passer par un conseiller pour connaître le prix. Wapy s'ouvre depuis le site, avec sept jours d'essai.",
      },
      {
        q: "Les crédits offerts à l'inscription couvrent-ils WhatsApp ?",
        r: "Non. Les crédits de test annoncés à l'inscription portent sur 10 SMS, 10 sessions USSD, 10 messages vocaux et 100 XOF d'Airtime. WhatsApp n'en fait pas partie. C'était le cas au relevé du 11 août 2026 ; vérifiez à la source avant de vous engager.",
      },
      {
        q: "Les deux sont-ils implantés en Afrique ?",
        r: "LAfricaMobile publie son siège social à Dakar et se présente comme « la 1ère plateforme de communication et de marketing mobile en Afrique ». Wapy est conçu pour l'Afrique francophone, facture en francs CFA et publie des pages dédiées au Bénin, à la Côte d'Ivoire, au Sénégal, au Cameroun et au Togo.",
      },
      {
        q: "Quelle différence d'usage au quotidien ?",
        r: "Sa page WhatsApp parle d'automatiser les conversations, d'envoyer des notifications et de gérer la relation client à grande échelle. Wapy répond aux messages reçus, un par un, depuis votre fiche, et n'envoie ni campagne ni message en nombre.",
      },
      {
        q: "Peut-on commencer seul, sans parler à un commercial ?",
        r: "Chez LAfricaMobile, aucune formule en libre-service n'est annoncée pour WhatsApp : il faut passer par un conseiller. Chez Wapy, le compte se crée depuis le site, la fiche se remplit dans le tableau de bord, et la connexion se fait en scannant un QR code.",
      },
    ],
  },
};

/** Minuscule initiale, pour enchaîner une liste de champs dans une phrase. */
function minuscule(texte: string): string {
  return texte.charAt(0).toLowerCase() + texte.slice(1);
}

/**
 * Construit la page `wapy-vs-<slug>` d'un concurrent.
 *
 * Les cellules du tableau et la première section reprennent les champs de la
 * fiche sans reformulation : c'est ce qui garantit qu'aucune caractéristique
 * publiée ici n'a été inventée. L'absence de nuance rédigée est une erreur de
 * contenu, pas un cas à traiter en silence, d'où l'exception.
 */
function pageVs(c: Concurrent): Comparatif {
  const n = NUANCES[c.slug];
  if (!n) {
    throw new Error(
      `Aucune nuance rédigée pour le concurrent « ${c.slug} » : la page wapy-vs-${c.slug} serait publiée sans contenu comparatif.`,
    );
  }
  return {
    slug: `wapy-vs-${c.slug}`,
    titre: `Wapy ou ${c.nom} : lequel choisir en Afrique francophone`,
    ancre: `Wapy comparé à ${c.nom}`,
    secteursLies: ["restaurant", "boutique"],
    enBref: n.enBref,
    sections: [
      {
        id: "positionnement",
        titre: "Deux positionnements différents",
        paragraphes: [
          `${c.nom}, tel que son éditeur le décrit : ${minuscule(c.positionnement)}`,
          "Wapy répond à un besoin plus étroit : une entreprise d'Afrique francophone qui reçoit ses demandes sur WhatsApp et veut y répondre en permanence, sans équipe technique. L'assistant lit la fiche remplie par l'établissement, répond aux questions, conclut les réservations et les commandes, puis prévient le responsable.",
        ],
      },
      {
        id: "avantages",
        titre: `Ce que ${c.nom} fait mieux`,
        paragraphes: n.avantages,
      },
      {
        id: "limites",
        titre: "Ce que chacun ne fait pas",
        paragraphes: [
          `${c.nom} publie lui-même les bornes de son offre : ${c.pointsFaibles.map(minuscule).join(" ; ")}. Ce sont des constats relevés sur son site le ${RELEVE_LE}, pas des reproches, et ils vieillissent : vérifiez-les avant de décider.`,
          n.contrepartie,
        ],
      },
      {
        id: "choisir",
        titre: "Comment trancher",
        paragraphes: [
          n.trancher,
          "Un restaurant ou une boutique qui reçoit ses commandes sur WhatsApp n'a pas les mêmes besoins qu'un service client à plusieurs agents : dans le premier cas, l'essentiel est qu'une réponse parte tout de suite et que la commande soit enregistrée quelque part. C'est le terrain de Wapy, et sept jours d'essai suffisent à vérifier si c'est le vôtre.",
        ],
      },
    ],
    tableau: {
      colonnes: [
        { cle: "critere", libelle: "Critère" },
        { cle: "wapy", libelle: "Wapy" },
        { cle: "autre", libelle: c.nom },
      ],
      lignes: [
        { critere: "Points forts", wapy: WAPY_FORTS, autre: c.pointsForts.join(" ; ") },
        { critere: "Limites", wapy: WAPY_LIMITES, autre: c.pointsFaibles.join(" ; ") },
        { critere: "Tarif", wapy: WAPY_TARIF, autre: c.tarifIndicatif },
      ],
      legende: `Caractéristiques de ${c.nom} relevées sur ${c.url} le ${RELEVE_LE}, sans reformulation. La colonne Wapy est renseignée par nous, qui éditons ce comparatif.`,
    },
    faq: n.faq,
    publie: true,
  };
}

const VS: Comparatif[] = CONCURRENTS.map(pageVs);

export const COMPARATIFS: Comparatif[] = [...THEMATIQUES, ...VS];

export const COMPARATIFS_PUBLIES = COMPARATIFS.filter((c) => c.publie);

export function getComparatif(slug: string): Comparatif | undefined {
  return COMPARATIFS.find((c) => c.slug === slug);
}
