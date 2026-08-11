import type { QuestionReponse } from "./types";

/**
 * FAQ générale du site, rendue par `/faq` et balisée en FAQPage.
 *
 * Chaque réponse est soutenue par le code du produit, jamais par une intention
 * commerciale. Ancrages, dans l'ordre des questions : connexion par QR code au
 * compte existant (`saas/wa.py:73-79`, `saas/app.py:1248-1290`), interdiction
 * d'inventer une donnée absente de la fiche (`brain/brain.py:53-55`),
 * information manquante qui ne déclenche PAS de transfert (`brain.py:134-138`),
 * escalade rare et cadrée (`brain.py:119-133`), relais du responsable et
 * commande de retour au bot (`saas/bot.py:20,55-100`), réponses en français
 * uniquement (`brain.py:50-52`), isolement par établissement et mots de passe
 * hachés (`saas/app.py` via `tenant_id`, `saas/auth.py:20-28`), notes vocales
 * transcrites ou renvoyées à l'écrit (`saas/bot.py:214-228`,
 * `saas/transcribe.py`), enregistrement des demandes (`brain.py:61-70`), essai
 * de 7 jours et facturation en francs CFA (`saas/billing.py:14-15`), liste
 * d'exclusion (`saas/config_repo.py:27-30`, `saas/bot.py:192-197`), chat du
 * site web (`saas/webchat.py`), justificatifs jamais validés d'office
 * (`brain.py:104-109`), groupes et diffusions ignorés (`saas/bot.py:42`),
 * comptes collaborateurs limités par le plan (`saas/app.py:281-292`).
 *
 * Deux sujets sont absents à dessein : les montants, tant que la grille n'est
 * pas arrêtée (voir `content/plans.ts`), et les quotas de conversations de
 * `saas/billing.py:38,43`, qu'aucun code n'applique.
 */
export const FAQ_GLOBALE: QuestionReponse[] = [
  {
    q: "Faut-il changer de numéro WhatsApp ?",
    r: "Non. Wapy se branche sur le compte WhatsApp que vos clients connaissent déjà, en scannant un QR code depuis les appareils liés, comme pour WhatsApp Web. Votre numéro ne change pas, vos conversations restent en place, et vous pouvez délier le compte quand vous le décidez.",
  },
  {
    q: "Comment l'assistant se connecte-t-il à WhatsApp ?",
    r: "Par un QR code, et rien d'autre. Le tableau de bord affiche le code, vous le scannez depuis votre téléphone dans les appareils liés de WhatsApp, et la liaison est faite. Aucune démarche auprès de Meta, aucune vérification d'entreprise préalable.",
  },
  {
    q: "L'assistant peut-il inventer un prix ou un horaire ?",
    r: "Ses consignes lui interdisent d'avancer une donnée qui ne figure pas dans votre fiche : prix, horaire, disponibilité, identité d'un employé. C'est une instruction donnée au modèle, pas un verrou technique. Ce que contient votre fiche est donc ce qu'il dira : relisez-la avant d'ouvrir la ligne.",
  },
  {
    q: "Que fait l'assistant quand une information lui manque ?",
    r: "Il répond qu'il se renseigne et que quelqu'un reviendra vers le client, ou il pose une question de précision, ou il propose le moyen de contact inscrit dans votre fiche. Une information absente ne provoque pas de transfert automatique vers vous.",
  },
  {
    q: "Dans quels cas un humain reprend-il la conversation ?",
    r: "Quatre cas : le client demande à parler à quelqu'un, la conversation tourne à la réclamation ou au sujet sensible, un engagement ferme dépasse ce que la fiche prévoit, ou l'une de vos consignes l'exige. Une réservation ou une commande, elle, est menée jusqu'au bout.",
  },
  {
    q: "Comment reprendre la main sur une conversation en cours ?",
    r: "Quand l'assistant vous passe la main, l'alerte arrive sur votre WhatsApp : vous citez ce message et votre réponse part au client. Vous pouvez aussi répondre depuis le tableau de bord. Un mot convenu, « fin », rend ensuite la conversation à l'assistant.",
  },
  {
    q: "Dans quelle langue l'assistant répond-il ?",
    r: "En français, uniquement. C'est la seule langue prévue à ce jour, y compris lorsque le client écrit dans une autre. Si une partie de votre clientèle vous écrit en anglais ou dans une langue locale, pesez ce point avant de vous décider.",
  },
  {
    q: "Mes données sont-elles séparées de celles des autres établissements ?",
    r: "Oui. Chaque établissement a son espace : sa fiche, ses conversations, son carnet et son compte WhatsApp sont rattachés à son identifiant et ne sont lus que depuis son compte. Les mots de passe sont stockés hachés, jamais en clair.",
  },
  {
    q: "Que devient une note vocale envoyée par un client ?",
    r: "Avec l'option de transcription, la note est retranscrite et l'assistant répond à ce qu'elle contient. Sans cette option, ou si la transcription échoue, il remercie le client et lui demande d'écrire sa demande en quelques mots.",
  },
  {
    q: "Les commandes et les réservations sont-elles enregistrées ?",
    r: "Oui. Quand la demande est complète, l'assistant confirme au client puis l'inscrit dans votre carnet, classée en réservation, commande, paiement ou piste commerciale, avec son récapitulatif. Vous recevez la notification, et c'est lui qui poursuit la conversation.",
  },
  {
    q: "Combien coûte Wapy ?",
    r: "L'essai dure sept jours et n'engage à rien. Ensuite, l'abonnement est mensuel et facturé en francs CFA, réparti en trois plans qui se distinguent par les fonctions incluses. Les montants ne sont pas encore publiés sur ce site.",
  },
  {
    q: "Peut-on empêcher l'assistant de répondre à certains numéros ?",
    r: "Oui. Une liste d'exclusion est prévue dans le tableau de bord : un numéro qui y figure est ignoré, quelle que soit sa demande. Les numéros de votre équipe sont eux aussi reconnus et traités à part, pour que l'assistant ne leur réponde pas comme à des clients.",
  },
  {
    q: "Wapy répond-il aussi sur mon site web ?",
    r: "Oui, avec l'option prévue à cet effet : un module de discussion à poser sur votre site, alimenté par la même fiche que WhatsApp. Le visiteur n'a besoin d'aucun compte, et une demande d'humain vous est notifiée avec le fil de l'échange.",
  },
  {
    q: "Wapy encaisse-t-il les paiements de mes clients ?",
    r: "Non. Il peut indiquer le moyen de paiement inscrit dans votre fiche et enregistrer un justificatif reçu comme restant à vérifier, mais il ne déclare jamais un paiement validé de lui-même, et l'argent de vos clients ne passe pas par nous.",
  },
  {
    q: "Peut-on envoyer des campagnes ou des messages en nombre ?",
    r: "Non. Wapy répond aux messages qu'il reçoit, il n'en adresse pas à des listes. Il ne passe pas par l'interface professionnelle officielle de Meta, donc ni campagne, ni diffusion, ni relance de masse. Les groupes et les diffusions sont d'ailleurs ignorés.",
  },
  {
    q: "Combien de personnes peuvent accéder au tableau de bord ?",
    r: "Vous, plus les collaborateurs que vous invitez, dans la limite prévue par votre plan : un, trois, ou sans limite. Chaque invité reçoit ses propres identifiants et doit changer son mot de passe à la première connexion.",
  },
];
