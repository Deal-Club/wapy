# Wapy Plateforme — Phase 1 (Fondation backend)

> Réutilise `brain/`, `handoff/`, `safety/`, `channel/`. Nouveau package `saas/`.
> DB : PostgreSQL en prod, SQLite pour les tests. `Base.metadata.create_all` (Alembic plus tard).

**Objectif P1 :** un backend multi-tenant où un resto peut s'inscrire (auth), sa config
vit en base, et le bot répond en résolvant le tenant depuis la session WAHA — sans Google Sheet.

## Global Constraints
- Isolation stricte par `tenant_id` sur toute requête tenant-scoped.
- Mots de passe hashés bcrypt ; JWT signé (secret via env `JWT_SECRET`).
- Code agnostique DB (types génériques SQLAlchemy) pour tests SQLite + prod Postgres.
- Réutiliser `brain.Brain`, `handoff.escalate_to_staff`, `safety.guards`, `channel.WahaProvider`.

---

### Task 1 — Dépendances + DB (engine/session/Base) + modèles
**Files:** `requirements.txt` (maj), `saas/__init__.py`, `saas/db.py`, `saas/models.py`, `tests/saas/test_models.py`
- Ajouter : `sqlalchemy>=2.0`, `psycopg2-binary`, `bcrypt`, `pyjwt`, `python-multipart`, `email-validator`.
- `db.py` : `make_engine(url)`, `SessionLocal`, `Base`, `init_db(engine)` (create_all). `DATABASE_URL` env (défaut sqlite pour dev/test).
- `models.py` : `Tenant, User, RestaurantInfo, MenuItem, Faq, WaSession, Conversation, ConvState, Handoff, ProcessedMessage, UsageCounter`. FK `tenant_id`.
- Test : créer les tables en SQLite mémoire, insérer Tenant+User, requêter.

### Task 2 — Auth (hash + JWT + signup/login)
**Files:** `saas/auth.py`, `tests/saas/test_auth.py`
- `hash_password/verify_password` (bcrypt) ; `create_token(user_id, tenant_id)/decode_token` (pyjwt).
- `signup(session, email, password, resto_nom) -> (user, tenant)` : crée tenant + user, email unique (erreur si doublon).
- `authenticate(session, email, password) -> user | None`.
- Test : signup → login OK, mauvais mdp → None, email dupliqué → erreur, token round-trip.

### Task 3 — Config en DB + flatten fiche
**Files:** `saas/config_repo.py`, `tests/saas/test_config_repo.py`
- CRUD minimal : `set_info(tenant, rubrique, contenu)`, `add_menu_item(...)`, `add_faq(...)`, `list_*`.
- `build_fiche_text(session, tenant_id) -> str` : aplatit info+menu+faq (réutilise le format de `fiche.flatten`).
- Test : insérer config d'un tenant → `build_fiche_text` contient les valeurs ; isolation (un autre tenant ne voit pas).

### Task 4 — Store DB tenant-scoped
**Files:** `saas/store_db.py`, `tests/saas/test_store_db.py`
- `DbStore(session, tenant_id)` avec la MÊME interface que `ConversationStore` :
  `append, get_history, is_escalated, set_escalated, clear_escalated, is_optout, set_optout,
  is_processed, mark_processed, open_handoff, latest_open_handoff_client, resolve_handoffs_for_client`.
- Tout filtré par `tenant_id`. Test : mêmes cas que le store SQLite + isolation entre 2 tenants.

### Task 5 — Orchestration multi-tenant (réutilise le cerveau)
**Files:** `saas/bot.py`, `tests/saas/test_bot.py`
- `process_incoming(deps, tenant, payload) -> dict` : reprend la logique du webhook actuel
  (garde-fous → relais staff → optout → escalade bidirectionnelle → cerveau) mais avec
  `DbStore`, `build_fiche_text` (cache par tenant), et `staff_numbers/staff_recognize` du tenant.
- Test : reply, escalade, relais boss, /fin, forward client→staff, idempotence — avec fakes.

### Task 6 — API FastAPI (auth + webhook multi-tenant)
**Files:** `saas/app.py`, `tests/saas/test_app.py`
- `POST /auth/signup`, `POST /auth/login` (JWT).
- `POST /webhook` : lit `session` du payload WAHA → `WaSession` → tenant → `process_incoming`.
  Non authentifié JWT (trafic WAHA) ; à protéger par clé WAHA en P4.
- `GET /health`.
- Test : signup+login via API ; webhook route vers le bon tenant et déclenche une réponse (fakes).

### Task 7 — Provisioning session WAHA par tenant (min P1)
**Files:** `saas/wa.py`, `tests/saas/test_wa.py`
- `session_name(tenant_id) -> "t{id}"` ; `channel_for(tenant)` → `WahaProvider(base, session_name, api_key)`.
- `create_session(tenant)` (appel WAHA start + webhook config) ; `get_qr(tenant)` ; `status(tenant)`.
  (Les appels réseau WAHA sont fins ; tests sur `session_name`/`channel_for` + parsing.)

---
**Livrable P1** : `saas/` testé, un tenant peut s'inscrire et son bot répond via webhook
routé par session. Prêt pour P2 (onboarding web Next.js).
