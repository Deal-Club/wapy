# Obtenir `credentials.json` (compte de service Google)

Wapy lit la fiche resto dans Google Sheets via un **compte de service** Google.
Il faut générer une clé JSON une seule fois, puis partager le Sheet avec ce compte.

## 1. Créer / choisir un projet Google Cloud
1. Aller sur https://console.cloud.google.com/
2. En haut, sélecteur de projet → **Nouveau projet** (ex. « Wapy ») → **Créer**.

## 2. Activer les 2 API nécessaires
Dans le projet, menu → **APIs & Services → Bibliothèque**, puis activer :
- **Google Sheets API**
- **Google Drive API**

## 3. Créer le compte de service
1. **APIs & Services → Identifiants** (Credentials).
2. **+ Créer des identifiants → Compte de service**.
3. Nom : `wapy-sheets` → **Créer et continuer** → (rôles facultatifs) → **OK**.

## 4. Générer la clé JSON
1. Ouvrir le compte de service créé → onglet **Clés** (Keys).
2. **Ajouter une clé → Créer une clé → JSON** → **Créer**.
3. Un fichier `.json` se télécharge. **Renomme-le `credentials.json`** et place-le
   à la racine du projet : `d:\PROJETS\SCRAPING_PECCI\agmtec\wapy\credentials.json`.
   (Il est déjà dans `.gitignore` : ne jamais le committer.)

## 5. Récupérer l'e-mail du compte de service
Dans `credentials.json`, champ `client_email` — quelque chose comme
`wapy-sheets@ton-projet.iam.gserviceaccount.com`. Copie-le.

## 6. Importer la fiche dans Google Sheets et la partager
1. Ouvrir https://sheets.google.com → **Fichier → Importer → Importer** →
   déposer `docs/fiche-modele.xlsx` → **Insérer les feuilles**.
2. Renommer le classeur pour qu'il corresponde à `SHEET_NAME` du `.env`
   (par défaut « Wapy - Fiche Resto »).
3. Bouton **Partager** → coller l'e-mail du compte de service (étape 5) →
   rôle **Éditeur** → **Envoyer**.

## 7. Vérifier
- `.env` : `GOOGLE_CREDENTIALS_FILE=credentials.json` et `SHEET_NAME` = nom exact du classeur.
- Les onglets doivent rester nommés **Infos**, **Menu**, **FAQ** (ligne 1 = en-têtes).

C'est prêt : Wapy pourra lire la fiche.
