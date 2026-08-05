# Déploiement Wapy (WAHA + Wapy)

Stack Docker Compose : WAHA (canal WhatsApp non-officiel) + Wapy (le cerveau).
WAHA reçoit les messages entrants et les POST sur le webhook de Wapy.

## 1. Préparer la fiche resto

- Créer le Google Sheet à partir de `docs/fiche-template.md` (3 onglets : Infos / Menu / FAQ).
- Le partager en édition avec l'e-mail du compte de service.
- Poser le fichier `credentials.json` (compte de service Google) à la racine du projet.

## 2. Configurer l'environnement

```bash
cp .env.example .env
```

Renseigner dans `.env` :
- `ANTHROPIC_API_KEY` (déjà disponible).
- `WAPY_MODEL` — laisser `claude-opus-4-8`, ou `claude-haiku-4-5` (~5x moins cher,
  recommandé pour un FAQ à fort volume) ou `claude-sonnet-4-6`.
- `SHEET_NAME` — le nom exact du Google Sheet.
- `STAFF_WHATSAPP_NUMBERS` — numéros du staff qui reçoivent les escalades,
  séparés par des virgules, format WAHA : `336XXXXXXXX@c.us`.
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (optionnel) — alertes techniques opérateur.

## 3. Lancer

```bash
docker compose up -d --build
curl http://localhost:8000/health   # {"status":"ok","service":"Wapy"}
```

## 4. Connecter le WhatsApp du resto

- Ouvrir le dashboard WAHA (`http://<host>:3000`) ou récupérer le QR :
  `GET http://<host>:3000/api/screenshot`.
- Le titulaire du compte scanne via WhatsApp → Réglages → Appareils liés → Lier un appareil.
- WAHA garde la session dans `./waha_sessions/`. Le téléphone du resto reste actif
  en parallèle (WAHA = appareil lié).

## 5. Smoke test (validation manuelle)

Depuis un AUTRE téléphone, écrire au numéro du resto :

1. **Question couverte par la fiche** (ex. « Vous êtes ouverts ce soir ? »)
   → vérifier une réponse auto, chaleureuse et courte.
2. **« je veux réserver »**
   → vérifier qu'une alerte arrive sur le WhatsApp du staff, et qu'aucune réponse
   auto n'est renvoyée au client (conversation escaladée = figée).
3. **« STOP »**
   → vérifier qu'aucune réponse n'est envoyée, et que les messages suivants de ce
   numéro restent sans réponse auto (opt-out).

## 6. Logs

```bash
docker compose logs -f wapy
docker compose logs -f waha
```
