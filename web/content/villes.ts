import type { Ville } from "./types";

/**
 * Villes tier 1 du silo géographique, 5 par pays.
 *
 * VAGUE 1 : toutes en `publie: false`. Ces données existent pour que le moteur de
 * maillage (tâche 5) soit écrit et testé une fois pour toutes ; les pages villes
 * sortiront en vague 2.
 *
 * Règle G1, appliquée ici comme pour les pays : tout `population` pointe vers une
 * source du registre `SOURCES`, avec l'année de la collecte et sa `nature`
 * (`recensement` = dénombrement, `estimation` = projection modélisée). Aucune
 * valeur estimée par nos soins, aucune extrapolation. Une ville sans chiffre
 * officiel identifiable reste sans `population`, et c'est un cas normal.
 *
 * Toute affirmation sur ce que Wapy fait a été revérifiée dans le code :
 * - réponse uniquement depuis la fiche, sans rien inventer (brain.py:48-50) ;
 * - réponse en français, seule langue prévue (brain.py:45-47) ;
 * - commandes, réservations et devis CONCLUS par l'assistant, qui NOTIFIE le
 *   responsable sans lui passer la main (brain.py:52-66) ;
 * - passage de main limité aux cas 3a-3d (brain.py:114-128) ; une information
 *   manquante ne déclenche PAS d'escalade, l'assistant dit qu'il se renseigne
 *   (brain.py:129-133) ;
 * - connexion du compte par QR code uniquement, aucun numéro saisi (wa.py:73-79) ;
 * - créneaux calculés depuis les horaires et la durée de créneau `slot_min`, jamais
 *   depuis la durée d'une prestation (booking.py:60-88) ;
 * - rendez-vous, notes vocales, lecture des justificatifs, connecteur, widget web et
 *   comptes agents sont des OPTIONS d'abonnement (billing.py:20-64) ;
 * - aucun quota de conversations n'est affiché : billing.py en publie mais aucun
 *   code ne l'applique.
 *
 * Les consignes de fiche sont une directive de prompt adressée à un LLM : on décrit
 * ce que l'assistant suit, jamais un verrou déterministe.
 *
 * Aucune revendication de clientèle : Wapy n'a aucun client en production.
 */
