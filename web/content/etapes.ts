/**
 * Les étapes réelles de la mise en route, dans l'ordre où la plateforme les
 * impose.
 *
 * Ancrage : génération assistée de la fiche (`saas/ai_config.py`, endpoint
 * `POST /api/ai/generate`, `saas/app.py:454`), édition de la fiche et import
 * d'un tableur (`POST /api/config`, `POST /api/import`, `saas/app.py:406,723`),
 * connexion WhatsApp par QR code (`GET /api/wa/qr`, `saas/app.py:1261` et
 * `saas/wa.py:73-79`), puis conduite des demandes jusqu'à leur enregistrement
 * et notification du responsable (`brain/brain.py:61-70`, `saas/bot.py`).
 *
 * Ces textes alimentent le balisage HowTo de `/comment-ca-marche` : chacun doit
 * se suffire à lui-même, un moteur pouvant restituer une étape isolée.
 */
export type Etape = { nom: string; texte: string };

export const ETAPES: Etape[] = [
  {
    nom: "Décrire votre activité",
    texte:
      "Vous créez votre compte, vous choisissez votre secteur dans une liste ou vous le saisissez librement, et vous décrivez votre établissement en quelques lignes. À partir de cette description, l'intelligence artificielle propose une première fiche : vos informations pratiques, un catalogue, des consignes et des questions fréquentes.",
  },
  {
    nom: "Corriger la fiche",
    texte:
      "Vous relisez cette proposition et vous la corrigez, car c'est elle et elle seule qui servira de source aux réponses. Horaires, adresse, moyens de paiement, prix, plats ou prestations : tout se modifie depuis le tableau de bord, colonne par colonne, ou s'importe depuis un tableur si vous en tenez déjà un.",
  },
  {
    nom: "Écrire vos consignes",
    texte:
      "Vous ajoutez les consignes propres à votre maison : quoi répondre à une demande de devis, quel lien envoyer pour une réservation, quel cas doit vous revenir directement. Vous pouvez aussi déposer des documents dans la base de connaissances et exclure les numéros auxquels l'assistant ne doit jamais répondre.",
  },
  {
    nom: "Connecter WhatsApp",
    texte:
      "Le tableau de bord affiche un QR code. Vous l'ouvrez depuis WhatsApp, dans les appareils liés, et vous le scannez, exactement comme pour WhatsApp Web. Votre numéro ne change pas, vos conversations restent en place, et vous pouvez délier le compte à tout moment depuis le tableau de bord.",
  },
  {
    nom: "Laisser l'assistant répondre",
    texte:
      "Les clients écrivent sur le même numéro qu'avant. L'assistant répond depuis votre fiche, pose les questions qui manquent, confirme, puis enregistre la réservation ou la commande dans votre carnet et vous envoie le récapitulatif. Il vous passe la main pour une réclamation ou un client qui demande à vous parler.",
  },
];
