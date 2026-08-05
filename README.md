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
python -m pytest -v
```

## Lancer en local

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
curl http://localhost:8000/health   # {"status":"ok","service":"Wapy"}
```

## Déploiement

Voir `docs/deploiement.md` (Docker Compose : WAHA + Wapy).