export const VILLES: Ville[] = [
  // --- Bénin ---------------------------------------------------------------
  {
    slug: "cotonou",
    nom: "Cotonou",
    pays: "benin",
    region: "Littoral",
    // Pas de `population` : le seul dénombrement communal publié par l'INStaD est
    // le RGPH4 de 2013 (679 012), et le RGPH5 n'a livré aucun résultat communal. Le
    // pays lui-même est laissé sans chiffre pour cette raison (cf. pays.ts) : un
    // comptage de 2013 sous-estime trop 2026 pour être publié tel quel.
    quartiersAffaires: ["Ganhi", "Cadjèhoun", "Akpakpa", "Dantokpa"],
    secteursDominants: ["boutique", "restaurant", "salon-de-beaute"],
    tier: 1,
    enBref:
      "À Cotonou, un assistant WhatsApp répond aux clients à toute heure avec les informations de votre fiche : horaires, adresse, prix, disponibilité. Wapy se configure en quelques minutes, sans code, et conclut lui-même commandes et réservations en vous notifiant.",
    angle:
      "Cotonou concentre l'essentiel du commerce béninois, et ce commerce passe par WhatsApp. Autour de Dantokpa comme à Ganhi, un client écrit à plusieurs vendeurs en même temps et achète chez le premier qui répond. Aux heures de pointe, entre les clients au comptoir et les messages qui s'accumulent, répondre à tout devient matériellement impossible.",
    faq: [
      {
        q: "L'assistant connait-il mes horaires réels à Cotonou ?",
        r: "Il ne connait que ce que vous écrivez. Vos horaires figurent en texte libre dans les informations de votre fiche, et l'assistant les reprend tels quels sans inventer une ouverture. Un client qui écrit à deux heures du matin obtient donc l'horaire que vous avez saisi.",
      },
      {
        q: "Peut-il indiquer où se trouve ma boutique dans Cotonou ?",
        r: "Oui, si vous l'avez renseigné. Beaucoup d'adresses de Cotonou se décrivent par un repère plutôt que par un nom de rue : écrivez l'itinéraire comme vous l'expliqueriez au téléphone. L'assistant s'appuie dessus et ne compose jamais une adresse absente de la fiche.",
      },
      {
        q: "J'ai un point de vente à Ganhi et un à Akpakpa, comment faire ?",
        r: "Deux cas. Si les deux partagent le même numéro WhatsApp, décrivez les deux adresses dans les informations de la fiche. Si chacun a son numéro, il faut deux comptes distincts : une fiche et une connexion WhatsApp par numéro, sans passerelle entre elles.",
      },
      {
        q: "Le tarif est-il plus élevé à Cotonou qu'ailleurs ?",
        r: "Non, le prix ne dépend pas de la ville. L'abonnement se choisit par formule, avec des options à ajouter selon vos besoins, et démarre par sept jours d'essai gratuit. Vous testez sur vos vraies conversations avant de vous engager.",
      },
      {
        q: "Dois-je créer un nouveau numéro pour l'assistant ?",
        r: "Non. Vous liez le compte WhatsApp que vos clients utilisent déjà en scannant un QR code depuis le tableau de bord, sans saisir aucun numéro. Vos anciennes conversations restent en place, et l'assistant répond ensuite depuis le serveur, téléphone allumé ou non.",
      },
    ],
    publie: false,
  },
  {
    slug: "porto-novo",
    nom: "Porto-Novo",
    pays: "benin",
    region: "Ouémé",
    // Pas de `population` : le seul dénombrement communal publié par l'INStaD est
    // le RGPH4 de 2013 (264 320), et le RGPH5 n'a livré aucun résultat communal. Le
    // pays lui-même est laissé sans chiffre pour cette raison (cf. pays.ts) : un
    // comptage de 2013 sous-estime trop 2026 pour être publié tel quel.
    quartiersAffaires: ["Ouando", "Houinmè", "Djassin", "Tokpota"],
    secteursDominants: ["boutique", "ecole", "artisan"],
    tier: 1,
    enBref:
      "À Porto-Novo, Wapy répond sur WhatsApp aux questions courantes de vos clients : horaires, adresse, tarifs, disponibilité d'un article de votre catalogue. La fiche se remplit sans code, et l'assistant enregistre les commandes en vous prévenant.",
    angle:
      "Porto-Novo vit à deux rythmes : celui de l'administration, qui remplit les bureaux en semaine, et celui du commerce transfrontalier, qui remonte du Nigeria voisin par Sèmè-Kraké. Un commerçant du marché Ouando traite ses demandes entre deux clients au comptoir, souvent en fin de journée, quand la boutique ferme mais que le téléphone continue de vibrer.",
    faq: [
      {
        q: "Mon activité est très administrative, l'assistant sait-il expliquer un dossier ?",
        r: "Il explique ce que vous avez écrit : pièces à fournir, horaires de guichet, délais habituels. Vous pouvez aussi téléverser un document PDF ou texte, dont le contenu rejoint la fiche. Les documents longs sont tronqués, mettez donc l'essentiel en tête.",
      },
      {
        q: "Beaucoup de mes clients viennent du Nigeria et écrivent en anglais, est-ce gênant ?",
        r: "Mieux vaut le savoir avant de vous engager : l'assistant répond en français, seule langue prévue par son fonctionnement actuel. Il traitera la demande formulée en anglais, mais sa réponse partira en français. Si votre clientèle est surtout anglophone, pesez-le.",
      },
      {
        q: "Peut-il renseigner les prix pratiqués au marché Ouando ?",
        r: "Uniquement les vôtres, saisis dans un tableau dont vous choisissez les colonnes. Il ne connait aucun cours extérieur et n'annonce jamais un montant absent de votre fiche : sur un article non renseigné, il dit qu'il se renseigne plutôt que d'avancer un chiffre.",
      },
      {
        q: "Mes fournisseurs m'écrivent sur le même numéro, vont-ils recevoir des réponses ?",
        r: "Pas si vous les inscrivez dans la liste des numéros exclus. Un message venant de l'un d'eux est ignoré, sans réponse ni enregistrement. C'est utile pour vos fournisseurs de la frontière comme pour vos proches, dont les messages ne sont pas des demandes de clients.",
      },
      {
        q: "Combien de temps faut-il pour démarrer à Porto-Novo ?",
        r: "Quelques minutes. Vous décrivez votre activité, l'IA propose une première fiche, vous corrigez ce qui doit l'être, puis vous scannez le QR code. La génération assistée est limitée à trois utilisations par mois : le vrai travail reste d'écrire ce que vous répétez déjà.",
      },
    ],
    publie: false,
  },
  {
    slug: "parakou",
    nom: "Parakou",
    pays: "benin",
    region: "Borgou",
    // Pas de `population` : le seul dénombrement communal publié par l'INStaD est
    // le RGPH4 de 2013 (255 478), et le RGPH5 n'a livré aucun résultat communal. Le
    // pays lui-même est laissé sans chiffre pour cette raison (cf. pays.ts) : un
    // comptage de 2013 sous-estime trop 2026 pour être publié tel quel.
    quartiersAffaires: ["Arzèkè", "Dépôt", "Zongo", "Titirou"],
    secteursDominants: ["garage-auto", "hotel", "boutique"],
    tier: 1,
    enBref:
      "À Parakou, Wapy tient la conversation WhatsApp de votre activité : prestations, tarifs de base, délais, adresse. L'assistant recueille les demandes de devis avec les informations que vous exigez, puis vous les transmet prêtes à chiffrer.",
    angle:
      "Parakou est la porte du nord béninois : le corridor qui monte vers le Niger y fait halte, et avec lui les transporteurs, les convoyeurs et les commerçants de passage. Autour d'Arzèkè et du Dépôt, la clientèle est mobile et pressée : elle écrit depuis la route, veut savoir tout de suite si l'atelier peut prendre le camion ou si l'hôtel a une chambre, et repart si personne ne répond.",
    faq: [
      {
        q: "Un transporteur en route vers le Niger m'écrit la nuit, obtient-il une réponse ?",
        r: "Oui. Aucune plage horaire ne conditionne le fonctionnement de l'assistant : un message reçu à trois heures du matin reçoit sa réponse immédiatement, à partir de votre fiche. La demande est enregistrée pour vous, et vous la retrouvez au réveil.",
      },
      {
        q: "Peut-il annoncer le prix d'une réparation sur un poids lourd ?",
        r: "Seulement les tarifs que vous avez saisis, comme une vidange ou un forfait de diagnostic. Pour une panne précise, il ne chiffre rien : il recueille le véhicule, la description et l'urgence, confirme au client, puis vous transmet la demande.",
      },
      {
        q: "Comment caler les passages à l'atelier sans doubler les créneaux ?",
        r: "Avec l'option rendez-vous. Les créneaux libres se calculent depuis vos horaires d'ouverture et la durée de créneau que vous fixez, la même pour toutes les prestations. Vous réglez aussi combien de véhicules vous acceptez en parallèle.",
      },
      {
        q: "Mon hôtel de Parakou reçoit des groupes de passage, l'assistant sait-il les traiter ?",
        r: "Il recueille l'essentiel et vous prévient. Écrivez une consigne qui liste ce qu'il doit demander avant de vous alerter, par exemple le nombre de chambres et les dates : l'assistant suit les consignes de la fiche pour ce type de demande.",
      },
      {
        q: "Faut-il une connexion internet permanente à la boutique ?",
        r: "Seulement pour vous, quand vous consultez le tableau de bord. L'assistant tourne sur un serveur et non sur votre téléphone : une coupure chez vous n'interrompt pas les réponses. Les messages d'un client coupé arrivent quand sa propre connexion revient.",
      },
    ],
    publie: false,
  },
  {
    slug: "abomey-calavi",
    nom: "Abomey-Calavi",
    pays: "benin",
    region: "Atlantique",
    // Pas de `population` : le seul dénombrement communal publié par l'INStaD est
    // le RGPH4 de 2013 (656 358), et le RGPH5 n'a livré aucun résultat communal. Le
    // pays lui-même est laissé sans chiffre pour cette raison (cf. pays.ts) : un
    // comptage de 2013 sous-estime trop 2026 pour être publié tel quel.
    quartiersAffaires: ["Godomey", "Calavi Centre", "Zogbadjè", "Akassato"],
    secteursDominants: ["immobilier", "ecole", "restaurant"],
    tier: 1,
    enBref:
      "À Abomey-Calavi, Wapy répond aux locataires, aux familles et aux étudiants sur WhatsApp : biens disponibles, frais, filières, horaires. Il recueille la demande de visite ou d'inscription, la confirme et prévient le responsable.",
    angle:
      "Abomey-Calavi est devenue l'extension résidentielle de Cotonou : on y dort, on y étudie, et une bonne part de la ville descend travailler ailleurs le matin. Autour de Godomey et du campus de Zogbadjè, la demande de logement et de scolarité arrive par vagues saisonnières, sur des créneaux courts, et se compare en quelques messages entre trois interlocuteurs.",
    faq: [
      {
        q: "Comment tenir à jour les logements encore disponibles ?",
        r: "Vos annonces vivent dans un tableau dont vous choisissez les colonnes : quartier, loyer, superficie, photo. Un bien retiré du tableau cesse d'être proposé, car la fiche est relue à chaque message reçu, sans redémarrage ni délai de mise à jour.",
      },
      {
        q: "L'assistant peut-il qualifier un étudiant qui cherche une chambre ?",
        r: "Écrivez une consigne qui liste ce qu'il doit demander avant d'enregistrer : budget, quartier souhaité, date d'emménagement, durée. Il pose ces questions une par une, confirme au demandeur, puis vous envoie une demande déjà cadrée sur WhatsApp.",
      },
      {
        q: "La rentrée universitaire sature notre secrétariat, cela change-t-il quelque chose ?",
        r: "Le nombre de conversations menées en parallèle ne dépend pas de vos effectifs, et chaque échange garde son propre historique sans mélange. Ce qui limite la qualité des réponses, ce n'est pas le volume, c'est ce que vous avez ou non écrit dans la fiche.",
      },
      {
        q: "Peut-il envoyer la photo d'un appartement à Godomey ?",
        r: "Oui, si vous rattachez une image à l'annonce dans une colonne du tableau. Quand le demandeur veut voir le bien, l'assistant joint cette photo précise à sa réponse, dans la conversation WhatsApp, sans en choisir une autre.",
      },
      {
        q: "Un client insiste pour parler à quelqu'un, que se passe-t-il ?",
        r: "Une demande explicite de parler à une personne fait partie des rares cas où l'assistant passe la main. Il prévient le client qu'un humain revient vers lui, puis alerte votre numéro. Vous répondez en citant cette alerte, et tapez /fin pour rendre la conversation.",
      },
    ],
    publie: false,
  },
  {
    slug: "bohicon",
    nom: "Bohicon",
    pays: "benin",
    region: "Zou",
    // Pas de `population` : le seul dénombrement communal publié par l'INStaD est
    // le RGPH4 de 2013 (171 781), et le RGPH5 n'a livré aucun résultat communal. Le
    // pays lui-même est laissé sans chiffre pour cette raison (cf. pays.ts) : un
    // comptage de 2013 sous-estime trop 2026 pour être publié tel quel.
    quartiersAffaires: ["Marché de Bohicon", "Quartier Gare", "Sodohomè", "Passagon"],
    secteursDominants: ["boutique", "artisan", "garage-auto"],
    tier: 1,
    enBref:
      "À Bohicon, Wapy répond sur WhatsApp avec les informations de votre activité : ce que vous vendez ou fabriquez, vos tarifs, vos délais, vos moyens de paiement. La mise en place ne demande ni site web ni compétence technique.",
    angle:
      "Bohicon est un carrefour avant d'être une ville : la route du nord et celle de l'ouest s'y croisent, et le marché vit de ce passage permanent entre Cotonou, Abomey et les Collines. Le client type n'est pas du quartier, il traverse : il demande un prix et une disponibilité depuis un taxi, et il achètera là où la réponse arrive avant qu'il ne soit reparti.",
    faq: [
      {
        q: "Mes clients sont de passage et veulent un prix tout de suite, est-ce tenable ?",
        r: "C'est précisément ce que fait l'assistant : il répond à partir de votre tableau de prix, sans délai et sans vous solliciter. Sur un article que vous n'avez pas renseigné, il ne devine pas ; il dit qu'il se renseigne, ou propose le contact indiqué dans la fiche.",
      },
      {
        q: "Je fabrique sur mesure, peut-il en parler correctement ?",
        r: "Il présente ce que vous savez faire, vos matériaux, vos délais habituels et vos fourchettes de prix, à condition de les avoir écrits. Pour une pièce vraiment particulière, il rassemble le besoin, confirme au client et vous transmet la demande sans s'engager sur un montant.",
      },
      {
        q: "Comment recevoir les demandes reçues pendant que je travaille ?",
        r: "Chaque demande aboutie est rangée dans le carnet de votre tableau de bord, classée en devis, commande ou réservation, avec la conversation d'origine. Vous recevez en plus une notification WhatsApp à chaque enregistrement, sans avoir à relire le fil.",
      },
      {
        q: "Un client envoie la capture de son virement, l'assistant la lit-il ?",
        r: "Avec l'option lecture des justificatifs, il lit l'image, en extrait le montant et la référence, confirme la réception en précisant que la vérification reste à faire, puis vous transfère la capture. Il ne déclare jamais un paiement validé.",
      },
      {
        q: "Puis-je corriger un tarif sans tout reconfigurer ?",
        r: "Le tableau se modifie depuis le tableau de bord en quelques secondes. La fiche étant relue à chaque message reçu, le client suivant obtient déjà le nouveau tarif, sans redémarrage ni manipulation technique de votre part.",
      },
    ],
    publie: false,
  },

  // --- Côte d'Ivoire -------------------------------------------------------
  {
    slug: "abidjan",
    nom: "Abidjan",
    pays: "cote-divoire",
    region: "District autonome d'Abidjan",
    // Série « localité » du RGPH 2021 (tableau 4), c'est-à-dire l'agglomération
    // urbaine, et non la sous-préfecture ni le district autonome, plus larges.
    population: {
      valeur: 5616633,
      annee: 2021,
      source: "anstat-cotedivoire-rgph2021-localites",
      nature: "recensement",
    },
    quartiersAffaires: ["Plateau", "Cocody", "Marcory Zone 4", "Adjamé", "Treichville"],
    secteursDominants: ["immobilier", "restaurant", "garage-auto"],
    tier: 1,
    enBref:
      "À Abidjan, Wapy répond aux prospects sur WhatsApp à partir de votre fiche : biens et prestations disponibles, tarifs, adresse, conditions. Il mène l'échange jusqu'au bout, enregistre la demande et vous envoie le récapitulatif.",
    angle:
      "Abidjan pèse à elle seule l'essentiel de l'activité commerciale ivoirienne, et sa géographie complique tout : entre le Plateau, Cocody et Yopougon, une affaire se règle par message parce que traverser la lagune coûte une heure. Le prospect écrit depuis un embouteillage, compare trois réponses et tranche souvent avant d'être arrivé à destination.",
    faq: [
      {
        q: "Un prospect écrit depuis les embouteillages de Cocody, l'assistant traite-t-il seul ?",
        r: "Oui, il mène l'échange jusqu'au bout. Il répond depuis votre fiche, pose les questions qui manquent, confirme au prospect, puis enregistre la demande et vous envoie le récapitulatif sur WhatsApp. Vous n'avez pas à relire la conversation pour agir.",
      },
      {
        q: "Comment retirer un bien déjà loué au Plateau ou à Marcory ?",
        r: "Supprimez la ligne du tableau de vos annonces : le bien cesse aussitôt d'être proposé, la fiche étant relue à chaque message reçu. Tant qu'il y figure, l'assistant le présente avec le loyer exact que vous avez saisi, sans arrondi ni approximation.",
      },
      {
        q: "Mon garage d'Adjamé peut-il caler ses passages depuis WhatsApp ?",
        r: "Avec l'option rendez-vous, oui. Les créneaux proposés viennent d'une liste calculée depuis vos horaires d'ouverture et la durée de créneau que vous fixez, et l'assistant n'en propose jamais un hors de cette liste. Deux rappels partent avant l'heure.",
      },
      {
        q: "Puis-je faire répondre le même assistant sur mon site web ?",
        r: "Avec l'option chatbot pour site web, un widget à intégrer fait discuter les visiteurs avec le même assistant, nourri par la même fiche. Le visiteur n'a besoin d'aucun compte WhatsApp, et vous êtes prévenu quand il demande un humain.",
      },
      {
        q: "Plusieurs personnes gèrent nos messages, est-ce prévu ?",
        r: "Les comptes supplémentaires font partie des options d'abonnement. Chacun ouvre le tableau de bord du même établissement avec son propre mot de passe. Les conversations d'un établissement restent invisibles depuis le compte d'un autre établissement.",
      },
    ],
    publie: false,
  },
  {
    slug: "bouake",
    nom: "Bouaké",
    pays: "cote-divoire",
    region: "Vallée du Bandama",
    // Série « localité » du RGPH 2021 (tableau 4), c'est-à-dire l'agglomération
    // urbaine, et non la sous-préfecture ni le district autonome, plus larges.
    population: {
      valeur: 728733,
      annee: 2021,
      source: "anstat-cotedivoire-rgph2021-localites",
      nature: "recensement",
    },
    quartiersAffaires: ["Commerce", "Air France", "Koko", "Belleville"],
    secteursDominants: ["boutique", "hotel", "garage-auto"],
    tier: 1,
    enBref:
      "À Bouaké, Wapy répond sur WhatsApp aux questions d'articles, de tarifs et de disponibilité à partir de votre catalogue, envoie la photo du produit et enregistre la commande avec l'adresse, y compris rideau baissé.",
    angle:
      "Bouaké commande le centre du pays : son grand marché redistribue vers tout le nord et le corridor burkinabè y fait passer marchandises et voyageurs. Le commerçant du quartier Commerce jongle entre les acheteurs au comptoir et ceux qui écrivent depuis Katiola ou Ferkessédougou, sans jamais pouvoir traiter les deux files en même temps.",
    faq: [
      {
        q: "Mes clients glissent des mots de dioula dans leurs messages, est-ce un obstacle ?",
        r: "L'assistant répond en français, seule langue de réponse prévue à ce jour, même quand la question mélange les registres. Il s'attache à l'intention plutôt qu'à la forme exacte, et ne s'appuie que sur ce que contient votre fiche.",
      },
      {
        q: "Comment présenter un catalogue de tissus et de pagnes ?",
        r: "Dans un tableau dont vous choisissez les colonnes : article, motif, métrage, prix, image. Vous le saisissez ou l'importez depuis un fichier Excel, et l'assistant n'annonce jamais un article ou un prix qui n'y figure pas.",
      },
      {
        q: "Les demandes de chambre reçues la nuit sont-elles perdues ?",
        r: "Non. L'assistant recueille les dates, le nombre de personnes et le type de chambre, confirme la demande au voyageur et vous l'envoie. Avec l'option rendez-vous activée, il peut aller jusqu'à réserver un créneau et le confirmer lui-même.",
      },
      {
        q: "Que fait-il si un client devient désagréable ?",
        r: "Il reste calme, ne répond pas sur le même ton et recadre poliment vers la demande. La grossièreté seule ne déclenche pas de transfert ; une menace réelle ou une réclamation sérieuse, oui. Vous recevez alors une alerte avec le message d'origine.",
      },
      {
        q: "Peut-on affiner ses réponses en observant les échanges ?",
        r: "Avec l'option suggestions, l'IA relit les conversations et propose des ajouts à votre fiche : question restée sans bonne réponse, information manquante. Rien n'est appliqué sans votre validation, suggestion par suggestion.",
      },
    ],
    publie: false,
  },
  {
    slug: "yamoussoukro",
    nom: "Yamoussoukro",
    pays: "cote-divoire",
    region: "District autonome de Yamoussoukro",
    // Série « localité » du RGPH 2021 (tableau 4), c'est-à-dire l'agglomération
    // urbaine, et non la sous-préfecture ni le district autonome, plus larges.
    population: {
      valeur: 279977,
      annee: 2021,
      source: "anstat-cotedivoire-rgph2021-localites",
      nature: "recensement",
    },
    quartiersAffaires: ["Habitat", "Millionnaire", "Dioulakro", "Kokrenou"],
    secteursDominants: ["hotel", "ecole", "agence-voyage"],
    tier: 1,
    enBref:
      "À Yamoussoukro, Wapy répond aux visiteurs et aux familles sur WhatsApp : formules d'hébergement, frais de scolarité, calendrier, services inclus. Il recueille la demande, la confirme et prévient la réception ou le secrétariat.",
    angle:
      "Yamoussoukro n'est pas une ville de flux mais de séjours : l'administration, les grandes écoles et les visiteurs de la basilique y viennent pour quelques jours et préparent tout à l'avance. Les demandes arrivent donc écrites et détaillées, souvent le soir, et se comparent posément entre deux établissements avant qu'un acompte ne parte.",
    faq: [
      {
        q: "Nos visiteurs demandent surtout des informations pratiques, cela suffit-il ?",
        r: "C'est le cœur de son travail : horaires, adresse, tarifs, services inclus, tout ce que vous avez écrit. Sur une question que la fiche ne couvre pas, il ne brode pas : il dit qu'il se renseigne, ou renvoie vers le contact que vous avez indiqué.",
      },
      {
        q: "Peut-il traiter les demandes de groupe des écoles et des séminaires ?",
        r: "Il recueille l'essentiel et vous alerte. Écrivez une consigne qui précise ce qu'il doit demander avant de vous prévenir, par exemple l'effectif, la date et la formule souhaitée : elle guide son comportement sur ce type de demande.",
      },
      {
        q: "Comment lui faire connaitre nos formules d'hébergement ?",
        r: "Par un tableau dont vous choisissez les colonnes : type de chambre, capacité, tarif, équipements. L'assistant reprend ces valeurs telles quelles, sans arrondir ni compléter un tarif absent, et joint la photo rattachée à la ligne quand on la lui demande.",
      },
      {
        q: "Nos frais changent chaque rentrée, faut-il tout reconfigurer ?",
        r: "Non. Vous corrigez les montants dans le tableau et la modification vaut dès le message suivant, la fiche étant relue à chaque réception. Vous pouvez aussi téléverser la brochure en PDF, dont le contenu rejoint la fiche consultée par l'assistant.",
      },
      {
        q: "Beaucoup de demandes arrivent le week-end à Yamoussoukro, est-ce un problème ?",
        r: "Non, aucune plage horaire ne conditionne son activité. Un message envoyé un dimanche reçoit sa réponse immédiatement, et une demande aboutie est enregistrée dans le carnet avec une notification pour vous, que vous traiterez le lundi.",
      },
    ],
    publie: false,
  },
  {
    slug: "san-pedro",
    nom: "San-Pédro",
    pays: "cote-divoire",
    region: "Bas-Sassandra",
    // Série « localité » du RGPH 2021 (tableau 4), c'est-à-dire l'agglomération
    // urbaine, et non la sous-préfecture ni le district autonome, plus larges.
    population: {
      valeur: 293444,
      annee: 2021,
      source: "anstat-cotedivoire-rgph2021-localites",
      nature: "recensement",
    },
    quartiersAffaires: ["Zone portuaire", "Bardot", "Séweké", "Balmer"],
    secteursDominants: ["hotel", "agence-voyage", "garage-auto"],
    tier: 1,
    enBref:
      "À San-Pédro, Wapy répond sur WhatsApp aux voyageurs et aux professionnels de passage : disponibilités, tarifs, prestations, conditions. Il recueille la demande complète, la confirme au client et vous la transmet sur WhatsApp.",
    angle:
      "San-Pédro fonctionne au rythme du port : le cacao, le bois et les transitaires imposent des horaires larges et des interlocuteurs qui n'habitent pas la ville. À Bardot comme sur la zone portuaire, une demande arrive d'ailleurs, souvent hors des heures de bureau, et repart ailleurs si elle reste sans réponse le temps d'une escale.",
    faq: [
      {
        q: "Nos interlocuteurs sont des transitaires pressés, l'assistant tient-il le rythme ?",
        r: "Chaque conversation est indépendante et garde son propre historique, sans mélange d'un interlocuteur à l'autre. L'assistant répond immédiatement à partir de votre fiche, et n'attend pas votre disponibilité pour conclure une réservation ou une commande.",
      },
      {
        q: "Peut-il renseigner les horaires du port et les délais de transit ?",
        r: "Uniquement ce que vous avez écrit : vos propres délais, vos horaires, vos conditions. Il n'a aucun accès à une information portuaire extérieure et n'en fabrique pas. Ce qu'il ignore, il dit qu'il se renseigne plutôt que de l'improviser.",
      },
      {
        q: "Des voyageurs écrivent en anglais depuis les navires, que se passe-t-il ?",
        r: "L'assistant répond en français, la seule langue prévue à ce jour. Un message en anglais recevra donc une réponse en français. Autant le savoir avant de vous engager si une part importante de votre clientèle ne lit pas le français.",
      },
      {
        q: "Comment obtenir une demande de séjour complète du premier coup ?",
        r: "Par une consigne qui liste ce qu'il doit demander avant d'enregistrer : dates, nombre de personnes, formule, transferts souhaités. Il pose ces questions en une ou deux fois, confirme au client, puis vous transmet le récapitulatif structuré.",
      },
      {
        q: "Que devient une conversation reprise par notre équipe à San-Pédro ?",
        r: "Elle reste visible en entier dans le tableau de bord, avec l'historique des messages. Vous y répondez directement, ou depuis WhatsApp en citant l'alerte reçue, puis vous rendez la conversation à l'assistant en tapant /fin.",
      },
    ],
    publie: false,
  },
  {
    slug: "korhogo",
    nom: "Korhogo",
    pays: "cote-divoire",
    region: "Savanes",
    // Série « localité » du RGPH 2021 (tableau 4), c'est-à-dire l'agglomération
    // urbaine, et non la sous-préfecture ni le district autonome, plus larges.
    population: {
      valeur: 386586,
      annee: 2021,
      source: "anstat-cotedivoire-rgph2021-localites",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand marché", "Soba", "Petit Paris", "Résidentiel"],
    secteursDominants: ["artisan", "boutique", "hotel"],
    tier: 1,
    enBref:
      "À Korhogo, Wapy répond sur WhatsApp aux acheteurs qui ne sont pas sur place : ce que vous produisez, vos prix, vos délais, vos moyens de paiement. Il joint la photo de l'article et enregistre la commande en vous prévenant.",
    angle:
      "Korhogo tient le nord ivoirien, avec l'anacarde, le coton et un artisanat qui se vend bien au-delà de la région. Une bonne part des acheteurs n'est pas sur place : ils écrivent depuis Abidjan ou depuis le Mali voisin, demandent une pièce, un prix et un mode d'expédition, et veulent une réponse écrite qu'ils puissent relire avant de payer.",
    faq: [
      {
        q: "Je vends de l'artisanat, l'assistant sait-il décrire mes pièces ?",
        r: "Il décrit ce que vous avez écrit : matière, dimensions, finition, prix. Si le client demande à voir, il joint la photo rattachée à la ligne du tableau. Sur une pièce absente du catalogue, il ne compose rien et vous transmet la demande.",
      },
      {
        q: "Un acheteur veut se faire expédier une commande depuis Korhogo, peut-il l'organiser ?",
        r: "Il annonce ce que vous avez renseigné sur vos expéditions, recueille l'adresse et les coordonnées, confirme au client, puis enregistre la commande et vous prévient. L'organisation du transport et l'encaissement restent entièrement de votre côté.",
      },
      {
        q: "Notre activité suit les saisons agricoles, faut-il tout réécrire chaque année ?",
        r: "Non. Vous ajustez les lignes concernées dans le tableau, ou vous ajoutez une consigne pour la période en cours. La fiche étant relue à chaque message, le changement vaut dès la conversation suivante, sans redémarrage.",
      },
      {
        q: "L'assistant peut-il encaisser un acompte à ma place ?",
        r: "Non. Il communique les moyens de paiement et le numéro que vous avez renseignés, puis note la demande. L'argent circule directement entre l'acheteur et votre compte habituel, sans passer par l'assistant à aucun moment.",
      },
      {
        q: "Comment savoir ce qui a été répondu pendant mon absence ?",
        r: "Toutes les conversations s'affichent dans le tableau de bord, avec leur historique complet. Les demandes abouties sont en plus rangées dans le carnet, classées par nature, et chacune vous a déjà valu une notification WhatsApp au moment de son enregistrement.",
      },
    ],
    publie: false,
  },

  // --- Sénégal -------------------------------------------------------------
  {
    slug: "dakar",
    nom: "Dakar",
    pays: "senegal",
    region: "Dakar",
    // Pas de `population` : le RGPH-5 (2023) de l'ANSD s'arrête au département et
    // ne publie aucun effectif communal. Le département de Dakar compte
    // 1 278 471 habitants, mais un département n'est pas une ville : le
    // reprendre ici reviendrait à changer de périmètre en silence.
    quartiersAffaires: ["Plateau", "Point E", "Almadies", "Sandaga", "Médina"],
    secteursDominants: ["restaurant", "immobilier", "clinique-pharmacie"],
    tier: 1,
    enBref:
      "À Dakar, Wapy tient la conversation WhatsApp de votre établissement : horaires, adresse, tarifs, disponibilité. Il conclut lui-même commandes et demandes, vous notifie, et ne passe la main qu'en cas de réclamation ou de demande explicite.",
    angle:
      "Dakar tient sur une presqu'île étroite et tout y sature aux mêmes heures : la circulation entre le Plateau et les Almadies, les commerces autour de Sandaga, les cabinets de Point E. Le client dakarois n'appelle plus, il écrit, souvent en marchant, et considère qu'une réponse arrivée le lendemain matin est un refus poli.",
    faq: [
      {
        q: "Nos horaires diffèrent entre le Plateau et les Almadies, comment les annoncer ?",
        r: "Décrivez chaque adresse et ses horaires dans les informations de votre fiche, en texte libre. L'assistant reprend ce que vous avez écrit sans le simplifier. S'il manque une précision, il ne la fabrique pas : il dit qu'il se renseigne.",
      },
      {
        q: "Un patient demande un conseil médical, que fait l'assistant ?",
        r: "Wapy n'a pas de garde-fou médical dédié. Le cadrage vient des consignes que vous écrivez, du type « question de symptôme ou de posologie : ne réponds pas, transmets ». L'assistant suit les consignes de la fiche, et ne dispose de rien d'autre.",
      },
      {
        q: "Peut-il gérer les commandes du soir quand la salle est pleine ?",
        r: "C'est même le moment où il sert le plus. Il pose les questions qui manquent, plats, quantités, adresse, confirme au client, puis enregistre la commande dans le carnet et vous envoie le récapitulatif sur WhatsApp.",
      },
      {
        q: "Comment éviter qu'il propose un appartement déjà loué à Dakar ?",
        r: "En retirant la ligne du tableau de vos annonces : la fiche est relue à chaque message reçu, le bien cesse donc d'être proposé immédiatement. Tant qu'il y figure, il est présenté avec le loyer exact que vous avez saisi.",
      },
      {
        q: "L'assistant prévient-il le client avant son rendez-vous ?",
        r: "Avec l'option rendez-vous, deux rappels partent automatiquement sur WhatsApp : environ vingt-quatre heures avant, puis un dernier dans les deux heures qui précèdent. Chacun redit la prestation et l'horaire, ce qui limite les créneaux perdus par simple oubli.",
      },
    ],
    publie: false,
  },
  {
    slug: "thies",
    nom: "Thiès",
    pays: "senegal",
    region: "Thiès",
    // Pas de `population` : le RGPH-5 (2023) de l'ANSD s'arrête au département et
    // ne publie aucun effectif communal. Le département de Thiès compte
    // 879 185 habitants, mais un département n'est pas une ville : le
    // reprendre ici reviendrait à changer de périmètre en silence.
    quartiersAffaires: ["Escale", "Randoulène", "Grand Thiès", "Cité Lamy"],
    secteursDominants: ["artisan", "boutique", "ecole"],
    tier: 1,
    enBref:
      "À Thiès, Wapy répond pendant que vous travaillez : prestations, fourchettes de prix, délais, adresse. Il recueille la demande de devis ou d'inscription avec ce que vous exigez, la confirme et vous l'envoie sur WhatsApp.",
    angle:
      "Thiès est assez proche de Dakar pour en subir la concurrence et assez loin pour vivre de sa propre clientèle. Ses ateliers, son commerce d'Escale et ses écoles travaillent avec des gens qui font l'aller-retour vers la capitale dans la journée : ils écrivent depuis la route et veulent savoir si la pièce sera prête quand ils repasseront.",
    faq: [
      {
        q: "Un client qui fait l'aller-retour vers la capitale peut-il savoir si sa commande est prête ?",
        r: "L'assistant annonce le délai que vous avez renseigné pour ce type de travail. Il ne suit pas l'avancement pièce par pièce : sur l'état d'une commande précise, il recueille la question et vous la transmet, plutôt que d'annoncer une date qu'il ignore.",
      },
      {
        q: "Comment décrire un travail artisanal qui n'a pas de prix fixe ?",
        r: "Indiquez une fourchette et les critères qui la font varier : dimensions, matière, finition. L'assistant s'en tient à ce que vous avez écrit et n'avance pas un montant absent de la fiche. Il rassemble le besoin et vous transmet la demande.",
      },
      {
        q: "Nos inscriptions se concentrent sur trois semaines, l'assistant suit-il ?",
        r: "Le nombre d'échanges menés en parallèle ne dépend pas de vos effectifs, et chaque conversation reste séparée des autres. Ce qui compte est d'avoir écrit les frais, les filières et les pièces du dossier avant le pic, pas la taille du secrétariat.",
      },
      {
        q: "Peut-il s'appuyer sur notre règlement intérieur ?",
        r: "Téléversez-le en PDF ou en texte : son contenu rejoint la fiche que l'assistant consulte, il peut donc en restituer les points utiles. Les documents très longs sont tronqués, mieux vaut les découper en plusieurs fichiers courts.",
      },
      {
        q: "À Thiès, les clients passent en boutique après avoir écrit, est-ce utile quand même ?",
        r: "C'est l'usage le plus courant : l'assistant confirme le prix, la disponibilité et l'itinéraire que vous avez renseignés, puis la vente se conclut au comptoir. Il ne remplace pas la boutique, il évite qu'un client renonce faute de réponse.",
      },
    ],
    publie: false,
  },
  {
    slug: "touba",
    nom: "Touba",
    pays: "senegal",
    region: "Diourbel",
    // Pas de `population` : le RGPH-5 (2023) de l'ANSD s'arrête au département et
    // ne publie aucun effectif communal. Le département de Mbacké compte
    // 1 359 758 habitants, mais un département n'est pas une ville : le
    // reprendre ici reviendrait à changer de périmètre en silence.
    quartiersAffaires: ["Marché Ocass", "Darou Marnane", "Darou Khoudoss", "Gouye Mbind"],
    secteursDominants: ["boutique", "hotel", "agence-voyage"],
    tier: 1,
    enBref:
      "À Touba, Wapy répond sur WhatsApp aux demandes venues de la ville comme de l'étranger : disponibilité, tarifs, conditions, moyens de paiement. Il enregistre la demande aboutie et vous prévient, sans plage horaire de service.",
    angle:
      "Touba n'a pas le rythme d'une ville ordinaire : le Magal y concentre en quelques jours une affluence sans rapport avec le reste de l'année, et le commerce d'Ocass travaille beaucoup avec la diaspora. Les demandes arrivent donc par pics, souvent depuis l'étranger et à des heures décalées, sur des sujets où la disponibilité compte plus que le prix.",
    faq: [
      {
        q: "Pendant le Magal, le volume de messages explose, l'assistant tient-il ?",
        r: "Il traite chaque conversation indépendamment, sans file d'attente humaine. La difficulté n'est pas le nombre de messages mais leur contenu : anticipez la période en écrivant dans la fiche vos horaires exceptionnels, vos disponibilités et vos conditions de ce moment précis.",
      },
      {
        q: "Une commande arrive de la diaspora en pleine nuit, faut-il quelqu'un de garde ?",
        r: "Non. L'assistant répond depuis un serveur, sans plage horaire, et votre téléphone peut rester éteint. Un message envoyé depuis l'Europe ou l'Amérique reçoit sa réponse à l'instant, et la demande aboutie vous attend dans le carnet.",
      },
      {
        q: "Peut-il annoncer un prix à un client qui règle depuis l'étranger ?",
        r: "Il annonce vos tarifs tels que vous les avez saisis, sans conversion ni arrondi, et communique les moyens de paiement que vous avez renseignés. Il ne déclenche aucune transaction : l'argent circule directement entre le client et votre compte habituel.",
      },
      {
        q: "Comment traiter une demande d'hébergement pour une période chargée ?",
        r: "Sans l'option rendez-vous, il recueille les dates, le nombre de personnes et le type de logement, confirme la demande et vous l'envoie pour que vous validiez la disponibilité. L'option rendez-vous, elle, raisonne en créneaux horaires et non en nuitées.",
      },
      {
        q: "Un client m'envoie la capture de son transfert, est-ce exploitable ?",
        r: "Avec l'option lecture des justificatifs, l'assistant lit l'image, en extrait le montant, la référence et l'expéditeur, confirme la réception sans jamais déclarer le paiement validé, puis vous transfère la capture pour que vous vérifiiez.",
      },
    ],
    publie: false,
  },
  {
    slug: "saint-louis",
    nom: "Saint-Louis",
    pays: "senegal",
    region: "Saint-Louis",
    // Pas de `population` : le RGPH-5 (2023) de l'ANSD s'arrête au département et
    // ne publie aucun effectif communal. Le département de Saint-Louis compte
    // 387 369 habitants, mais un département n'est pas une ville : le
    // reprendre ici reviendrait à changer de périmètre en silence.
    quartiersAffaires: ["Île de Saint-Louis", "Sor", "Guet Ndar", "Ndiolofène"],
    secteursDominants: ["hotel", "agence-voyage", "restaurant"],
    tier: 1,
    enBref:
      "À Saint-Louis, Wapy répond aux voyageurs sur WhatsApp : chambres, équipements, excursions, tarifs, conditions, tels que vous les avez renseignés. Il recueille la demande de séjour, la confirme et la transmet à la réception.",
    angle:
      "Saint-Louis vit de son patrimoine et de ses saisons : le festival, les groupes de passage, les visiteurs qui préparent leur séjour depuis l'étranger plusieurs semaines à l'avance. Entre l'île et Sor, les établissements reçoivent des demandes longues et détaillées, arrivant à des heures européennes, quand la réception est déjà occupée ailleurs.",
    faq: [
      {
        q: "Les visiteurs préparent leur séjour des semaines à l'avance, l'assistant sait-il détailler ?",
        r: "Il détaille ce que contient votre fiche : types de chambres, équipements, services, conditions. Vous pouvez ajouter des documents en PDF pour les points longs. Sur ce qui n'y figure pas, il ne devine pas et vous transmet la question.",
      },
      {
        q: "Un groupe de festivaliers demande un devis, comment le récupérer complet ?",
        r: "Écrivez une consigne qui énumère ce qu'il doit demander avant d'enregistrer : effectif, dates, formule, prestations annexes. Il pose ces questions par petites séries, confirme au demandeur, puis vous envoie le récapitulatif structuré à chiffrer.",
      },
      {
        q: "Peut-il bloquer une date entière pendant le festival ?",
        r: "Non, l'option rendez-vous raisonne en créneaux horaires et non en journées : réserver un créneau ne bloque pas la date. En pratique, il recueille la date souhaitée et vous la transmet, et c'est vous qui confirmez la disponibilité.",
      },
      {
        q: "Peut-on lui confier les tarifs de nos excursions ?",
        r: "Oui, dans un tableau dont vous choisissez les colonnes : excursion, durée, tarif, nombre minimum de personnes. Il reprend ces valeurs telles quelles. Pour une formule sur mesure, il rassemble la demande et vous la transmet sans avancer de prix.",
      },
      {
        q: "L'assistant peut-il montrer nos chambres à un voyageur ?",
        r: "Oui, si vous téléversez une image et la rattachez à la ligne correspondante du tableau. Quand un visiteur demande à voir une chambre, il joint la photo exacte de cette ligne à sa réponse, sans en choisir une autre.",
      },
    ],
    publie: false,
  },
  {
    slug: "mbour",
    nom: "Mbour",
    pays: "senegal",
    region: "Thiès",
    // Pas de `population` : le RGPH-5 (2023) de l'ANSD s'arrête au département et
    // ne publie aucun effectif communal. Le département de Mbour compte
    // 935 304 habitants, mais un département n'est pas une ville : le
    // reprendre ici reviendrait à changer de périmètre en silence.
    quartiersAffaires: ["Saly Portudal", "Quai de pêche", "Grand Mbour", "Nguérigne"],
    secteursDominants: ["hotel", "restaurant", "immobilier"],
    tier: 1,
    enBref:
      "À Mbour, Wapy répond sur WhatsApp à des clients souvent absents une partie de l'année : disponibilités, tarifs de saison, conditions, adresse. Il recueille la demande, la confirme et vous la notifie où que vous soyez.",
    angle:
      "Mbour vit sur deux économies qui se touchent sans se mélanger : la pêche et le marché d'un côté, la Petite Côte et ses résidences de l'autre. À Saly comme à Nguérigne, la clientèle est saisonnière et souvent absente une partie de l'année ; elle réserve, loue et gère à distance, entièrement par messages écrits.",
    faq: [
      {
        q: "Nos propriétaires vivent à l'étranger et gèrent à distance, est-ce compatible ?",
        r: "Oui. L'assistant répond depuis le serveur, où que vous soyez, et vous recevez les demandes abouties par notification WhatsApp. Vous suivez aussi tout depuis le tableau de bord, avec l'historique complet de chaque conversation.",
      },
      {
        q: "Comment gérer des tarifs qui changent entre haute et basse saison ?",
        r: "Ajoutez une colonne de période à votre tableau et saisissez les deux tarifs, ou écrivez une consigne qui indique lequel s'applique. L'assistant s'appuie sur ce que vous avez écrit et n'invente pas un prix pour une période non renseignée.",
      },
      {
        q: "Une location saisonnière peut-elle être réservée par l'assistant ?",
        r: "Il recueille les dates, le nombre de personnes et le logement souhaité, confirme la demande et vous l'envoie. La confirmation ferme reste la vôtre : l'option rendez-vous couvre des créneaux horaires, pas des séjours de plusieurs nuits.",
      },
      {
        q: "Que répond-il sur les activités de la Petite Côte que nous ne vendons pas ?",
        r: "Rien qu'il n'ait lu dans votre fiche. Sur une activité extérieure que vous n'avez pas décrite, il ne se substitue pas à un office de tourisme : il dit qu'il se renseigne, ou renvoie vers le contact que vous avez indiqué.",
      },
      {
        q: "Nos employés écrivent sur le même numéro, comment éviter les réponses inutiles ?",
        r: "Inscrivez leurs numéros dans la liste d'exclusion : leurs messages sont ignorés, sans réponse ni enregistrement. Les messages de groupes et les statuts diffusés sont de toute façon écartés d'office, sans réglage de votre part.",
      },
    ],
    publie: false,
  },

  // --- Cameroun ------------------------------------------------------------
  {
    slug: "douala",
    nom: "Douala",
    pays: "cameroun",
    region: "Littoral",
    // Pas de `population` : le dernier dénombrement camerounais est le RGPH3 de
    // 2005 (1 907 479, milieu urbain du Wouri), trop ancien pour être publié en 2026.
    // L'estimation BUCREP 2023 ne descend qu'à l'arrondissement, jamais à la
    // ville : additionner les arrondissements serait notre calcul, pas une source.
    quartiersAffaires: ["Akwa", "Bonanjo", "Bonabéri", "Mboppi", "Deïdo"],
    secteursDominants: ["boutique", "garage-auto", "restaurant"],
    tier: 1,
    enBref:
      "À Douala, Wapy répond sur WhatsApp à partir de votre catalogue : articles, prix, disponibilité, livraison, moyens de paiement. Il conclut la commande, l'enregistre dans le carnet et vous envoie le récapitulatif.",
    angle:
      "Douala fait tourner l'économie camerounaise autour de son port, et son commerce a la densité qui va avec : Akwa pour les enseignes, Mboppi pour le gros, Bonabéri de l'autre côté du Wouri. Traverser le pont coûte assez cher en temps pour qu'une vente se joue par message, et le vendeur au comptoir ne peut pas suivre les deux files à la fois.",
    faq: [
      {
        q: "Un acheteur de Bonabéri commande sans traverser, l'assistant peut-il conclure ?",
        r: "Oui. Il recueille l'article, la quantité et l'adresse, confirme au client, enregistre la commande dans le carnet et vous envoie le récapitulatif. Vous n'intervenez que pour préparer et livrer, pas pour reconstituer la conversation.",
      },
      {
        q: "Comment tenir un catalogue qui bouge vite du côté de Mboppi ?",
        r: "Soit vous modifiez le tableau depuis le tableau de bord, en quelques secondes, soit vous activez l'option de connexion : votre logiciel expose alors une adresse web sécurisée que l'assistant interroge en direct. C'est à vous d'ouvrir cet accès.",
      },
      {
        q: "Un automobiliste envoie la photo d'un voyant allumé, que se passe-t-il ?",
        r: "Avec l'option lecture des justificatifs, qui couvre toutes les images reçues, l'assistant décrit ce qu'il voit et ajoute cette description à la conversation. Il ne pose aucun diagnostic : l'interprétation revient au mécanicien, et la demande vous est transmise.",
      },
      {
        q: "Peut-il montrer nos plats pendant que la salle tourne ?",
        r: "Oui. Ajoutez une colonne image à votre carte et téléversez la photo. Quand un client demande à voir un plat, l'assistant joint l'image à sa réponse, sans que personne en salle n'ait à toucher au téléphone.",
      },
      {
        q: "Que fait l'assistant quand un client réclame une remise ?",
        r: "Il s'en tient à votre fiche et n'annonce pas un tarif qui n'y figure pas. Devant une demande de remise que rien ne prévoit, il répond sans s'engager. Vous pouvez écrire une consigne qui lui indique quoi faire dans ce cas, il la suit.",
      },
    ],
    publie: false,
  },
  {
    slug: "yaounde",
    nom: "Yaoundé",
    pays: "cameroun",
    region: "Centre",
    // Pas de `population` : le dernier dénombrement camerounais est le RGPH3 de
    // 2005 (1 817 524, milieu urbain du Mfoundi), trop ancien pour être publié en 2026.
    // L'estimation BUCREP 2023 ne descend qu'à l'arrondissement, jamais à la
    // ville : additionner les arrondissements serait notre calcul, pas une source.
    quartiersAffaires: ["Bastos", "Centre administratif", "Mokolo", "Mvog-Mbi", "Ngoa-Ekelle"],
    secteursDominants: ["ecole", "clinique-pharmacie", "restaurant"],
    tier: 1,
    enBref:
      "À Yaoundé, Wapy répond aux familles et aux patients sur WhatsApp : horaires, pièces à fournir, frais, adresse. Il recueille la demande, la confirme, et alerte votre équipe quand le sujet est urgent ou sensible.",
    angle:
      "Yaoundé est une ville de dossiers : ministères, institutions, universités et cliniques y concentrent des démarches qui commencent presque toutes par la même série de questions. Entre Bastos et Ngoa-Ekelle, un accueil passe sa journée à répéter des horaires, des pièces à fournir et des montants, pendant que la file d'attente s'allonge devant lui.",
    faq: [
      {
        q: "Notre accueil répète les mêmes questions toute la journée, est-ce là que ça se joue ?",
        r: "Oui. Écrivez une fois les horaires, les pièces à fournir, les montants et les modalités : l'assistant les redit sans se lasser, à toute heure. Le temps rendu à l'accueil revient aux personnes qui se tiennent devant le comptoir.",
      },
      {
        q: "Une famille demande un aménagement de paiement, comment l'assistant réagit-il ?",
        r: "Écrivez une consigne qui vise ce cas et demande de transmettre : il la suivra et vous alertera. Sans consigne, une information absente ne provoque pas de transfert ; il répond simplement qu'il se renseigne et poursuit l'échange.",
      },
      {
        q: "Une urgence médicale arrive par message, est-elle traitée à part ?",
        r: "Une urgence ou un sujet sensible fait partie des cas où l'assistant passe la main. Il prévient la personne qu'un humain revient vers elle, et votre numéro reçoit sur WhatsApp le message d'origine avec le motif du transfert.",
      },
      {
        q: "Peut-il caler les rendez-vous d'un cabinet de Yaoundé ?",
        r: "Avec l'option rendez-vous, il propose des créneaux issus d'une liste calculée depuis vos horaires d'ouverture et la durée de créneau que vous fixez, la même pour tous les motifs, puis enregistre celui que la personne choisit et le confirme.",
      },
      {
        q: "Nos étudiants écrivent surtout le soir, faut-il un service de nuit ?",
        r: "Non, aucune plage horaire ne conditionne son fonctionnement. Un message envoyé à vingt-deux heures reçoit sa réponse immédiatement, et une demande aboutie est enregistrée pour que le secrétariat la retrouve le lendemain matin.",
      },
    ],
    publie: false,
  },
  {
    slug: "garoua",
    nom: "Garoua",
    pays: "cameroun",
    region: "Nord",
    // Pas de `population` : le dernier dénombrement camerounais est le RGPH3 de
    // 2005 (235 996, milieu urbain de l'arrondissement de Garoua), trop ancien pour être publié en 2026.
    // L'estimation BUCREP 2023 ne descend qu'à l'arrondissement, jamais à la
    // ville : additionner les arrondissements serait notre calcul, pas une source.
    quartiersAffaires: ["Marché central", "Roumdé Adjia", "Plateau", "Poumpoumré"],
    secteursDominants: ["boutique", "hotel", "garage-auto"],
    tier: 1,
    enBref:
      "À Garoua, Wapy répond sur WhatsApp aux clients qui écrivent avant de faire la route : disponibilité, tarifs, itinéraire, délais. Il enregistre la demande aboutie et vous la notifie, sans interrompre votre journée.",
    angle:
      "Garoua commande le Nord camerounais, avec le coton, l'élevage et un corridor qui file vers le Tchad. Les distances y sont longues : un client de Guider ou de Figuil ne passe pas voir, il écrit avant de prendre la route, et il veut savoir si l'article est en stock ou la chambre libre avant de monter en voiture.",
    faq: [
      {
        q: "Un client qui vient de loin veut être sûr avant de faire la route, est-ce possible ?",
        r: "L'assistant répond sur la base de ce que vous avez saisi dans votre tableau. Si votre stock bouge dans la journée, l'option de connexion permet d'interroger en direct une adresse web sécurisée que votre logiciel expose, à vous d'ouvrir cet accès.",
      },
      {
        q: "Nos horaires changent pendant le ramadan, comment le refléter ?",
        r: "En modifiant la ligne d'horaires de vos informations, ou en ajoutant une consigne qui décrit la période. L'assistant relit la fiche à chaque message reçu, la modification vaut donc dès la conversation suivante, sans redémarrage ni délai.",
      },
      {
        q: "Peut-il expliquer comment nous trouver depuis le marché central ?",
        r: "Il transmet l'itinéraire que vous avez écrit, avec vos repères habituels. Beaucoup d'adresses se décrivent mieux par un repère que par une rue : rédigez-le comme vous l'expliqueriez au téléphone, il s'appuiera dessus sans rien y ajouter.",
      },
      {
        q: "Comment savoir combien de chambres restent libres ce soir ?",
        r: "L'assistant ne tient pas votre planning d'occupation. Il annonce vos types de chambres et vos tarifs, recueille les dates et le nombre de personnes, confirme la demande et vous l'envoie pour que la réception valide la disponibilité réelle.",
      },
      {
        q: "Un client écrit en fulfulde, obtient-il une réponse ?",
        r: "Il obtient une réponse en français, seule langue prévue par le fonctionnement actuel de l'assistant. Le message est pris en compte, mais la réponse part en français : à peser si une part de votre clientèle ne lit pas cette langue.",
      },
    ],
    publie: false,
  },
  {
    slug: "bafoussam",
    nom: "Bafoussam",
    pays: "cameroun",
    region: "Ouest",
    // Pas de `population` : le dernier dénombrement camerounais est le RGPH3 de
    // 2005 (239 287, milieu urbain de la Mifi), trop ancien pour être publié en 2026.
    // L'estimation BUCREP 2023 ne descend qu'à l'arrondissement, jamais à la
    // ville : additionner les arrondissements serait notre calcul, pas une source.
    quartiersAffaires: ["Marché A", "Marché B", "Kamkop", "Banengo"],
    secteursDominants: ["boutique", "artisan", "evenementiel-traiteur"],
    tier: 1,
    enBref:
      "À Bafoussam, Wapy répond sur WhatsApp aux commandes et aux demandes de devis : formules, tarifs renseignés, délais, conditions. Il recueille ce que votre consigne exige, confirme au client et vous transmet le récapitulatif.",
    angle:
      "Bafoussam est une ville de négoce et d'organisation collective : les marchés A et B redistribuent les récoltes de l'Ouest vers Douala et Yaoundé, et les grandes réunions de famille y font vivre traiteurs, salles et prestataires. Les commandes se préparent longtemps à l'avance, par messages, avec des interlocuteurs qui vivent souvent ailleurs.",
    faq: [
      {
        q: "Une réunion familiale se prépare des mois à l'avance, l'assistant sait-il suivre ?",
        r: "Il mène l'échange et recueille les éléments que votre consigne réclame : type d'événement, date, nombre d'invités, formule. Il confirme au demandeur puis vous transmet le récapitulatif. Le chiffrage et la tenue du planning restent de votre côté.",
      },
      {
        q: "Peut-il savoir si une date de prestation est déjà prise ?",
        r: "Non, il n'a pas de calendrier de journées. L'option rendez-vous raisonne en créneaux horaires, et réserver un créneau ne bloque pas la date entière. Il recueille la date souhaitée et vous la transmet ; la confirmation vous revient.",
      },
      {
        q: "Nos prix suivent le cours des récoltes, comment éviter les erreurs ?",
        r: "Tenez le tableau à jour : l'assistant reprend vos montants tels quels et n'annonce jamais un prix absent de la fiche. Sur un article dont le prix n'est pas renseigné, il ne l'estime pas, il dit qu'il se renseigne.",
      },
      {
        q: "Plusieurs membres de la famille suivent le même commerce, est-ce gérable ?",
        r: "Des comptes supplémentaires pour le tableau de bord font partie des options d'abonnement, chacun avec son mot de passe. Côté WhatsApp, un seul numéro est lié par établissement : les messages d'un client arrivent tous sur la même conversation.",
      },
      {
        q: "L'assistant peut-il rappeler nos conditions d'acompte ?",
        r: "Oui, si vous les écrivez dans la fiche ou dans une consigne. Il les redit au bon moment et communique le numéro de règlement que vous avez indiqué, sans encaisser lui-même et sans jamais déclarer un paiement reçu.",
      },
    ],
    publie: false,
  },
  {
    slug: "bamenda",
    nom: "Bamenda",
    pays: "cameroun",
    region: "Nord-Ouest",
    // Pas de `population` : le dernier dénombrement camerounais est le RGPH3 de
    // 2005 (269 530, milieu urbain de l'arrondissement de Bamenda), trop ancien pour être publié en 2026.
    // L'estimation BUCREP 2023 ne descend qu'à l'arrondissement, jamais à la
    // ville : additionner les arrondissements serait notre calcul, pas une source.
    quartiersAffaires: ["Commercial Avenue", "Nkwen", "Mankon", "Up Station"],
    secteursDominants: ["boutique", "artisan", "hotel"],
    tier: 1,
    enBref:
      "À Bamenda, Wapy répond sur WhatsApp à partir de votre fiche : articles, prestations, tarifs, délais, adresse. Point à peser avant de vous engager : l'assistant répond en français, seule langue prévue à ce jour.",
    angle:
      "Bamenda est la principale ville anglophone du pays, et c'est là que le décalage linguistique se voit le mieux : sur Commercial Avenue comme à Mankon, la conversation commerciale se tient en anglais et en pidgin, alors que l'assistant ne répond qu'en français. C'est une contrainte à peser avant de s'engager, pas un détail de paramétrage.",
    faq: [
      {
        q: "Ma clientèle écrit en anglais, Wapy convient-il à Bamenda ?",
        r: "Autant le dire franchement : l'assistant répond en français, seule langue prévue par son fonctionnement actuel. Un message en anglais reçoit une réponse en français. Si l'essentiel de votre clientèle ne lit pas le français, Wapy n'est pas adapté aujourd'hui.",
      },
      {
        q: "Puis-je au moins rédiger ma fiche en anglais ?",
        r: "Vous saisissez ce que vous voulez dans la fiche, mais l'instruction de répondre en français est écrite dans le fonctionnement de l'assistant, au-dessus du contenu que vous fournissez. Compter sur une fiche anglaise pour obtenir des réponses en anglais serait un pari, pas une fonctionnalité.",
      },
      {
        q: "Comment présenter un atelier qui travaille sur commande ?",
        r: "Décrivez vos réalisations types, vos matières et vos délais dans un tableau, puis écrivez une consigne qui liste ce qu'il faut demander pour une commande spéciale. L'assistant suit cette consigne, confirme au client et vous envoie la demande cadrée.",
      },
      {
        q: "Peut-on limiter l'assistant à certaines heures ?",
        r: "Non, aucune plage horaire d'activité n'existe : il répond dès qu'un message arrive, de jour comme de nuit. Le seul filtre disponible est la liste des numéros exclus, qui empêche toute réponse aux numéros que vous y inscrivez.",
      },
      {
        q: "Que se passe-t-il quand la connexion est mauvaise chez nous ?",
        r: "L'assistant tourne sur un serveur, pas sur votre téléphone : votre propre coupure n'interrompt pas ses réponses. Les messages envoyés par un client pendant sa coupure arrivent quand sa connexion revient, et un message livré deux fois n'est traité qu'une seule fois.",
      },
    ],
    publie: false,
  },

  // --- Togo ----------------------------------------------------------------
  {
    slug: "lome",
    nom: "Lomé",
    pays: "togo",
    region: "Maritime",
    // Périmètre INSEED : « ville de Lomé » = District autonome du Grand Lomé
    // (préfectures du Golfe et d'Agoè-Nyivé, 13 communes), 100 % urbain.
    population: {
      valeur: 2188376,
      annee: 2022,
      source: "inseed-togo-rgph5-villes",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand Marché", "Nyékonakpoè", "Hédzranawoé", "Bè", "Zone portuaire"],
    secteursDominants: ["boutique", "hotel", "artisan"],
    tier: 1,
    enBref:
      "À Lomé, Wapy répond sur WhatsApp avec les informations de votre activité : articles, tarifs, délais, zones desservies, moyens de paiement. Il conclut la commande et vous la notifie, sans exiger de site web ni de compétence technique.",
    angle:
      "Lomé cumule tout : le port qui approvisionne trois pays sans littoral, le Grand Marché, l'administration et l'essentiel de la clientèle du pays, dans un rayon de quelques kilomètres. La concurrence y est immédiate et visible, et les demandes tombent souvent tard, quand le client rentre enfin chez lui et pense à commander.",
    faq: [
      {
        q: "Beaucoup de mes demandes arrivent après vingt-deux heures, sont-elles traitées ?",
        r: "Oui, immédiatement. Aucune plage horaire ne limite l'assistant, et une commande passée la nuit est enregistrée avec son récapitulatif. Vous la retrouvez au matin dans le carnet, sans avoir laissé personne veiller sur le téléphone.",
      },
      {
        q: "Comment garder un client qui compare trois boutiques du Grand Marché ?",
        r: "En répondant le premier, avec un prix exact. L'assistant reprend les montants de votre tableau sans les arrondir et joint la photo de l'article si on la lui demande. Sur un article non renseigné, il ne s'avance pas.",
      },
      {
        q: "Je vends aussi vers le Burkina et le Niger, peut-il l'annoncer ?",
        r: "Il annonce les destinations que vous desservez, vos délais et vos frais, tels que vous les avez écrits. Il recueille ensuite l'adresse de livraison et les coordonnées, confirme au client, puis vous transmet la commande à expédier.",
      },
      {
        q: "Puis-je essayer avant de payer un abonnement ?",
        r: "L'inscription ouvre sept jours d'essai gratuit, sur vos vraies conversations. Passé ce délai, vous choisissez une formule et les options qui vous servent. Le prix ne dépend pas de la ville où vous exercez.",
      },
      {
        q: "Que devient une conversation quand j'y réponds moi-même depuis WhatsApp ?",
        r: "Quand l'assistant vous a passé la main, une alerte arrive sur votre WhatsApp. Vous la citez, et votre réponse part au client sous votre identité habituelle. La conversation vous reste jusqu'à ce que vous tapiez /fin.",
      },
    ],
    publie: false,
  },
  {
    slug: "sokode",
    nom: "Sokodé",
    pays: "togo",
    region: "Centrale",
    population: {
      valeur: 115442,
      annee: 2022,
      source: "inseed-togo-rgph5-villes",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand marché", "Didaouré", "Komah", "Kpangalam"],
    secteursDominants: ["boutique", "garage-auto", "artisan"],
    tier: 1,
    enBref:
      "À Sokodé, Wapy répond sur WhatsApp aux clients qui vérifient avant de se déplacer : prix, disponibilité, itinéraire, délais. La fiche se remplit sans code, et l'assistant enregistre les demandes abouties en vous prévenant.",
    angle:
      "Sokodé est une étape obligée sur la nationale qui relie Lomé au nord : tout ce qui monte ou descend s'y arrête, et une bonne part du commerce local vit de cet arrêt. L'information y circule vite, de bouche à oreille et par taxi-moto, et un client déjà renseigné écrit directement pour vérifier un prix avant de bouger.",
    faq: [
      {
        q: "Un client vérifie un prix avant de se déplacer, l'assistant suffit-il ?",
        r: "C'est exactement son usage : il donne le prix saisi dans votre tableau, la disponibilité que vous avez indiquée et l'itinéraire que vous avez décrit. Il ne complète jamais de lui-même une information que vous n'avez pas écrite.",
      },
      {
        q: "Comment lui faire connaitre les pièces détachées que je tiens ?",
        r: "Par un tableau dont vous choisissez les colonnes : pièce, référence, véhicule compatible, prix, photo. Vous le saisissez ou l'importez depuis un fichier Excel, et vous le corrigez à tout moment depuis le tableau de bord.",
      },
      {
        q: "Le courant saute souvent, cela coupe-t-il le service ?",
        r: "Non. L'assistant ne dépend ni de votre téléphone ni de votre électricité : il répond depuis un serveur. Vous retrouvez les conversations et les demandes enregistrées dès que vous rouvrez le tableau de bord.",
      },
      {
        q: "Peut-il porter deux activités différentes sur le même numéro ?",
        r: "Une fiche décrit un établissement, mais rien ne vous empêche d'y décrire deux activités avec leurs propres tableaux et leurs propres consignes. Si chacune a son numéro WhatsApp, il faut alors deux comptes distincts, chacun avec sa fiche.",
      },
      {
        q: "Mes clients envoient beaucoup de notes vocales, sont-elles perdues ?",
        r: "Sans l'option notes vocales, l'assistant ne peut pas les écouter : il remercie le client et lui demande d'écrire sa demande en quelques mots. Avec l'option, elles sont transcrites et il répond au contenu comme si c'était écrit.",
      },
    ],
    publie: false,
  },
  {
    slug: "kara",
    nom: "Kara",
    pays: "togo",
    region: "Kara",
    population: {
      valeur: 158090,
      annee: 2022,
      source: "inseed-togo-rgph5-villes",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand marché", "Kpéwa", "Tomdè", "Ramco"],
    secteursDominants: ["hotel", "ecole", "restaurant"],
    tier: 1,
    enBref:
      "À Kara, Wapy répond sur WhatsApp aux voyageurs, aux familles et aux étudiants : disponibilités, formules, frais, horaires. Il recueille la demande, la confirme et vous la transmet, y compris pendant les fortes périodes.",
    angle:
      "Kara est la ville du nord qui reçoit : université, administration régionale, et une saison de fêtes traditionnelles qui remplit d'un coup les hébergements et les tables. Le reste de l'année, la clientèle redevient locale et régulière. Cette alternance oblige à répondre vite pendant les pics sans embaucher pour douze mois.",
    faq: [
      {
        q: "Comment absorber un pic de demandes pendant la saison des fêtes ?",
        r: "L'assistant mène les conversations en parallèle, sans renfort. Préparez la période dans la fiche : horaires exceptionnels, formules du moment, conditions de réservation. Ce qui limitera ses réponses sera ce que vous n'aurez pas écrit, pas le volume reçu.",
      },
      {
        q: "Peut-il enregistrer une réservation de table pour le soir ?",
        r: "Il recueille la date, l'heure souhaitée, le nombre de personnes et le nom, confirme au client puis vous transmet la demande. Avec l'option rendez-vous, il propose directement des créneaux libres et enregistre celui que le client choisit.",
      },
      {
        q: "Nos étudiants demandent toujours les mêmes informations d'inscription, est-ce automatisable ?",
        r: "Écrivez une fois les filières, les frais et les pièces du dossier dans un tableau : l'assistant les redonne à chaque demande. Une consigne peut préciser ce qu'il doit recueillir avant de prévenir le secrétariat.",
      },
      {
        q: "Que fait-il d'une question à laquelle la fiche ne répond pas ?",
        r: "Il ne l'invente pas. Il dit qu'il se renseigne et que quelqu'un reviendra vers la personne, pose une question de précision, ou propose le contact indiqué dans votre fiche. Il ne vous dérange que si le client insiste.",
      },
      {
        q: "Peut-on voir ce que l'assistant a mal compris ?",
        r: "Les conversations complètes restent consultables dans le tableau de bord. Avec l'option suggestions, l'IA en tire des propositions d'ajout à votre fiche, que vous validez ou refusez une par une, sans rien appliquer automatiquement.",
      },
    ],
    publie: false,
  },
  {
    slug: "kpalime",
    nom: "Kpalimé",
    pays: "togo",
    region: "Plateaux",
    population: {
      valeur: 87478,
      annee: 2022,
      source: "inseed-togo-rgph5-villes",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand marché", "Centre artisanal", "Kpodzi", "Tsivé"],
    secteursDominants: ["artisan", "hotel", "agence-voyage"],
    tier: 1,
    enBref:
      "À Kpalimé, Wapy répond sur WhatsApp aux visiteurs présents comme à ceux déjà repartis : pièces disponibles, prix, activités, hébergement. Il recueille la commande ou la demande de séjour, la confirme et vous prévient.",
    angle:
      "Kpalimé vit du relief et de ce qu'on en rapporte : randonnées vers le mont Agou, cascades, batiks et sculptures que les visiteurs découvrent sur place puis recommandent une fois rentrés. Beaucoup de demandes viennent donc de gens qui ne sont pas encore arrivés, ou qui sont déjà repartis et veulent commander à distance.",
    faq: [
      {
        q: "Des visiteurs repartis veulent commander à distance, est-ce gérable ?",
        r: "Ils écrivent au même numéro et l'assistant reprend l'échange depuis votre catalogue : article, prix, délai, expédition telle que vous l'avez décrite. Il recueille l'adresse, confirme, enregistre la commande et vous prévient.",
      },
      {
        q: "Peut-il décrire une randonnée que nous organisons ?",
        r: "Il décrit ce que vous avez écrit : durée, difficulté, ce qui est inclus, tarif, point de rendez-vous. Sur un point que vous n'avez pas renseigné, comme la météo ou l'état d'un sentier, il ne s'avance pas.",
      },
      {
        q: "Comment traiter les groupes qui réservent plusieurs activités ?",
        r: "Une consigne peut lister ce qu'il doit recueillir avant d'enregistrer : effectif, dates, activités souhaitées, hébergement. Il pose ces questions en une ou deux fois, confirme au groupe, puis vous envoie une demande exploitable telle quelle.",
      },
      {
        q: "Nos pièces artisanales sont toutes différentes, comment les cataloguer ?",
        r: "Créez un tableau avec les colonnes qui vous parlent, y compris une colonne image, et une ligne par pièce ou par famille de pièces. L'assistant s'appuie sur ces lignes et joint la bonne photo quand on lui demande de voir.",
      },
      {
        q: "Faut-il un site web pour utiliser Wapy à Kpalimé ?",
        r: "Non, WhatsApp suffit et beaucoup d'activités n'ont rien d'autre. Si vous avez un site, l'option chatbot pour site web y ajoute un widget alimenté par la même fiche, mais rien ne vous y oblige pour démarrer.",
      },
    ],
    publie: false,
  },
  {
    slug: "atakpame",
    nom: "Atakpamé",
    pays: "togo",
    region: "Plateaux",
    population: {
      valeur: 98193,
      annee: 2022,
      source: "inseed-togo-rgph5-villes",
      nature: "recensement",
    },
    quartiersAffaires: ["Grand marché", "Kamina", "Agbonou", "Djama"],
    secteursDominants: ["boutique", "artisan", "garage-auto"],
    tier: 1,
    enBref:
      "À Atakpamé, Wapy répond sur WhatsApp pendant que vous travaillez : prestations, tarifs de base, délais, adresse. Il recueille le besoin du client, le confirme et vous alerte pour que vous preniez le relais.",
    angle:
      "Atakpamé se tient sur la nationale entre Lomé et le nord, avec ses ateliers, son marché et la zone industrielle d'Agbonou. La clientèle mêle habitants, agriculteurs des environs et conducteurs arrêtés le temps d'une réparation ou d'un achat. Personne n'attend longtemps : ce qui n'obtient pas de réponse se trouve à l'étape suivante.",
    faq: [
      {
        q: "Un conducteur s'arrête une heure et repart, peut-on capter cette clientèle ?",
        r: "En répondant tout de suite, ce que l'assistant fait sans vous solliciter. Il annonce vos prestations, vos tarifs de base et vos délais, puis recueille le besoin et vous alerte pour que vous preniez le relais à l'atelier.",
      },
      {
        q: "Comment éviter de redire cent fois les mêmes tarifs de base ?",
        r: "En les écrivant une fois dans un tableau. L'assistant les reprend tels quels à chaque demande, sans variation ni oubli de votre part, et vous ne reprenez la parole que pour les cas particuliers ou les chiffrages.",
      },
      {
        q: "La clientèle agricole commande par saison, l'assistant s'y adapte-t-il ?",
        r: "Il s'appuie sur ce que contient la fiche au moment du message. Ajoutez une consigne ou modifiez les lignes concernées quand la saison change : la fiche étant relue à chaque réception, la nouvelle version s'applique aussitôt.",
      },
      {
        q: "Peut-il traiter une réclamation sur un travail mal fait ?",
        r: "Non, et c'est voulu. Une réclamation fait partie des rares situations où il passe la main : il prévient le client qu'un humain revient vers lui, puis vous alerte avec le message reçu et le motif du transfert.",
      },
      {
        q: "Combien de temps pour être opérationnel à Atakpamé ?",
        r: "Quelques minutes pour la mise en route : décrire l'activité, laisser l'IA proposer une première fiche, corriger, scanner le QR code. Le reste dépend de vous, car plus la fiche est précise, moins l'assistant a de raisons de botter en touche.",
      },
    ],
    publie: false,
  },
];

export function getVille(slug: string): Ville | undefined {
  return VILLES.find((v) => v.slug === slug);
}

export function villesPubliees(): Ville[] {
  return VILLES.filter((v) => v.publie);
}

export function villesDuPays(slugPays: string): Ville[] {
  return VILLES.filter((v) => v.pays === slugPays);
}
