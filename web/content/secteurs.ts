import type { Secteur } from "./types";

/**
 * Les 11 secteurs du silo métier. Chaque entrée reprend la substance de l'article
 * de blog correspondant (`web/lib/blog.ts`), mais toute affirmation sur ce que
 * Wapy fait a été revérifiée dans le code avant d'être écrite ici :
 *
 * - l'assistant répond UNIQUEMENT depuis la fiche et n'invente rien (brain.py:48-50) ;
 * - il répond en français, seule langue prévue (brain.py:45-47) ;
 * - il CONCLUT lui-même commandes, réservations et devis, les enregistre et
 *   NOTIFIE le responsable sans lui passer la main (brain.py:52-66, bot.py:142-160) ;
 * - il ne passe la main que dans les cas 3a-3d (brain.py:114-128) ; une information
 *   manquante ne déclenche PAS d'escalade, il dit qu'il se renseigne (brain.py:129-133) ;
 * - certaines capacités dépendent de l'abonnement (billing.py:34-64) : rendez-vous,
 *   notes vocales, lecture des justificatifs, connecteur, widget web.
 *
 * Aucune revendication de clientèle : Wapy n'a aucun client en production.
 */
export const SECTEURS: Secteur[] = [
  {
    slug: "restaurant",
    nom: "Restaurant",
    nomPluriel: "Restaurants",
    tag: "Restauration",
    ancienSlugBlog: "chatbot-whatsapp-restaurant",
    motCle: "chatbot WhatsApp restaurant",
    enBref:
      "Un chatbot WhatsApp pour restaurant répond aux questions de menu, d'horaires et de livraison à partir de votre carte, prend la commande jusqu'au bout et l'enregistre en prévenant le responsable. Wapy se configure sans code, depuis un tableau.",
    angle:
      "Un restaurant reçoit ses messages au pire moment : pendant le service. Le téléphone sonne, WhatsApp clignote, et la personne en salle choisit toujours le client qui est devant elle. Les demandes du soir restent sans réponse jusqu'au lendemain, quand le client a déjà commandé ailleurs. C'est une perte invisible, qui n'apparaît jamais dans la caisse.",
    douleurs: [
      "Messages reçus en plein service, traités trop tard ou jamais",
      "Mêmes questions toute la journée : horaires, prix du plat, zone de livraison",
      "Commandes perdues le soir et le week-end, quand personne ne regarde le téléphone",
      "Carte qui change souvent, et un client à qui on annonce un plat qui n'existe plus",
    ],
    faq: [
      {
        q: "Le bot connait-il ma carte et mes prix ?",
        r: "Oui. Votre menu tient dans un tableau dont vous choisissez les colonnes, que vous saisissez ou importez depuis un fichier Excel. L'assistant répond uniquement à partir de ces informations et n'annonce jamais un prix ou un plat qui n'y figure pas.",
      },
      {
        q: "Peut-il prendre une commande complète ?",
        r: "Oui, et il la mène jusqu'au bout lui-même. Il pose les questions qui manquent, plats, quantités, adresse, confirme au client, puis enregistre la commande dans le carnet et vous envoie le récapitulatif sur WhatsApp. Vous ne relisez pas la conversation.",
      },
      {
        q: "Et si un client se plaint d'un plat ?",
        r: "Une réclamation fait partie des rares cas où l'assistant passe la main. Il prévient le client qu'un humain revient vers lui, puis alerte votre numéro sur WhatsApp avec le message reçu. Vous répondez en citant cette alerte, et tapez /fin pour rendre la conversation.",
      },
      {
        q: "Répond-il quand le restaurant est fermé ?",
        r: "Oui, sans interruption : aucune plage horaire ne limite son activité. Un message reçu à minuit reçoit une réponse tout de suite, avec vos horaires réels, et une commande pour le lendemain est enregistrée pendant la fermeture.",
      },
      {
        q: "Puis-je montrer une photo de plat au client ?",
        r: "Oui. Ajoutez une colonne image à votre tableau et téléversez la photo du plat. Quand un client demande à voir un plat, l'assistant envoie l'image avec sa réponse, dans la conversation WhatsApp.",
      },
      {
        q: "Puis-je changer le menu du jour facilement ?",
        r: "Le tableau se modifie depuis le tableau de bord en quelques secondes. La fiche est relue à chaque message reçu : le client suivant obtient déjà le nouveau menu, sans redémarrage ni manipulation technique.",
      },
    ],
    publie: true,
  },
  {
    slug: "salon-de-beaute",
    nom: "Salon de beauté",
    nomPluriel: "Salons de beauté",
    tag: "Beauté",
    ancienSlugBlog: "assistant-whatsapp-salon-de-beaute",
    motCle: "assistant WhatsApp salon de beauté",
    enBref:
      "Un assistant WhatsApp pour salon de beauté annonce vos prestations, leurs durées et leurs prix, et, avec l'option rendez-vous, propose vos créneaux réellement libres puis enregistre la réservation. Il envoie ensuite un rappel avant l'heure.",
    angle:
      "Dans un salon, les deux mains sont prises. Pendant une pose de tresses ou un défrisage, le téléphone accumule des questions de tarif et des demandes de créneau, et on ne le regarde qu'une heure plus tard. La cliente, elle, a écrit à deux salons du quartier et réserve chez celui qui a répondu. Le créneau perdu ne se rattrape pas le lendemain.",
    douleurs: [
      "Impossible de répondre pendant une prestation, les mains occupées",
      "Demandes de créneau qui arrivent le soir, traitées le lendemain matin",
      "Tarifs et durées répétés dix fois par jour à des clientes différentes",
      "Rendez-vous oubliés par la cliente, créneau perdu sans prévenir",
    ],
    faq: [
      {
        q: "L'assistant peut-il vraiment prendre les rendez-vous seul ?",
        r: "Avec l'option rendez-vous, oui. Il calcule vos créneaux libres depuis vos horaires d'ouverture et la durée de créneau que vous fixez, en propose quelques uns, et quand la cliente en choisit un, il l'enregistre et confirme. Sans cette option, il recueille la demande et vous la transmet.",
      },
      {
        q: "Et si deux clientes veulent le même créneau ?",
        r: "La disponibilité est revérifiée au moment d'enregistrer. Si la place vient d'être prise, la réservation est refusée et l'assistant propose aussitôt d'autres horaires libres. Vous fixez aussi combien de rendez-vous peuvent tenir en parallèle.",
      },
      {
        q: "Les clientes reçoivent-elles un rappel ?",
        r: "Oui, deux rappels automatiques sur WhatsApp pour un rendez-vous enregistré avec l'option rendez-vous : environ 24 heures avant, puis un dernier dans les deux heures qui précèdent. Chacun rappelle la prestation et l'horaire, ce qui limite les créneaux perdus par simple oubli.",
      },
      {
        q: "Puis-je bloquer certains horaires ?",
        r: "Vous renseignez vos plages d'ouverture jour par jour, la durée d'un créneau et la fenêtre de réservation. L'assistant ne propose que ce qui entre dans ces plages, et ne propose jamais un horaire hors de la liste calculée.",
      },
      {
        q: "Comment retrouver mes rendez-vous du jour ?",
        r: "Ils s'affichent dans votre tableau de bord, où vous pouvez aussi en annuler un. Si vous connectez votre agenda Google, chaque réservation y est recopiée automatiquement, avec le service et le contact de la cliente.",
      },
      {
        q: "Ça marche pour un institut comme pour une onglerie ?",
        r: "Oui. Vous décrivez vos prestations avec leur durée et leur prix, quelles qu'elles soient, et l'assistant s'appuie sur cette liste pour répondre. Les créneaux proposés, eux, suivent la durée de créneau unique que vous fixez, et non la durée propre à chaque prestation.",
      },
    ],
    publie: true,
  },
  {
    slug: "boutique",
    nom: "Boutique",
    nomPluriel: "Boutiques",
    tag: "Commerce",
    ancienSlugBlog: "chatbot-whatsapp-boutique",
    motCle: "chatbot WhatsApp boutique",
    enBref:
      "Un chatbot WhatsApp pour boutique répond sur les articles, les tailles, les prix et la livraison à partir de votre catalogue, envoie la photo du produit et enregistre la commande avec l'adresse, y compris magasin fermé.",
    angle:
      "Sur WhatsApp, le client demande ce qu'il demanderait en vitrine : si le modèle existe encore, dans quelle taille, à quel prix, et si vous livrez chez lui. Ces questions arrivent surtout le soir, quand le rideau est baissé. Sans réponse, il ne revient pas le lendemain : il achète dans la boutique qui a répondu la première.",
    douleurs: [
      "Questions de disponibilité et de taille reçues après la fermeture",
      "Catalogue décrit à l'oral, avec des prix qui varient d'un message à l'autre",
      "Commandes noyées dans un fil de discussion, retrouvées trop tard",
      "Adresse de livraison à redemander trois fois avant de pouvoir expédier",
    ],
    faq: [
      {
        q: "Comment l'assistant connait-il mes articles ?",
        r: "Par un tableau catalogue dont vous choisissez les colonnes : produit, taille, couleur, prix, ce que vous voulez. Vous le saisissez ou l'importez depuis un fichier Excel, et vous le modifiez quand vous voulez depuis le tableau de bord.",
      },
      {
        q: "Peut-il envoyer les photos des produits ?",
        r: "Oui. Vous téléversez une image et vous la rattachez à l'article dans une colonne. Quand un client demande à voir le produit, l'assistant joint la photo exacte de cet article à sa réponse, sans en choisir une autre.",
      },
      {
        q: "Mon stock change tous les jours, comment suivre ?",
        r: "Deux façons : mettre le catalogue à jour vous-même, ou activer l'option de connexion. Votre logiciel de gestion expose alors une adresse web sécurisée que l'assistant interroge en direct. Ce n'est pas un branchement sur votre base : c'est à vous d'ouvrir cet accès.",
      },
      {
        q: "Comment se passe une commande hors des heures d'ouverture ?",
        r: "Comme aux heures d'ouverture : l'assistant ne connait pas de plage d'activité. Il recueille l'article, la quantité et l'adresse, confirme au client, enregistre la commande dans le carnet et vous envoie le récapitulatif sur WhatsApp.",
      },
      {
        q: "Peut-il encaisser le paiement à ma place ?",
        r: "Non. Il communique les moyens de paiement et le numéro que vous avez renseignés, puis note la commande. L'argent circule directement entre le client et votre compte habituel, exactement comme aujourd'hui.",
      },
      {
        q: "Un client m'envoie une capture de paiement, que se passe-t-il ?",
        r: "Avec l'option lecture des justificatifs, l'assistant lit l'image, en extrait montant, référence et expéditeur, confirme la réception sans jamais déclarer le paiement validé, puis vous transfère la capture pour vérification.",
      },
    ],
    publie: true,
  },
  {
    slug: "hotel",
    nom: "Hôtel",
    nomPluriel: "Hôtels",
    tag: "Hôtellerie",
    ancienSlugBlog: "assistant-whatsapp-hotel",
    motCle: "assistant WhatsApp hôtel",
    enBref:
      "Un assistant WhatsApp pour hôtel répond sur les types de chambres, les tarifs, les équipements et les services à partir de votre fiche, à toute heure. Il recueille la demande de réservation, la confirme et prévient la réception.",
    angle:
      "Un voyageur qui cherche une chambre écrit rarement à un seul hôtel. Il envoie le même message à quatre établissements et réserve chez celui qui répond avec un tarif clair et une disponibilité. Ces messages tombent tard le soir, à l'arrivée d'un vol, au moment précis où la réception termine un enregistrement et ne peut pas suivre le téléphone.",
    douleurs: [
      "Demandes envoyées à plusieurs hôtels en même temps, où la vitesse décide",
      "Questions de tarif et d'équipement répétées à chaque voyageur",
      "Messages reçus la nuit, quand la réception est seule en poste",
      "Demandes de groupe traitées comme une réservation ordinaire, puis perdues",
    ],
    faq: [
      {
        q: "L'assistant confirme-t-il la réservation tout seul ?",
        r: "Cela dépend de votre installation. Avec l'option rendez-vous activée, il réserve un créneau et le confirme. Sinon il recueille dates, nombre de personnes et type de chambre, confirme la demande au client et vous l'envoie pour que la réception valide la disponibilité.",
      },
      {
        q: "Comment lui faire connaitre mes chambres et mes tarifs ?",
        r: "Vous les décrivez dans un tableau dont vous choisissez les colonnes : type de chambre, capacité, tarif, équipements. L'assistant reprend ces valeurs telles quelles, sans arrondir ni compléter un tarif absent.",
      },
      {
        q: "Répond-il aux voyageurs qui écrivent en anglais ?",
        r: "Il comprend la question mais répond en français, la seule langue de réponse prévue à ce jour. Autant le savoir si votre clientèle est majoritairement anglophone : un message en anglais recevra une réponse en français.",
      },
      {
        q: "Peut-il gérer une demande de groupe ou de séminaire ?",
        r: "Il recueille l'essentiel et vous la transmet. Vous pouvez écrire une consigne qui lui dit quoi faire dans ce cas précis, par exemple quelles informations demander avant de vous prévenir : il la suivra à la lettre.",
      },
      {
        q: "Puis-je gérer deux établissements avec un seul compte ?",
        r: "Non. Chaque établissement a son compte, sa fiche et sa propre connexion WhatsApp. Un voyageur qui écrit au numéro d'un hôtel reçoit les informations de cet hôtel, jamais celles de l'autre.",
      },
      {
        q: "Que devient une conversation reprise par la réception ?",
        r: "Elle reste visible en entier dans le tableau de bord, avec l'historique des messages. Vous pouvez y répondre directement, ou depuis WhatsApp en citant l'alerte reçue, puis rendre la conversation à l'assistant.",
      },
    ],
    publie: true,
  },
  {
    slug: "clinique-pharmacie",
    nom: "Clinique et pharmacie",
    nomPluriel: "Cliniques et pharmacies",
    tag: "Santé",
    ancienSlugBlog: "assistant-whatsapp-clinique-pharmacie",
    motCle: "assistant WhatsApp clinique pharmacie",
    enBref:
      "Un assistant WhatsApp pour clinique ou pharmacie répond aux demandes pratiques, horaires, adresse, documents à apporter, disponibilité d'un produit renseigné, et alerte votre équipe dès qu'il s'agit d'une urgence ou d'un cas sensible.",
    angle:
      "À l'accueil d'un cabinet ou d'une officine, le téléphone coupe la file d'attente. Les mêmes demandes reviennent sans arrêt : l'heure de fermeture, les pièces du dossier, si tel produit est arrivé. Chaque appel vole du temps au patient qui se tient devant le comptoir, et les demandes réellement médicales se retrouvent noyées au milieu des questions pratiques.",
    douleurs: [
      "Accueil saturé par des demandes pratiques pendant les consultations",
      "Patients qui appellent pour savoir si un produit est arrivé en officine",
      "Documents et pièces du dossier réexpliqués à chaque appel",
      "Demandes urgentes noyées au milieu des questions de routine",
    ],
    faq: [
      {
        q: "L'assistant peut-il donner un avis médical ?",
        r: "Wapy n'a pas de garde-fou médical dédié. L'assistant ne dispose que de votre fiche et il lui est interdit d'inventer une donnée absente. Le cadrage repose sur les consignes que vous écrivez, du type « question de symptôme ou de posologie : ne réponds pas, transmets », que l'assistant suit.",
      },
      {
        q: "Comment est traitée une demande urgente ?",
        r: "Une urgence ou un sujet sensible fait partie des cas où l'assistant passe la main. Il prévient le patient qu'un humain revient vers lui, et votre numéro reçoit sur WhatsApp le message d'origine et le motif du transfert.",
      },
      {
        q: "Peut-il prendre les rendez-vous du cabinet ?",
        r: "Avec l'option rendez-vous, oui. Il propose vos créneaux libres, calculés depuis vos horaires d'ouverture et la durée de créneau que vous fixez, enregistre celui que le patient choisit et envoie deux rappels avant l'échéance.",
      },
      {
        q: "Peut-il dire si un médicament est disponible ?",
        r: "Uniquement pour ce que vous avez renseigné dans votre tableau de produits. Pour une disponibilité qui bouge dans la journée, l'option de connexion interroge en direct une adresse web sécurisée que votre logiciel d'officine expose. C'est à vous d'ouvrir cet accès, rien n'est branché sur votre base.",
      },
      {
        q: "Puis-je lui confier nos protocoles écrits ?",
        r: "Vous pouvez téléverser des documents PDF ou texte : leur contenu est ajouté à la fiche que l'assistant consulte. C'est utile pour les tarifs, la liste des pièces à fournir ou les modalités de prise en charge.",
      },
      {
        q: "Les conversations sont-elles isolées d'un établissement à l'autre ?",
        r: "Oui. Chaque établissement a son compte, sa fiche et ses conversations, accessibles uniquement depuis son propre espace, avec des accès protégés par mot de passe. Rien n'est partagé entre deux comptes.",
      },
    ],
    publie: true,
  },
  {
    slug: "immobilier",
    nom: "Agence immobilière",
    nomPluriel: "Agences immobilières",
    tag: "Immobilier",
    ancienSlugBlog: "chatbot-whatsapp-immobilier",
    motCle: "chatbot WhatsApp immobilier",
    enBref:
      "Un chatbot WhatsApp pour agence immobilière répond sur les biens que vous avez renseignés, prix, superficie, quartier, envoie la photo de l'annonce, puis recueille la demande de visite et prévient l'agent concerné.",
    angle:
      "Dans l'immobilier, la première réponse emporte le rendez-vous. Un locataire qui repère une annonce écrit à quatre agences dans la même minute, et la visite se cale avec celle qui répond avant midi. Les agents, eux, sont en visite justement, ou en rendez-vous de signature, et découvrent le message le soir, quand le bien intéresse déjà quelqu'un d'autre.",
    douleurs: [
      "Prospects qui écrivent à plusieurs agences en même temps, la vitesse décide",
      "Agents en visite toute la journée, injoignables au moment du premier message",
      "Messages qui se limitent à un bonjour, sans budget ni quartier recherché",
      "Biens vendus ou loués encore présentés faute de mise à jour",
    ],
    faq: [
      {
        q: "L'assistant peut-il organiser les visites ?",
        r: "Il recueille le bien concerné, les disponibilités du prospect et ses coordonnées, confirme la demande et vous l'envoie sur WhatsApp avec le récapitulatif. C'est l'agent qui fixe le créneau, sauf si vous activez l'option rendez-vous avec vos plages de visite.",
      },
      {
        q: "Comment qualifier un prospect avant de le rappeler ?",
        r: "Écrivez une consigne qui liste ce qu'il doit demander avant d'enregistrer la demande : budget, quartier, location ou achat, date d'emménagement. L'assistant suit les consignes de la fiche et vous transmet une demande déjà cadrée.",
      },
      {
        q: "Comment mettre à jour les biens disponibles ?",
        r: "Vos annonces vivent dans un tableau dont vous choisissez les colonnes. Un bien retiré du tableau cesse immédiatement d'être proposé : la fiche est relue à chaque message, sans redémarrage ni délai de mise à jour.",
      },
      {
        q: "Peut-il envoyer les photos d'un bien ?",
        r: "Oui, si vous rattachez une image à l'annonce dans une colonne du tableau. Quand le prospect demande à voir le bien, l'assistant envoie cette photo précise dans la conversation, accompagnée d'un court message.",
      },
      {
        q: "Que fait-il face à une négociation de prix ?",
        r: "Il s'en tient au prix de votre annonce et n'avance jamais un montant qui n'y figure pas. Devant une demande de remise que rien ne prévoit, il répond sans s'engager, ou suit la consigne que vous avez écrite pour ce cas.",
      },
      {
        q: "Puis-je empêcher l'assistant de répondre à certains numéros ?",
        r: "Oui, vous tenez une liste de numéros exclus. Un message venant de l'un d'eux est ignoré, sans réponse ni enregistrement. C'est utile pour vos agents, vos propriétaires ou vos prestataires, dont les messages ne sont pas des demandes de prospect.",
      },
    ],
    publie: true,
  },
  {
    slug: "ecole",
    nom: "École et centre de formation",
    nomPluriel: "Écoles et centres de formation",
    tag: "Éducation",
    ancienSlugBlog: "assistant-whatsapp-ecole",
    motCle: "assistant WhatsApp école inscription",
    enBref:
      "Un assistant WhatsApp pour école ou centre de formation répond aux familles sur les frais, les filières, le calendrier et les pièces du dossier, puis recueille la demande d'inscription et prévient le secrétariat.",
    angle:
      "La période des inscriptions concentre en trois semaines l'essentiel des demandes de l'année. Le secrétariat répond aux mêmes quatre questions cent fois par jour, entre deux parents au guichet, et des familles restent sans réponse pendant plusieurs jours. Celles qui hésitent entre deux établissements arbitrent souvent sur ce seul critère : celui qui a répondu.",
    douleurs: [
      "Pic d'inscriptions qui sature le standard sur quelques semaines",
      "Frais, filières et pièces du dossier réexpliqués à chaque famille",
      "Messages des parents envoyés le soir, hors des heures de bureau",
      "Demandes d'inscription reçues en vrac, sans les informations utiles",
    ],
    faq: [
      {
        q: "L'assistant peut-il finaliser une inscription ?",
        r: "Il mène l'échange, recueille les informations que votre consigne demande, confirme à la famille, puis enregistre la demande et prévient le secrétariat sur WhatsApp. La validation du dossier et l'admission restent entièrement de votre côté.",
      },
      {
        q: "Comment lui faire connaitre nos frais et nos filières ?",
        r: "Par un tableau dont vous choisissez les colonnes, filière, niveau, frais, échéances, saisi ou importé depuis un fichier Excel. L'assistant reprend ces montants tels quels et n'en invente aucun, même sous insistance.",
      },
      {
        q: "Peut-il exploiter notre règlement ou notre brochure ?",
        r: "Oui. Vous téléversez un PDF ou un fichier texte, son contenu rejoint la fiche que l'assistant consulte. Les documents très longs sont tronqués : mettez l'essentiel en tête, ou découpez-les en plusieurs fichiers courts.",
      },
      {
        q: "Répond-il aux parents en dehors des heures de bureau ?",
        r: "Oui, sans interruption. Aucune plage horaire ne conditionne son fonctionnement : un message envoyé à 22 heures ou un dimanche reçoit sa réponse immédiatement, et une demande d'inscription est enregistrée pour le lendemain.",
      },
      {
        q: "Comment traiter une demande de bourse ou un cas particulier ?",
        r: "Écrivez une consigne qui vise cette situation et demande de transmettre : l'assistant la suivra et alertera le responsable. Sans consigne, une information absente ne déclenche pas de transfert, il répond simplement qu'il se renseigne.",
      },
      {
        q: "Peut-on améliorer ses réponses au fil des échanges ?",
        r: "Avec l'option suggestions, l'IA relit les conversations et propose des ajouts à votre fiche, questions restées sans bonne réponse ou information manquante. Rien n'est appliqué sans votre validation, suggestion par suggestion.",
      },
    ],
    publie: true,
  },
  {
    slug: "artisan",
    nom: "Artisan",
    nomPluriel: "Artisans",
    tag: "Services",
    ancienSlugBlog: "assistant-whatsapp-artisan",
    motCle: "assistant WhatsApp artisan devis",
    enBref:
      "Un assistant WhatsApp pour artisan répond pendant que vous travaillez : zones d'intervention, tarifs de base, délais. Il recueille la demande de devis, type de travail, lieu, urgence, coordonnées, et vous l'envoie prête à chiffrer.",
    angle:
      "Un artisan ne répond pas quand il a les mains dans un chantier, et c'est précisément à ce moment que le client cherche quelqu'un. Une fuite ou une panne se règle dans la journée : le client appelle trois numéros et retient le premier qui décroche. Le soir, il ne reste qu'un appel manqué et une intervention déjà confiée à un autre.",
    douleurs: [
      "Impossible de décrocher sur un chantier, l'urgence part chez le suivant",
      "Demandes de devis décrites en trois mots, sans lieu ni nature du travail",
      "Zones d'intervention et tarifs de base répétés à chaque appel",
      "Rendez-vous calés à l'oral, oubliés ou notés nulle part",
    ],
    faq: [
      {
        q: "L'assistant peut-il donner un prix ?",
        r: "Seulement ceux que vous avez renseignés, comme un tarif de déplacement ou une prestation courante. Pour un chiffrage précis, il ne devine rien : il recueille la description du besoin, confirme au client et vous transmet la demande.",
      },
      {
        q: "Comment recevoir une demande de devis exploitable ?",
        r: "Écrivez une consigne qui liste ce qu'il doit demander avant d'enregistrer : nature du travail, lieu, urgence, coordonnées. Il pose ces questions une par une, confirme, puis vous envoie le récapitulatif sur WhatsApp.",
      },
      {
        q: "Peut-il caler mes rendez-vous d'intervention ?",
        r: "Avec l'option rendez-vous, il propose vos créneaux libres calculés depuis vos horaires, enregistre celui que le client choisit et envoie un rappel la veille puis un dernier peu avant l'heure. Vous fixez la durée type d'une intervention.",
      },
      {
        q: "Mes clients m'envoient des notes vocales, sait-il les traiter ?",
        r: "Avec l'option notes vocales, elles sont transcrites et l'assistant répond au contenu comme si le client avait écrit. Si la transcription échoue, il remercie le client et lui demande d'écrire sa demande en quelques mots.",
      },
      {
        q: "Faut-il un site web ou un deuxième téléphone ?",
        r: "Ni l'un ni l'autre. Vous liez le compte WhatsApp que vous utilisez déjà en scannant un QR code, sans saisir de numéro. Une fois lié, l'assistant répond depuis le serveur : votre téléphone peut être éteint.",
      },
      {
        q: "Ça marche pour tous les métiers artisanaux ?",
        r: "L'assistant ne connait que ce que vous écrivez dans votre fiche, quel que soit le métier. Plomberie, électricité, menuiserie, couture : décrivez vos prestations, vos zones et vos délais, il s'appuie uniquement là-dessus.",
      },
    ],
    publie: true,
  },
  {
    slug: "agence-voyage",
    nom: "Agence de voyage",
    nomPluriel: "Agences de voyage",
    tag: "Voyage",
    ancienSlugBlog: "assistant-whatsapp-agence-voyage",
    motCle: "assistant WhatsApp agence de voyage",
    enBref:
      "Un assistant WhatsApp pour agence de voyage présente vos destinations, formules et tarifs tels que vous les avez renseignés, recueille la demande de réservation, destination, dates, nombre de voyageurs, et prévient votre équipe.",
    angle:
      "Une demande de voyage se prépare le soir, une fois la journée finie, et se compare aussitôt : le client interroge trois agences sur le même trajet et retient celle qui annonce un tarif la première. Pendant ce temps votre comptoir est fermé, et le lendemain matin la question a déjà trouvé sa réponse ailleurs, avec un acompte versé.",
    douleurs: [
      "Demandes de tarif envoyées le soir et le week-end, comparées à chaud",
      "Mêmes questions sur les dates, les bagages et les services inclus",
      "Dossiers en cours qui monopolisent le comptoir pendant que les messages s'accumulent",
      "Demandes de réservation trop vagues pour être chiffrées sans rappeler",
    ],
    faq: [
      {
        q: "L'assistant peut-il émettre un billet ?",
        r: "Non. Il informe à partir de vos offres, recueille la demande complète, la confirme au client et vous l'envoie sur WhatsApp. L'émission, l'encaissement et la relation avec vos fournisseurs restent entièrement de votre côté.",
      },
      {
        q: "Comment tenir mes offres et mes tarifs à jour ?",
        r: "Dans un tableau dont vous choisissez les colonnes : destination, période, formule, tarif. Vous le modifiez à tout moment depuis le tableau de bord, ou vous l'importez depuis un fichier Excel. La modification vaut dès le message suivant.",
      },
      {
        q: "Que répond-il sur les formalités de visa ?",
        r: "Uniquement ce que vous avez écrit dans la fiche. Sur un point que vous n'avez pas renseigné, il ne devine pas : il dit qu'il se renseigne, ou renvoie vers le contact que vous avez indiqué pour ce type de question.",
      },
      {
        q: "Comment récupérer une demande complète du premier coup ?",
        r: "Par une consigne qui liste ce qu'il doit demander avant d'enregistrer : destination, dates, nombre de voyageurs, services souhaités. Il pose ces questions en une ou deux fois, puis vous transmet le récapitulatif structuré.",
      },
      {
        q: "Peut-on l'installer aussi sur notre site web ?",
        r: "Avec l'option chatbot pour site web, oui : un widget à intégrer fait discuter les visiteurs avec le même assistant, nourri par la même fiche. Aucun compte WhatsApp n'est demandé au visiteur, et vous êtes prévenu s'il veut un humain.",
      },
      {
        q: "Comment reprendre la main sur un dossier ?",
        r: "Quand l'assistant passe la main, une alerte arrive sur votre WhatsApp. Vous citez ce message et votre réponse part au client sous votre identité habituelle. La conversation vous reste jusqu'à ce que vous tapiez /fin.",
      },
    ],
    publie: true,
  },
  {
    slug: "evenementiel-traiteur",
    nom: "Traiteur et événementiel",
    nomPluriel: "Traiteurs et événementiels",
    tag: "Événementiel",
    ancienSlugBlog: "assistant-whatsapp-evenementiel-traiteur",
    motCle: "assistant WhatsApp traiteur événementiel",
    enBref:
      "Un assistant WhatsApp pour traiteur ou organisateur d'événements présente vos formules et vos tarifs indicatifs, puis recueille la demande de devis, type d'événement, date, nombre d'invités, et vous l'envoie prête à chiffrer.",
    angle:
      "Un traiteur travaille précisément les jours où les demandes arrivent : le samedi, en plein service d'un mariage, quand les invités repartent avec le numéro et écrivent le soir même. Chaque message vaut un contrat à quatre chiffres, mais il faut une date, un nombre d'invités et une formule pour répondre, et personne n'est libre pour les demander.",
    douleurs: [
      "Demandes reçues pendant une prestation, quand toute l'équipe est mobilisée",
      "Devis impossibles à chiffrer sans date ni nombre d'invités",
      "Formules et options réexpliquées à chaque futur marié",
      "Dates déjà retenues confirmées à deux clients par erreur",
    ],
    faq: [
      {
        q: "L'assistant peut-il envoyer un devis chiffré ?",
        r: "Il annonce les tarifs indicatifs que vous avez renseignés, jamais un montant absent de la fiche. Pour le reste, il recueille les éléments du devis, confirme au client, puis vous transmet la demande. Le chiffrage final reste le vôtre.",
      },
      {
        q: "Comment obtenir une demande de devis complète ?",
        r: "Par une consigne qui énumère ce qu'il doit demander avant d'enregistrer : type d'événement, date, nombre d'invités, formule, services annexes. Il pose ces questions par petites séries, puis vous envoie le récapitulatif structuré.",
      },
      {
        q: "Sait-il si une date est déjà retenue ?",
        r: "Pas dans le cas d'un événement. L'option rendez-vous raisonne en créneaux horaires, pas en journées entières : réserver un créneau ne bloque pas la date. En pratique, l'assistant recueille la date souhaitée et vous la transmet, et c'est vous qui confirmez la disponibilité.",
      },
      {
        q: "Où retrouver les demandes qu'il a enregistrées ?",
        r: "Chacune est rangée dans le carnet de votre tableau de bord, classée par nature, devis, commande ou réservation, avec le récapitulatif et la conversation d'origine. Vous recevez en plus une notification WhatsApp à chaque enregistrement.",
      },
      {
        q: "Un client m'envoie la capture de son acompte, que fait l'assistant ?",
        r: "Avec l'option lecture des justificatifs, il lit l'image, en extrait le montant et la référence, confirme la réception en précisant que la validation reste à faire, enregistre l'information et vous transfère la capture.",
      },
      {
        q: "Peut-il gérer plusieurs demandes en même temps ?",
        r: "Oui. Chaque conversation est indépendante et garde son propre historique, sans mélange d'un client à l'autre. Les messages de groupes et les statuts diffusés sont ignorés d'office.",
      },
    ],
    publie: true,
  },
  {
    slug: "garage-auto",
    nom: "Garage automobile",
    nomPluriel: "Garages automobiles",
    tag: "Automobile",
    ancienSlugBlog: "assistant-whatsapp-garage-auto",
    motCle: "assistant WhatsApp garage automobile",
    enBref:
      "Un assistant WhatsApp pour garage automobile répond sur vos prestations et vos tarifs de base, recueille la demande de devis, véhicule, panne décrite, urgence, et, avec l'option rendez-vous, cale les passages à l'atelier.",
    angle:
      "Dans un garage, personne n'a les mains libres pour le téléphone : elles sont sous un capot ou dans une boîte à outils. Les automobilistes, eux, écrivent en pleine panne, souvent au bord de la route, et cherchent un atelier qui peut les prendre le jour même. Sans réponse dans l'heure, la voiture entre chez le garage d'à côté et n'en ressort pas cliente.",
    douleurs: [
      "Mécaniciens aux mains prises, incapables de répondre pendant l'intervention",
      "Automobilistes en panne qui cherchent un atelier disponible tout de suite",
      "Tarifs courants comme la vidange redemandés plusieurs fois par jour",
      "Passages à l'atelier notés sur un cahier, avec des créneaux doublés",
    ],
    faq: [
      {
        q: "L'assistant peut-il donner un prix de réparation ?",
        r: "Il annonce vos tarifs courants, vidange ou révision par exemple, tels que vous les avez saisis. Pour une panne précise, il ne chiffre rien : il recueille le véhicule, la description et l'urgence, puis vous transmet la demande.",
      },
      {
        q: "Gère-t-il le planning de l'atelier ?",
        r: "Avec l'option rendez-vous, il propose les créneaux libres calculés depuis vos horaires d'ouverture et la durée de créneau que vous fixez, et n'en propose jamais un hors de cette liste. Vous réglez aussi le nombre de véhicules acceptés en parallèle.",
      },
      {
        q: "Que se passe-t-il si deux clients visent le même créneau ?",
        r: "La disponibilité est revérifiée au moment d'enregistrer. Tant que le nombre de véhicules que vous acceptez en parallèle n'est pas atteint, le créneau reste ouvert. Une fois la capacité atteinte, la réservation est refusée et l'assistant propose immédiatement d'autres horaires libres.",
      },
      {
        q: "Le client est-il prévenu avant son passage ?",
        r: "Oui, deux rappels automatiques sur WhatsApp pour un rendez-vous enregistré : environ 24 heures avant, puis un dernier dans les deux heures qui précèdent, avec la prestation et l'horaire.",
      },
      {
        q: "Un client envoie la photo de son tableau de bord, que fait-il ?",
        r: "Avec l'option lecture des justificatifs, qui couvre toutes les images reçues, l'assistant décrit ce qu'il voit et ajoute cette description à la conversation. Il ne pose aucun diagnostic : le voyant reste à interpréter par un mécanicien, et la demande vous est transmise.",
      },
      {
        q: "Faut-il changer de logiciel ou de numéro ?",
        r: "Non. Vous liez le compte WhatsApp du garage en scannant un QR code, sans saisir de numéro ni migrer vers un autre compte. Vous vérifiez ensuite par un code le numéro qui recevra les alertes.",
      },
    ],
    publie: true,
  },
];

export function getSecteur(slug: string): Secteur | undefined {
  return SECTEURS.find((s) => s.slug === slug);
}

export function secteursPublies(): Secteur[] {
  return SECTEURS.filter((s) => s.publie);
}

/** Redirections 301 des anciens articles de blog vers les pages secteur. */
export const REDIRECTIONS_SECTEURS = SECTEURS.filter(
  (s): s is Secteur & { ancienSlugBlog: string } => s.ancienSlugBlog !== null,
).map((s) => ({
  source: `/blog/${s.ancienSlugBlog}`,
  destination: `/secteurs/${s.slug}`,
}));
