# Wapy — Plateforme SaaS multi-tenant
## Document de conception (spec)

- **Date** : 2026-08-05
- **Statut** : conception, à valider avant implémentation Phase 1
- **Contexte** : évolution du MVP mono-resto (Google Sheet) vers une plateforme
  self-service multi-établissements. Réutilise le cerveau existant (brain, handoff,
  safety, channel WAHA).

---

## 1. Vision

Chaque restaurant/entreprise **s'inscrit seul**, configure son assistant WhatsApp
via un **assistant guidé** (formulaire OU import Excel), **scanne son WhatsApp en
direct** dans le navigateur, et le bot répond immédiatement. Un **dashboard** permet
d'éditer la config, suivre les conversations, répondre aux escalades depuis le web,
et voir l'usage (base de la facturation).

Parcours = priorité n°1 : **le plus simple possible** pour un utilisateur non technique.

---

## 2. Stack

- **Backend** : FastAPI (Python) + **PostgreSQL** (SQLAlchemy + Alembic).
- **Frontend** : **Next.js (React)** — SPA, appelle l'API REST (JWT).
- **Canal** : **WAHA multi-sessions** (1 session WhatsApp par tenant, moteur NOWEB).
- **Auth** : email + mot de passe (hash bcrypt), JWT.
- **Reverse proxy / HTTPS** : **Caddy** (Let's Encrypt automatique) sur
  **`wapy.51.210.108.173.sslip.io`**.
- **Déploiement** : Docker Compose sur le VPS OVH (postgres, waha, api, web, caddy).
- **Réutilisé du MVP** : `brain/`, `handoff/`, `safety/`, `channel/` (WAHA),
  la logique d'orchestration du webhook, le flatten de fiche.

---

## 3. Modèle de données (PostgreSQL)

- `tenants` : id, nom établissement, slug, plan, créé_le.
- `users` : id, tenant_id, email (unique), password_hash, rôle, créé_le.
- `restaurant_info` : id, tenant_id, rubrique, contenu  *(≈ onglet Infos + consignes)*.
- `menu_items` : id, tenant_id, catégorie, plat, description, prix, régime.
- `faq` : id, tenant_id, question, réponse.
- `wa_sessions` : id, tenant_id, session_name (unique WAHA), statut, numéro lié.
- `conversations` : id, tenant_id, chat_id, role, contenu, créé_le.
- `conv_state` : tenant_id, chat_id, escalated, optout.
- `handoffs` : id, tenant_id, staff_number, client_id, resolved, créé_le.
- `processed_messages` : id (WAHA msg id), tenant_id.
- `usage_counters` : tenant_id, jour, messages_in, messages_out  *(facturation)*.

Isolation stricte : **toute requête est filtrée par `tenant_id`**.

La `fiche_text` injectée au cerveau est **construite en aplati** depuis
`restaurant_info` + `menu_items` + `faq` du tenant (même principe que le flatten actuel),
mise en cache par tenant avec TTL.

---

## 4. Routage multi-tenant

- Un seul WAHA, **une session par tenant** (`session_name = "t{tenant_id}"`).
- Le webhook WAHA POST `/webhook` contient `session` → on résout le **tenant**.
- Toute la logique du bot (garde-fous → cerveau → réponse/escalade/relais) tourne
  **dans le contexte du tenant** (sa config, ses conversations, ses numéros staff).

---

## 5. Parcours utilisateur (onboarding)

1. **Inscription** : email + mot de passe → création tenant + user.
2. **Configurer la fiche** : assistant multi-étapes
   - soit un **formulaire guidé** (nom, horaires, adresse, menu, consignes…),
   - soit **« importer un Excel »** : bouton *Télécharger le modèle* (xlsx pré-formaté,
     généré par l'API) → l'utilisateur remplit → **upload** → parse serveur (openpyxl)
     → **aperçu de validation** avant enregistrement en DB.
3. **Connecter WhatsApp** : l'API crée/démarre la session WAHA du tenant ; le front
   affiche le **QR en direct** (polling API), auto-rafraîchi, avec le **statut**
   (SCAN → WORKING ✅).
4. **Terminé** : invitation à s'envoyer un message test → le bot répond → effet « waouh ».

---

## 6. Dashboard (back-office)

- **Config** : éditer infos / menu / FAQ / **consignes** en formulaires (CRUD).
- **Conversations** : fil en direct par client.
- **Handoff web** : répondre aux escalades **depuis le navigateur** (en plus de
  WhatsApp) — envoie via l'API → WAHA → client ; `/fin` équivalent bouton « rendre au bot ».
- **WhatsApp** : statut de session + **reconnexion** (nouveau QR) en 1 clic.
- **Usage** : compteur messages (jour/mois) — socle de la facturation par abonnement.

---

## 7. API REST (FastAPI) — principales routes

- `POST /auth/signup`, `POST /auth/login` → JWT.
- `GET/PUT /api/config/info|menu|faq` (CRUD, scellé au tenant du JWT).
- `GET /api/template.xlsx` (télécharger le modèle) · `POST /api/import` (upload xlsx).
- `POST /api/wa/connect` (crée/démarre la session) · `GET /api/wa/qr` · `GET /api/wa/status`.
- `GET /api/conversations` · `POST /api/handoff/reply` · `POST /api/handoff/close`.
- `GET /api/usage`.
- `POST /webhook` (WAHA → routage par session, **non authentifié JWT**, protégé par clé WAHA).

---

## 8. Déploiement (sslip.io + HTTPS)

- Docker Compose : `postgres`, `waha`, `api` (FastAPI), `web` (Next.js), `caddy`.
- **Caddy** : `wapy.51.210.108.173.sslip.io` → `web` ; `/api/*` et `/webhook` → `api`.
  HTTPS automatique (Let's Encrypt). Ouvrir **80/443** sur le pare-feu OVH.
- Secrets via `.env` (DB, JWT secret, clé WAHA, `ANTHROPIC_API_KEY`).

---

## 9. Sécurité

- Mots de passe **hashés bcrypt** ; JWT signé ; refresh simple.
- **Isolation tenant** sur toutes les requêtes (jamais de fuite inter-tenant).
- WAHA non exposé publiquement (réseau Docker interne) ; clé API WAHA.
- Webhook protégé par la clé WAHA ; validation de la session.
- RGPD : données de conversation par tenant, à documenter (rétention, base légale).

---

## 10. Plan par phases (chacune livrée + validée en live)

- **P1 — Fondation backend** : Postgres + modèles + **auth (signup/login)** +
  config-en-DB + le bot lit la config DB par tenant + **routage multi-session WAHA**.
  *(remplace Google Sheet ; cœur le plus risqué)*
- **P2 — Onboarding web (Next.js)** : inscription + **assistant guidé** (formulaire
  **ou** upload/download Excel) + **QR live intégré** → jusqu'au bot qui répond.
- **P3 — Dashboard** : éditeur config, conversations, **handoff web**, statut WhatsApp, usage.
- **P4 — Mise en ligne** : Caddy + HTTPS sur `sslip.io`, ports, bascule prod.

Phases ultérieures (hors présent périmètre) : facturation Stripe, plans/quotas,
adaptateur officiel Meta (Embedded Signup) en option premium.

---

## 11. Ce qui est réutilisé tel quel

`brain/brain.py` (cerveau + consignes), `handoff/handoff.py`, `safety/guards.py`,
`channel/` (WAHA + clé API + reconnaissance @lid), la logique d'orchestration du
webhook, `fiche.flatten` (adapté pour lire la DB au lieu du Sheet).

Non réutilisé : `fiche/loader.py` gspread (remplacé par la lecture DB + import Excel),
la persistance SQLite (remplacée par PostgreSQL).
