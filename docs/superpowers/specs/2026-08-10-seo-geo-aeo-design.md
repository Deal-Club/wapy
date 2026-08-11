# Wapy — Architecture SEO / GEO / AEO

**Date** : 2026-08-10
**Périmètre** : site public `wapy/web` (Next.js 14, App Router)
**Objectif** : dominer les requêtes « chatbot WhatsApp + ville/pays » en Afrique
francophone (Bénin, Côte d'Ivoire, Sénégal, Cameroun, Togo) et devenir la source
citée par ChatGPT, Perplexity et Gemini sur ces intentions.

---

## En bref

On ajoute ~150 pages au site, réparties en quatre silos étanches, générées depuis
un socle de données typé plutôt qu'écrites une par une. Le maillage interne est
calculé par le code et vérifié au build. Chaque chiffre affiché porte une source.
La publication se fait par vagues, pas en un largage.

---

## Nom de domaine — préalable levé le 2026-08-11

Le domaine **`wapy.pro`** a été acquis. Le préalable bloquant décrit ci-dessous
est résolu : les critères de succès de ce spec redeviennent atteignables.

**Bascule** : définir `NEXT_PUBLIC_SITE_URL=https://wapy.pro` au build
(docker-compose `web`). `web/lib/site.ts` est le seul fichier du site portant une
URL ; canonical, sitemap, robots, JSON-LD et OpenGraph en dérivent tous.

**Attention à la marque** : le produit s'appelle **Wapy** (avec un y), présent
environ 150 fois dans le contenu publié, dans le nom d'entité du JSON-LD
`Organization` et dans `llms.txt`. Toute variante de domaine doit conserver cette
orthographe, sous peine d'affaiblir la consolidation d'entité auprès de Google et
des moteurs génératifs. Acquérir les variantes proches est recommandé pour
protéger la marque.

**Contexte historique** : le site tournait sur `wapy.51.210.108.173.sslip.io`, un
sous-domaine sans autorité que Google indexe mal et qu'aucun moteur génératif
n'aurait cité comme source fiable. Le chantier a été conçu pour être entièrement
paramétré par `NEXT_PUBLIC_SITE_URL` précisément pour rendre cette bascule
gratuite.

---

## Contraintes de contenu

- **Aucun client réel en production.** Le tenant Unico est un tenant de test. Aucune
  étude de cas client, aucun témoignage, aucun chiffre de résultat client ne peut
  être écrit. Toute affirmation de ce type serait une fabrication.
- **Preuves autorisées** : données techniques mesurées sur la plateforme, vraies
  captures du produit, expertise terrain africaine documentée (Mobile Money, formats
  de numéros, notes vocales, coupures réseau).
- **Images générées ≠ captures produit.** Les illustrations et schémas sont générés ;
  les captures d'interface sont prises sur l'application réelle. Une image générée
  ne sera jamais présentée comme une capture du produit.
- **Pas de faux avis, pas de commentaires injectés, pas d'astroturfing.** Ces
  pratiques relèvent du spam au sens des règles Google et brûleraient le domaine.

---

## 1. Architecture des pages

Règle fondatrice : **une intention de recherche = une page et une seule**.

```
/                                          Accueil (entité + conversion)
│
├── /chatbot-whatsapp/                      SILO GÉO
│   ├── [pays]/                             5 piliers pays
│   └── [pays]/[ville]/                     ~115 villes
│
├── /secteurs/[secteur]/                    SILO MÉTIER — 11 pages
│
├── /comparatif/                            SILO DÉCISION — 8 pages
│   ├── whatsapp-business-reponse-automatique/
│   ├── alternative-whatsapp-business/
│   ├── repondre-whatsapp-la-nuit/
│   ├── meilleur-chatbot-whatsapp-afrique-2026/
│   └── wapy-vs-[concurrent]/               × 4
│
├── /blog/[slug]/                           SILO INFORMATIONNEL
│
└── /a-propos/  /tarifs/  /faq/  /comment-ca-marche/    Pages entité & AEO
```

### Décisions structurantes

**Migration des 11 articles secteurs.** `/blog/chatbot-whatsapp-restaurant` vise en
réalité une requête commerciale. Laisser l'article et créer `/secteurs/restaurant`
à côté produirait une cannibalisation qui empêcherait les deux de classer. Les
articles sont donc **promus** vers `/secteurs/[secteur]`, avec redirection 301
permanente depuis l'ancienne URL et enrichissement en page hybride.

Articles concernés : `chatbot-whatsapp-restaurant`, `assistant-whatsapp-salon-de-beaute`,
`chatbot-whatsapp-boutique`, `assistant-whatsapp-hotel`, `assistant-whatsapp-clinique-pharmacie`,
`chatbot-whatsapp-immobilier`, `assistant-whatsapp-ecole`, `assistant-whatsapp-artisan`,
`assistant-whatsapp-agence-voyage`, `assistant-whatsapp-evenementiel-traiteur`,
`assistant-whatsapp-garage-auto`.

Les articles non sectoriels restent dans `/blog`.

**Pas de pages secteur × ville.** Une combinatoire `[pays]/[ville]/[secteur]`
produirait plus de 500 pages quasi identiques pour une demande de recherche
négligeable. À la place, chaque page ville contient une section « secteurs à
[Ville] » qui lie vers les pages secteur avec un contexte local réel.

**Le silo comparatif est prioritaire.** Il capte l'intention d'achat, il est la
source naturelle des réponses IA à « quel chatbot WhatsApp choisir », et WhatsApp
Business ne défend pas ces requêtes. Huit pages qui vaudront davantage que les 115
pages villes la première année.

---

## 2. Socle de données

```
web/content/
  pays.ts        5 entrées
  villes.ts      ~115 entrées
  secteurs.ts    11 entrées
  preuves.ts     chiffres mesurés sur la plateforme
  sources.ts     registre des sources citables
```

### Types

```ts
type Source = {
  id: string;
  label: string;      // "INSAE — RGPH4"
  url: string;
  consulteLe: string; // ISO
};

type Chiffre = {
  valeur: number;
  annee: number;
  source: string;     // id dans sources.ts — obligatoire
};

type Pays = {
  slug: string;              // "benin"
  nom: string;               // "Bénin"
  gentile: string;           // "béninois"
  indicatif: string;         // "+229"
  monnaie: "XOF" | "XAF";
  capitale: string;
  capitaleEconomique?: string;
  mobileMoney: string[];
  operateurs: string[];
  particularites: string[];  // ex. formats de numéro 8 vs 10 chiffres
  population?: Chiffre;
  angle: string;             // écrit à la main
};

type Ville = {
  slug: string;
  nom: string;
  pays: string;              // slug pays
  region: string;
  population?: Chiffre;
  quartiersAffaires: string[];
  secteursDominants: string[];  // slugs secteurs
  tier: 1 | 2 | 3;
  angle: string;             // écrit à la main, 200-400 caractères
};
```

Le champ `angle` est écrit **à la main pour chaque ville**. C'est le seul rempart
structurel contre la page vide, et le principal coût du silo géo.

### Sourcing des données

Les populations proviennent des instituts nationaux : INSAE (Bénin), ANSD
(Sénégal), INS (Côte d'Ivoire), BUCREP (Cameroun), INSEED (Togo). Les données
sont collectées pendant l'implémentation.

**Aucune donnée n'est inventée.** Là où aucune source fiable n'est trouvée, le
champ `population` reste absent et la page n'affiche pas de chiffre.

---

## 3. Garde-fous au build

Deux invariants, vérifiés automatiquement, qui séparent le pSEO de la ferme de
contenu.

**G1 — Aucun chiffre sans source.** Le type `Chiffre` rend `source` obligatoire et
un test vérifie que tout `source` référencé existe dans `sources.ts`. Le build
échoue sinon.

**G2 — Aucune page orpheline, minimum 3 liens entrants contextuels.** Une fonction
`auditMaillage()` parcourt le graphe des pages. Un test échoue si une page reçoit
moins de 3 liens depuis le corps de texte d'autres pages.

L'audit s'exécute sur **l'ensemble des pages publiées à un instant donné**, pas sur
le catalogue complet des 150. En fin de vague 1, les pays doivent donc être maillés
entre eux, avec les secteurs et les comparatifs, sans dépendre des pages villes qui
n'existent pas encore. Une ville en cours de rédaction mais non publiée est exclue
du graphe.

Un troisième contrôle, plus simple : `angle` doit faire au moins 150 caractères
pour toute ville et tout pays. Une ville sans angle rédigé ne génère pas de page.

---

## 4. Maillage interne calculé

Module `web/lib/maillage.ts`. Aucun lien inter-pages n'est écrit à la main.

| Depuis | Vers |
|---|---|
| Ville | Son pays (ancre exacte) + 3 villes de la même région + ses 3 secteurs dominants |
| Secteur | 5 villes majeures réparties sur les 5 pays |
| Pays | Ses villes groupées par région + 3 secteurs phares |
| Comparatif | Les 5 piliers pays + accueil |
| Blog | 2-3 pages du silo correspondant |

**Diversification des ancres** : chaque lien choisit sa formulation dans un jeu de
variantes par type de page, sélectionnée via un hash déterministe du slug source.
Le build reste reproductible et 115 pages ne pointent pas toutes avec le même texte.

**Concentration du PageRank** : le footer et le menu restent légers. Les 115 villes
ne sont accessibles que depuis leur page pays et leurs voisines. Aucune liste
globale de villes dans le footer, qui diluerait l'autorité sur tout le site.

---

## 5. Anatomie d'une page

Gabarit unique. L'ordre est significatif : les 30 % supérieurs sont la zone où les
moteurs génératifs prélèvent leurs réponses.

```
H1 · mot-clé exact
En bref              réponse directe, moins de 50 mots
Sommaire             liens d'ancrage
Corps                H2 formulés en questions
                     paragraphes de 2 à 4 lignes, phrases de moins de 20 mots
                     chaque bloc compréhensible isolément
Tableau              comparatif ou données locales
Bloc preuve          chiffre + année + source, capture réelle
Pages liées          maillage contextuel
FAQ                  5 à 8 questions, réponses de 40 à 60 mots
Auteur               nom, photo, lien LinkedIn
Dates                publication et dernière mise à jour, visibles
CTA
```

### Composants

`<EnBref>`, `<Sommaire>`, `<FAQ>`, `<TableauComparatif>`, `<BlocPreuve>`,
`<PagesLiees>`, `<Auteur>`, `<Dates>` — dans `web/components/seo/`.

---

## 6. Données structurées

Module unique `web/lib/schema.ts`, typé. Aucun JSON-LD écrit à la main dans une page.

| Page | Schémas |
|---|---|
| Layout global | `Organization`, `WebSite` |
| Accueil | `SoftwareApplication`, `Offer` |
| Pays / Ville | `Service` + `areaServed`, `FAQPage`, `BreadcrumbList` |
| Secteur | `Service`, `FAQPage`, `BreadcrumbList` |
| Comparatif | `ItemList`, `Article`, `FAQPage` |
| Blog | `BlogPosting` avec `author: Person` |
| /comment-ca-marche | `HowTo` |
| /tarifs | `AggregateOffer` |
| /faq | `FAQPage` |

---

## 7. Accès des robots

`web/app/robots.ts` est corrigé et étendu.

**Interdits** : `/dashboard`, `/onboarding`, `/admin`, `/login`, `/widget`
(actuellement `/admin`, `/login` et `/widget` sont autorisés à tort).

**Autorisés explicitement** : `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`,
`PerplexityBot`, `ClaudeBot`, `Claude-SearchBot`, `CCBot`, `Google-Extended`,
`Bingbot`, `Applebot-Extended`.

Sans cette autorisation explicite, aucune citation par un moteur génératif n'est
possible.

`web/public/llms.txt` est étendu : entité, chiffres sourcés, cartographie des pages
citables, positionnement face à WhatsApp Business.

---

## 8. Silo comparatif

| Page | Intention |
|---|---|
| `/comparatif/whatsapp-business-reponse-automatique` | Les réponses automatiques natives ne suffisent pas |
| `/comparatif/alternative-whatsapp-business` | Recherche active d'alternative |
| `/comparatif/repondre-whatsapp-la-nuit` | Douleur précise, faible concurrence |
| `/comparatif/meilleur-chatbot-whatsapp-afrique-2026` | Page destinée à la citation IA |
| `/comparatif/wapy-vs-[concurrent]` × 4 | Comparaison finale avant achat |

**Règle éditoriale du classement** : Wapy figure en première position, mais les
concurrents cités sont réels, leurs points forts sont exposés honnêtement, y compris
là où ils dépassent Wapy. Un classement auto-complaisant se fait contredire et perd
la confiance des moteurs génératifs, qui croisent les sources.

Les concurrents réels du marché africain sont identifiés par recherche pendant
l'implémentation. Ils ne sont pas inventés.

---

## 9. Hors-site

Livré comme playbook documenté (`docs/seo-playbook-hors-site.md`), exécuté
manuellement par l'équipe, pas par du code.

- Fiche Google Business Profile, cohérence NAP sur tous les annuaires
- Bing Webmaster Tools — seul outil gratuit mesurant réellement les citations IA
- Annuaires SaaS et IA pertinents
- Réponses utiles dans les groupes, forums et communautés où la question se pose

Explicitement exclus : faux avis, commentaires injectés, achats de mentions.

---

## 10. Dette technique traitée

`web/lib/blog.ts` fait 755 lignes pour 13 articles, corps HTML inclus en chaînes de
caractères. À 150 pages, le fichier devient impossible à maintenir.

**Refonte** : un fichier par article dans `web/content/articles/[slug].ts`, agrégés
par un index. Prérequis à toute création de contenu, pas une amélioration optionnelle.

---

## 11. Rendu et performance

- `generateStaticParams` sur toutes les routes dynamiques — rendu statique intégral
- `generateMetadata` par page : title, description, canonical absolue, OpenGraph
- Images OG générées via `opengraph-image.tsx`
- Images en WebP via `next/image`, attribut `alt` descriptif systématique
- Composants serveur par défaut, `"use client"` réservé aux composants interactifs

---

## 12. Visuels

- **Captures produit** : prises sur l'application réelle (dashboard, conversation,
  onboarding, carnet de réservations)
- **Illustrations et schémas** : générés, jamais présentés comme des captures
- Formats WebP, dimensions explicites pour éviter le décalage de mise en page

---

## 13. Publication par vagues

Un domaine neuf qui publie 150 pages en un jour émet un signal de ferme de contenu.

| Vague | Contenu | Volume |
|---|---|---|
| 1 | Fondations techniques, JSON-LD, robots, llms.txt, refonte `blog.ts`, 5 pays, 11 secteurs, 8 comparatifs, pages entité | ~30 |
| 2 | Villes tier 1 (capitales et grandes villes) | ~25 |
| 3 | Villes tier 2 | ~40 |
| 4 | Villes tier 3 | ~50 |

Environ deux semaines entre chaque vague.

**Découpage en plans d'implémentation.** Ce spec couvre la cible complète, mais il
est trop large pour un seul plan. Le premier plan d'implémentation traite
**uniquement la vague 1** : socle de données, garde-fous, maillage, composants,
schémas, robots, refonte de `blog.ts`, et les ~30 pages associées. Les vagues 2 à 4
sont de la production de contenu sur un moteur déjà construit et feront l'objet de
plans distincts, un par vague.

---

## 14. Mesure

- **Search Console** : impressions, positions, pages indexées par silo
- **Bing Webmaster Tools** : rapport AI Performance, requêtes de grounding
- **Suivi manuel hebdomadaire** : 25 prompts types (« quel chatbot WhatsApp pour un
  restaurant à Cotonou ? ») retestés dans ChatGPT, Perplexity et Gemini, en session
  neuve, avec relevé mention / citation / absence

### Critères de succès

Aucun n'est atteignable avant l'acquisition d'un vrai domaine.

1. Les 150 pages passent G1, G2 et le contrôle des angles
2. Zéro page orpheline dans le sitemap
3. Aucune erreur au test des résultats enrichis de Google
4. À 3 mois de domaine actif : au moins une citation IA sur les 25 prompts suivis
5. À 6 mois : top 3 sur « chatbot WhatsApp [capitale] » pour au moins 3 des 5 pays

---

## Hors périmètre

- Achat et configuration du nom de domaine (décision et action du propriétaire)
- Traduction anglaise et `hreflang` (à envisager après la vague 4)
- Backlinks payants
- Refonte graphique du site existant
