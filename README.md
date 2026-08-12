# Wapy — Assistant WhatsApp pour restaurants

Wapy répond automatiquement, via WhatsApp, aux questions des clients d'un restaurant
à partir d'une fiche Google Sheet, et escalade à un humain ce qu'il ne sait pas.

Projet indépendant. Conception : `docs/superpowers/specs/`. Plan : `docs/superpowers/plans/`.

## Prérequis

- Python 3.10+
- WAHA (WhatsApp HTTP API) en Docker — pour le canal WhatsApp
- Une clé API Anthropic (`ANTHROPIC_API_KEY`)
- Un Google Sheet « fiche resto » (cf. `docs/fiche-template.md`) + `credentials.json`

## Installation

```bash
pip install -r requirements.txt
cp .env.example .env   # puis renseigner les valeurs
```

## Tests

```bash
python -m pytest -v      # backend
cd web && npm test       # front (Vitest)
```

## Secrets

`.gitignore` protège les fichiers connus ; il ne dit rien d'une clef collée dans
un fichier source. `tools/scan-secrets.sh` refuse les deux : noms de fichiers
interdits (`.env`, `credentials.json`, base SQLite, sessions WAHA) et clefs en
dur (Anthropic, OpenAI, Google, GitHub, Slack, AWS, Telegram, PEM).

À faire **une fois par clone** — le chemin des hooks est une config locale, elle
ne se transporte pas avec le dépôt :

```bash
git config core.hooksPath .githooks
```

Le même script tourne en CI (`.github/workflows/secrets.yml`) sur chaque push,
ce qui couvre les clones où le hook n'a pas été activé.

## Lancer en local

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
curl http://localhost:8000/health   # {"status":"ok","service":"Wapy"}
```

## Déploiement

Voir `docs/deploiement.md` (Docker Compose : WAHA + Wapy).
