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
| Politique de réservation | Résa conseillée le week-end (le bot n'enregistre pas encore : escalade) |
| À escalader systématiquement | Réservations, commandes, réclamations, privatisations |

## Onglet `Menu` (5 colonnes)

| Catégorie | Plat | Description | Prix | Allergènes/Régime |
|---|---|---|---|---|
| Entrée | Salade César | Poulet, parmesan | 9€ | contient gluten |

## Onglet `FAQ` (2 colonnes)

| Question | Réponse |
|---|---|
| Vous avez une terrasse ? | Oui, chauffée et ouverte toute l'année. |
