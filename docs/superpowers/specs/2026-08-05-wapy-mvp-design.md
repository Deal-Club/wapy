# Wapy — Assistant WhatsApp pour restaurants (MVP v1)
## Document de conception (spec)

- **Date** : 2026-08-05
- **Produit** : Wapy
- **Statut** : conception validée, en attente de relecture avant plan d'implémentation
- **Projet** : indépendant (`agmtec/wapy/`), aucun lien de code avec `whatsapp-bot/`

---

## 1. Vision & positionnement

Wapy est un **assistant WhatsApp qui répond automatiquement aux clients d'un
restaurant** (messages entrants), avec un cerveau IA, et qui **passe la main à un
humain** quand il le faut.

Différence fondamentale avec le bot AGM TEC existant : celui-ci est **sortant**
(prospection à froid, viole les CGU WhatsApp, risque de ban structurel). Wapy est
**entrant** — on ne répond qu'aux gens qui écrivent d'abord. C'est l'usage *prévu*
par WhatsApp, donc le levier de ban n°1 (« contacter des inconnus en premier ») est
**éliminé par nature**.

**Proposition de valeur** : *« scanne ton WhatsApp et paff, ça marche »*.
Onboarding sans friction (scan d'un QR), un cerveau IA qui répond vraiment, et des
**garde-fous qui protègent le numéro du client**.

**Pourquoi meilleur que WAHA / waapi** : ce sont des tuyaux bruts (wrappers
non-officiels de WhatsApp Web) qui laissent l'utilisateur se faire bannir seul. Wapy
est le **cerveau + les garde-fous au-dessus du canal**, pas juste un canal de plus.

---

## 2. Périmètre de la v1 (MVP)

### Dans le périmètre
- Réception des messages entrants du WhatsApp du restaurant.
- Réponse automatique aux **questions** (FAQ) : horaires, adresse, menu, prix,
  terrasse, allergènes, parking, « êtes-vous ouverts ? », etc.
- Le contenu des réponses vient d'une **fiche restaurant** (base de connaissances)
  injectée dans le prompt de l'IA.
- **Escalade humaine** : quand le bot ne sait pas ou que le client le demande, un
  employé est notifié (Telegram) et reprend la main.
- **Garde-fous de protection du numéro** (voir §6).
- **Mono-restaurant** (un seul client réel, déjà prêt à tester).

### Hors périmètre (phases ultérieures, conçues pour s'emboîter, PAS codées en v1)
- **Réservations** (module phase 2) — dispo + enregistrement, avec confirmation stricte.
- **Commandes** (module phase 3) — le plus risqué (paiement, stock), volontairement repoussé.
- **Multi-tenant + facturation Stripe** (phase 4) — passage de 1 à N clients.
- **Dashboard web** — remplacé en v1 par l'escalade Telegram.
- **Adaptateur officiel Meta Cloud API** — préparé par l'abstraction, implémenté plus tard
  (option premium). En v1 : adaptateur non-officiel uniquement.
- **RAG / base vectorielle** — inutile pour un seul resto (la fiche tient dans le prompt).

### Justification du périmètre
FAQ + escalade = ~80 % de la valeur pour ~20 % du risque. Les réservations et les
commandes touchent à l'argent et aux erreurs graves → on les ajoute **après** avoir
prouvé que le socle tient en prod avec un vrai resto.

### Format de la fiche restaurant (base de connaissances)
La fiche est **construite avec le client** (des « fiches essais » d'abord). Format
retenu : **un fichier Markdown par resto**, choisi pour sa simplicité — se remplit à la
main en ~20 min, se glisse tel quel dans le prompt de Claude (pas de base vectorielle),
et se versionne dans git.

Sections de la fiche :
- **Identité & ton de voix** (nom, style de réponse : chaleureux/pro/décontracté)
- **Horaires** (jours, services, jours de fermeture)
- **Adresse, accès, parking**
- **Menu avec prix** (plats, formules, boissons)
- **Régimes & allergènes** (végé, sans gluten, etc.)
- **Politique de réservation** (même si les résas ne sont pas automatisées en v1 : le
  bot doit savoir quoi répondre et vers qui escalader)
- **FAQ courantes** (questions fréquentes + réponses validées)
- **À escalader systématiquement** (ce que le bot ne doit jamais traiter seul)

Le **template vierge de cette fiche** sera le tout premier livrable de
l'implémentation, prêt à remplir avec le resto.

---

## 3. Architecture

```
Client WhatsApp
      │  (message entrant)
      ▼
┌─────────────┐      ┌──────────────┐      ┌────────────────────┐
│   Canal     │─────►│   Cerveau    │─────►│  Décision           │
│ (abstrait + │      │   (Claude +  │      │  répondre / escalader│
│  adaptateur)│◄─────│  fiche resto)│      └─────────┬──────────┘
└─────┬───────┘      └──────┬───────┘                │
      │                     │                        ▼
      ▼                     ▼                 ┌────────────────────┐
┌─────────────┐      ┌──────────────┐         │  Escalade humaine   │
│ Garde-fous  │      │ Persistance  │         │  → staff du resto   │
│ (protection │      │ (SQLite:     │         │  sur WhatsApp        │
│  numéro)    │      │ conversations)│        └────────────────────┘
└──────┬──────┘      └──────────────┘
       │ alertes techniques (session, ban)
       ▼
  Telegram (opérateur Wapy)
```

### Composants

**Canal (`channel/`)** — interface abstraite `WhatsAppChannel` + **un** adaptateur
`UnofficialProvider` (WAHA en Docker). L'interface expose : recevoir un message
entrant (webhook), envoyer un message, statut de session (heartbeat). Le cerveau ne
sait PAS quel adaptateur est derrière → l'adaptateur officiel Meta se branchera plus
tard sans toucher au cerveau.

**Cerveau (`brain/`)** — appel Claude (`claude-*`). Le prompt système contient la
**fiche complète du restaurant** (menu, horaires, infos pratiques, ton de voix) + une
règle stricte : *« si l'information n'est pas dans la fiche, ne l'invente pas ;
escalade. »* Retourne soit une réponse texte, soit une décision d'escalade.

**Persistance (`store/`)** — SQLite. Tables minimales : `conversations` (par numéro
client : historique des messages, statut, timestamp), `escalations` (conversations
passées à l'humain). But : donner le contexte au cerveau et éviter le double-traitement.

**Escalade (`handoff/`)** — deux publics distincts :
- **Escalade client → staff du resto** : le bot envoie une alerte **sur le WhatsApp**
  d'un ou plusieurs employés (numéros configurés). L'employé répond ensuite au client
  **depuis le WhatsApp du resto sur son propre téléphone** (WAHA n'est qu'un appareil
  lié — la ligne reste active sur le mobile). Le bot **cesse de répondre
  automatiquement** à ce client (un humain a la main).
- **Alertes techniques → opérateur Wapy** : session qui saute, avertissement de ban →
  **Telegram** (réutilise le pattern `notifier.py` du projet existant). Public privé,
  hors resto.

**Garde-fous (`safety/`)** — voir §6.

**API (`app.py`)** — FastAPI. Endpoints : webhook entrant (WAHA POST ici), `/health`.

**Config (`config.py`)** — toute la configuration (comme le projet existant) : fiche
resto, clés API, bornes des garde-fous.

---

## 4. Flux de données (message entrant)

1. Un client envoie un message → WAHA le POST sur le webhook FastAPI.
2. Garde-fous d'entrée : est-ce un groupe / liste de diffusion ? → ignorer.
   Le client est-il en opt-out ou déjà escaladé (humain en main) ? → ne pas répondre auto.
3. Charger l'historique de conversation (SQLite) pour ce numéro.
4. Appeler le cerveau (Claude + fiche resto + historique).
5. Le cerveau décide :
   - **Réponse trouvée dans la fiche** → passer par les garde-fous de sortie (rythme
     humain, throttle) → envoyer via le canal → enregistrer.
   - **Info absente / demande d'humain / opt-out détecté** → escalader (alerte
     WhatsApp au staff du resto), marquer la conversation, ne plus répondre auto.
6. Enregistrer l'échange dans SQLite.

---

## 5. Risques & garde-fous IA

- **Hallucination** : en v1 (FAQ), risque faible mais réel (mauvais prix, faux
  horaire). Garde-fou : règle système stricte « ne rien inventer hors fiche →
  escalade ». Cette discipline prépare proprement réservations/commandes.
- **RGPD** : Wapy stocke des conversations de clients tiers. À documenter (base légale,
  durée de rétention, information des personnes). Non bloquant pour un pilote, mais à
  cadrer avant commercialisation.

---

## 6. Garde-fous « protection du numéro » (différenciateur produit)

Le modèle scan-and-go passe par la voie non-officielle → risque de ban. Wapy le
mitige. **Honnêteté à conserver** : ces garde-fous *réduisent* le risque, ils ne le
rendent pas nul — seul l'adaptateur officiel Meta l'élimine (option premium future).
En entrant, le risque est déjà bien plus faible qu'en sortant.

Garde-fous intégrés dès la v1 (repris/adaptés du bot AGM TEC) :
- **Ne jamais initier** de conversation avec un client — répondre uniquement (levier
  anti-ban n°1). Seule exception : les **alertes d'escalade vers le staff du resto**,
  limitées à une **liste blanche fixe** de numéros internes connus (contacts qui
  attendent ces messages) → risque négligeable.
- **Rythme humain** + throttle : pas de rafales si beaucoup de messages arrivent d'un coup.
- **Heartbeat de session** + alerte Telegram si le QR/session saute.
- **Détection d'avertissements WhatsApp** (« trop de messages », restriction) → pause
  auto + alerte (logique type `BAN_KEYWORDS`).
- **Respect opt-out** : un client dit stop → ne plus répondre auto, escalader.
- **Ignorer groupes / listes de diffusion.**
- Cap prudent sur le nombre de **nouveaux contacts distincts** répondus par jour.

---

## 7. Stack technique

- **Python 3.10+ + FastAPI** (webhook entrant) — reste dans la stack de l'équipe.
- **WAHA** (Docker) — adaptateur non-officiel (canal).
- **Claude** (`claude-*`, Anthropic) — cerveau.
- **SQLite** — persistance (suffisant pour un mono-resto).
- **WhatsApp** — escalade client → staff du resto (via le canal).
- **Telegram** — alertes techniques → opérateur Wapy (réutilise `notifier.py` existant).
- **Hébergement** : VPS OVH existant (`51.210.108.173`), à côté des autres services.

### Réutilisable du projet existant
- `notifier.py` (Telegram), structure `config.py`, scripts `_deploy/`, gestion d'état
  type `bot_state.json`.

### NON réutilisable
- Tout le Selenium (`whatsapp_sender.py`, `browser/`) — changement de paradigme
  (webhook + API au lieu de piloter un navigateur).

---

## 8. Stratégie d'onboarding & canal

- **v1** : adaptateur **non-officiel (WAHA)** — le client scanne un QR, ça marche.
  C'est le cœur de la proposition de valeur.
- **En parallèle** : lancer la **vérification Meta Tech Provider** (gratuite, mais
  longue) pour préparer l'adaptateur officiel.
- **Plus tard** : l'adaptateur **officiel Meta Cloud API** devient une **option
  premium** (fiabilité max, sans risque de ban) pour les clients qui acceptent que le
  numéro devienne une ligne dédiée. L'abstraction du canal rend cette bascule non
  destructive pour le reste du produit.

### Coûts (rappel)
- Vérification Meta / devenir Tech Provider : **gratuit** (exige une entreprise
  enregistrée + justificatifs).
- Officiel en prod : **facturé par Meta à l'usage** (par message ; modèle de
  tarification modifié en 2025 → vérifier la grille avant de fixer le prix d'abonnement).
- WAHA : **gratuit** → le MVP se valide sans dépense Meta.

---

## 9. Feuille de route (après le MVP)

| Phase | Contenu | Pourquoi après |
|---|---|---|
| **v1 (MVP)** | Socle : FAQ + escalade + garde-fous, mono-resto, WAHA | Valeur max / risque min |
| Phase 2 | Réservations (dispo + enregistrement, confirmation stricte) | Touche à la logistique du resto |
| Phase 3 | Commandes (menu, options, paiement) | Le plus risqué (argent, erreurs) |
| Phase 4 | Multi-tenant + Embedded Signup + facturation Stripe | Passage de 1 à N clients / SaaS |
| Transverse | Adaptateur officiel Meta (option premium) | Après vérif Meta obtenue |
| Transverse | Dashboard web (remplace/complète Telegram) | Quand N clients le justifient |

---

## 10. Critères de succès du MVP

- Le resto branche son WhatsApp par scan de QR sans intervention manuelle de Wapy.
- Le bot répond correctement aux questions couvertes par la fiche, en français.
- Le bot escalade proprement (Telegram) tout ce qu'il ne sait pas, sans inventer.
- Aucun message initié par le bot ; opt-out et groupes respectés.
- Le numéro du resto reste sain sur la durée du pilote (pas de restriction déclenchée).
