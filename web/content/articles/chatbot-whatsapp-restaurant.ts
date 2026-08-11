import type { Post } from "./types";
import { CTA } from "./cta";

export const post: Post = {
    slug: "chatbot-whatsapp-restaurant",
    title: "Chatbot WhatsApp pour restaurant et maquis : ne perdez plus une commande",
    description:
      "Un chatbot WhatsApp pour restaurant répond aux clients, donne le menu et les prix, et note commandes et réservations 24h/24. Voici comment le mettre en place.",
    keywords: [
      "chatbot WhatsApp restaurant",
      "prendre les commandes sur WhatsApp",
      "assistant WhatsApp maquis",
      "répondre aux clients restaurant WhatsApp",
      "réservation restaurant WhatsApp",
    ],
    date: "2026-08-10",
    readingMin: 6,
    excerpt:
      "Menu, prix, horaires, réservations : votre restaurant reçoit les mêmes questions toute la journée sur WhatsApp. Un chatbot y répond pour vous, sans en rater une.",
    body: `
<p>Samedi soir, 20h30. La salle est pleine, la cuisine envoie, et le téléphone vibre sans arrêt : « Vous livrez à Akpakpa ? », « C'est quoi le plat du jour ? », « Une table pour six, c'est possible ? ». Vous ne pouvez pas lâcher le service pour répondre, alors les messages attendent. Le lendemain, la moitié de ces clients ont mangé ailleurs. Un <strong>chatbot WhatsApp pour restaurant</strong> répond à leur place, tout de suite, avec votre vrai menu et vos vrais prix. Voici comment il travaille, concrètement.</p>

<h2>Combien vous coûtent les messages non lus</h2>
<p>Un maquis reçoit facilement 15 à 30 messages par soir de rush. Si 5 d'entre eux sont des commandes que vous ne traitez pas à temps, à 4 000 FCFA en moyenne, c'est 20 000 FCFA qui s'envolent chaque soir de forte affluence. Sur un mois, on parle vite de <strong>plusieurs centaines de milliers de FCFA</strong> perdus, non pas parce que vos plats sont trop chers, mais parce que personne n'était libre pour répondre à temps. C'est exactement ce trou-là qu'un assistant vient boucher.</p>

<h2>Les questions qui reviennent chaque jour</h2>
<p>La plupart de vos messages sont toujours les mêmes :</p>
<ul>
  <li>Vous êtes ouverts ce soir ? Jusqu'à quelle heure ?</li>
  <li>C'est combien le poisson braisé ? Le poulet ?</li>
  <li>Vous livrez dans mon quartier ? C'est combien la livraison ?</li>
  <li>Je peux réserver une table pour ce soir ?</li>
</ul>
<p>Chacune mérite une réponse en quelques secondes. Un assistant qui connaît votre menu y répond sans jamais vous déranger en plein service.</p>

<h2>Un échange typique, du bonjour à la commande</h2>
<div class="article-chat">
  <p class="in">Bonsoir, le poisson braisé est dispo ce soir ?</p>
  <p class="out">Bonsoir 👋 Oui, poisson braisé disponible, c'est un tilapia sauce piment à 3 500 FCFA, accompagné d'attiéké ou de frites. Sur place ou en livraison ?</p>
  <p class="in">Livraison à Cadjèhoun, 2 portions</p>
  <p class="out">C'est noté : 2 poissons braisés à 3 500, soit 7 000 FCFA, plus 1 000 de livraison à Cadjèhoun. Total 8 000 FCFA. Vous confirmez la commande ?</p>
  <p class="in">Oui</p>
  <p class="out">Parfait, commande confirmée 🙏 Vous réglez par Mobile Money à la livraison. Notre équipe prépare et un livreur vous appelle en arrivant. Merci !</p>
</div>
<p>La commande arrive dans votre carnet, votre équipe reçoit une alerte, et vous n'avez pas quitté la cuisine une seconde.</p>

<h2>Ce qu'un bon assistant sait faire pour un restaurant</h2>
<h3>Donner le menu et les prix, sans jamais se tromper</h3>
<p>Vous entrez votre carte une fois dans un tableau (ou l'IA la génère et vous corrigez). L'assistant cite ensuite le bon plat au bon prix, exactement comme vous l'avez écrit. Si un client demande à voir un plat et que vous avez ajouté une photo, il peut l'envoyer. Aucun prix inventé, jamais.</p>
<h3>Noter commandes et réservations proprement</h3>
<p>Quand un client commande ou réserve, l'assistant récolte l'essentiel (plats, quantité, nombre de personnes, heure, adresse) et transmet une fiche claire à votre équipe. Fini la commande perdue au milieu d'un fil de discussion.</p>
<h3>Gérer livraison et paiement</h3>
<p>Zones de livraison, frais par quartier, Mobile Money : l'assistant répond selon ce que vous avez réglé et guide le client jusqu'au paiement. Moins d'allers-retours, plus de commandes bouclées.</p>

<h2>Les erreurs à éviter</h2>
<ul>
  <li><strong>Laisser un menu périmé.</strong> Un plat qui n'existe plus déçoit le client. Mettez à jour votre tableau, l'assistant suit aussitôt.</li>
  <li><strong>Ne pas préciser les zones de livraison.</strong> Sans zones ni frais clairs, l'assistant ne peut pas conclure. Renseignez-les une fois pour toutes.</li>
  <li><strong>Vouloir tout automatiser.</strong> Une grosse tablée, un événement, une réclamation : laissez l'assistant vous passer la main. Ces cas méritent votre voix.</li>
</ul>

<h2>Le service ne s'arrête jamais</h2>
<p>Un client qui écrit à 23h ou le lundi de fermeture obtient quand même une réponse et peut commander pour le lendemain. Vous captez des ventes qui, sinon, seraient parties chez le concurrent d'à côté, resté injoignable.</p>

<h2>Vous gardez la main sur la salle</h2>
<p>L'assistant gère le répétitif, mais dès qu'une demande compte vraiment, il vous prévient et vous reprenez la conversation en un clic depuis le tableau de bord ou WhatsApp. Vous restez le patron, l'assistant fait le tri.</p>

<h2>Mettre en place, étape par étape</h2>
<ol>
  <li><strong>Décrivez votre restaurant</strong> (cuisine, ambiance, horaires). L'IA propose une première carte et vos réponses fréquentes.</li>
  <li><strong>Ajustez le menu et les prix</strong> dans un tableau simple, ajoutez vos zones et frais de livraison, votre numéro Mobile Money.</li>
  <li><strong>Réglez les alertes</strong> : le numéro qui reçoit les commandes et les cas à transmettre (grosses tablées, événements).</li>
  <li><strong>Scannez le QR</strong> pour lier le WhatsApp du restaurant. C'est en ligne.</li>
</ol>

${CTA}

<h2>Questions fréquentes</h2>
<h3>Le chatbot peut-il prendre le paiement ?</h3>
<p>Il guide le client vers votre moyen de paiement (Mobile Money par exemple) selon ce que vous avez configuré, et enregistre la commande pour votre équipe. Vous restez maître de l'encaissement.</p>
<h3>Et si un client veut parler à quelqu'un ?</h3>
<p>L'assistant transmet la demande et vous prévient. Vous répondez vous-même depuis le tableau de bord ou WhatsApp, puis vous rendez la main au bot d'un clic.</p>
<h3>Peut-il gérer plusieurs commandes en même temps ?</h3>
<p>Oui. Chaque conversation est indépendante : l'assistant peut répondre à des dizaines de clients en parallèle sans les mélanger.</p>
<h3>Je peux changer le menu quand je veux ?</h3>
<p>À tout moment. Vous modifiez votre tableau et l'assistant répond aussitôt avec les nouvelles informations, sans manipulation technique.</p>
`,
  };
