# Template de fiche restaurant (Google Sheet)

Créer un Google Sheet nommé selon `config.SHEET_NAME`, partagé en édition avec
l'e-mail du compte de service (`credentials.json`). 3 onglets, ligne 1 = en-têtes.

## Onglet `Infos` (2 colonnes)

| Rubrique | Contenu |
|---|---|
| Nom | Chez Léon |
| Ton de voix | Chaleureux, tutoiement léger |
| Horaires | Mar-Dim 12h-14h / 19h-22h, fermé lundi |
| Adresse / Accès / Parking | 12 rue X, parking gratuit à 50 m |
| Politique de réservation | Résa conseillée le week-end |
| Lien de réservation | https://... (votre lien de résa en ligne, ou laissez vide) |
| Consigne : réservations | S'il y a un lien, envoyez-le au client ; sinon transmettez au responsable |
| Consigne : commandes | Prenez le détail puis transmettez au responsable |
| À escalader systématiquement | Réclamations, privatisations, événements, demande de parler à un humain |

> **Consignes** : dans l'onglet `Infos`, vous pouvez dicter le comportement du bot par
> des lignes « Consigne : … ». Le bot les suit (envoyer un lien, transmettre au
> responsable, etc.). C'est la surface de configuration propre à chaque établissement.

## Onglet `Menu` (5 colonnes)

| Catégorie | Plat | Description | Prix | Allergènes/Régime |
|---|---|---|---|---|
| Entrée | Salade César | Poulet, parmesan | 9€ | contient gluten |

## Onglet `FAQ` (2 colonnes)

| Question | Réponse |
|---|---|
| Vous avez une terrasse ? | Oui, chauffée et ouverte toute l'année. |
