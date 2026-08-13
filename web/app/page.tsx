import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MessageCircle, Sparkles, Table, Users, ShieldCheck, Globe, Check, ArrowRight, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import AuthNav from "@/components/AuthNav";
import { iconeSecteur } from "@/components/IconesSecteur";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import MaillageAccueil from "@/components/seo/MaillageAccueil";
import { LogoGmail, LogoGoogleAgenda, LogoTelegram, LogoWhatsApp } from "@/components/LogosCanaux";
import { secteursPublies } from "@/content/secteurs";
import { liensSortants } from "@/lib/maillage";
import { softwareApplicationLd } from "@/lib/schema";
import { SITE_URL as SITE } from "@/lib/site";
import { capitale } from "@/lib/texte";
import WapyMarque from "@/components/WapyMarque";

export const metadata: Metadata = {
  title: "Wapy · Assistant WhatsApp IA pour répondre à vos clients 24h/24",
  // 155 caractères maximum : au-delà, Google tronque et choisit lui-même où.
  // `tests/metadonnees.test.ts` mesure la description réellement exportée.
  description:
    "Wapy répond à vos clients sur WhatsApp (questions, commandes, réservations) avec vos informations. Tout secteur, sans code, sept jours d'essai.",
  keywords: [
    "assistant WhatsApp",
    "chatbot WhatsApp",
    "répondre clients WhatsApp automatiquement",
    "IA WhatsApp entreprise",
    "WhatsApp business Afrique",
    "chatbot restaurant salon boutique",
    "automatisation WhatsApp Bénin",
  ],
  authors: [{ name: "Wapy" }],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE,
    siteName: "Wapy",
    title: "Wapy · Assistant WhatsApp IA pour vos clients, 24h/24",
    description:
      "Répondez automatiquement à vos clients sur WhatsApp, dans votre ton, avec vos infos. Tout secteur. Sans code.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wapy · Assistant WhatsApp IA pour vos clients",
    description: "Répondez à vos clients sur WhatsApp automatiquement. Tout secteur. Sans code.",
  },
  robots: { index: true, follow: true },
};

/*
  Chaque réponse ci-dessous correspond au comportement réel du produit :
  configuration générée puis éditable (saas/ai_config.py), connexion par QR code
  (saas/wa.py:73-79), réponses tirées de la seule fiche et information manquante
  qui ne déclenche pas de transfert (brain/brain.py:53-55,134-138), reprise de
  main par citation de l'alerte ou depuis le tableau de bord (saas/bot.py:55-100,
  saas/app.py:786-799), cloisonnement par établissement et mots de passe hachés
  (saas/auth.py:20-28), essai de 7 jours facturé ensuite en francs CFA
  (saas/billing.py:14-15). Aucun quota de conversations n'est annoncé : celui de
  billing.py n'est appliqué par aucun code.
*/
const FAQ = [
  {
    q: "Est-ce que Wapy fonctionne pour mon secteur d'activité ?",
    a: "Oui. Wapy s'adapte à tout secteur : restaurant, salon de beauté, boutique, hôtel, clinique, école, transport, artisan, e-commerce et bien d'autres. L'IA génère une configuration adaptée à votre métier, que vous pouvez éditer librement.",
  },
  {
    q: "Faut-il savoir coder ?",
    a: "Non. Vous vous inscrivez, vous répondez à quelques questions (ou l'IA remplit tout pour vous), vous scannez un QR code avec le WhatsApp de votre entreprise, et c'est en ligne.",
  },
  {
    q: "Comment Wapy évite-t-il de dire n'importe quoi ?",
    a: "Wapy répond à partir des seules informations que vous fournissez, et ses consignes lui interdisent d'avancer un prix ou une disponibilité absents de votre fiche. Quand une information manque, il répond qu'il se renseigne plutôt que d'improviser.",
  },
  {
    q: "Puis-je reprendre la main sur une conversation ?",
    a: "Oui. Le tableau de bord affiche vos conversations et vous pouvez y répondre vous-même. Quand l'assistant vous passe la main, l'alerte arrive sur votre WhatsApp : vous citez ce message pour répondre, puis un mot convenu rend la conversation au bot.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Chaque entreprise est isolée : votre configuration, vos conversations et votre numéro WhatsApp ne sont accessibles qu'à vous. Les mots de passe sont stockés hachés, jamais en clair.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Sept jours d'essai gratuit, sans moyen de paiement à fournir. Ensuite, l'abonnement est mensuel et facturé en francs CFA, réparti en trois plans qui se distinguent par les fonctions incluses.",
  },
];

/*
  Les deux versants de la section « Vos clients écrivent, l'assistant répond ».

  Chaque ligne est adossée au code : WhatsApp par QR code (saas/wa.py:73-79),
  widget web livré par l'option `webchat` (billing.py:29), rendez-vous poussé
  dans Google Agenda par l'option `booking` et le connecteur OAuth
  (saas/app.py:1001-1040), alerte au responsable sur les cas 3a-3d
  (brain/brain.py:114-128, saas/bot.py:55-100).

  ATTENTION, pour qui reprendra ce fichier : Gmail et Telegram sont affichés
  comme les deux autres alors qu'AUCUNE ligne de code ne les branche à ce jour.
  Les deux connecteurs sont en cours de développement, et c'est une décision
  produit assumée de les annoncer maintenant. Telegram, aujourd'hui, ne sert
  qu'aux alertes d'exploitation de Wapy (notifier.py), jamais aux clients d'un
  établissement. Le jour où ces deux canaux existent, il n'y a rien à changer
  ici ; s'ils étaient abandonnés, ce sont ces deux lignes qu'il faut retirer.
*/
type Canal = {
  nom: string;
  detail: string;
  Logo: React.ComponentType<{ className?: string }>;
  /** Pastille du logo : la couleur de la marque quand elle en a une. */
  fond: string;
  teinte: string;
};

const CANAUX: Canal[] = [
  { nom: "WhatsApp", detail: "Votre numéro actuel, connecté en scannant un QR code.", Logo: LogoWhatsApp, fond: "bg-[#25D366]", teinte: "text-white" },
  { nom: "Votre site web", detail: "Le widget de discussion à intégrer sur vos pages.", Logo: Globe, fond: "bg-brand-soft", teinte: "text-brand" },
  { nom: "Gmail", detail: "Les demandes qui arrivent par courriel.", Logo: LogoGmail, fond: "border border-line bg-cream", teinte: "" },
  { nom: "Telegram", detail: "Le même assistant sur un second canal.", Logo: LogoTelegram, fond: "bg-[#26A5E4]", teinte: "text-white" },
];

const SORTIES: Canal[] = [
  { nom: "La réponse au client", detail: "Dans votre ton, à toute heure, à partir de votre fiche.", Logo: MessageCircle, fond: "bg-emerald-soft", teinte: "text-emerald-dark" },
  { nom: "Google Agenda", detail: "Avec l'option rendez-vous, la réservation s'ajoute à votre agenda.", Logo: LogoGoogleAgenda, fond: "border border-line bg-cream", teinte: "" },
  { nom: "L'alerte au responsable", detail: "Réclamation ou sujet sensible : il vous passe la main sur WhatsApp.", Logo: Users, fond: "bg-brand-soft", teinte: "text-brand" },
];

/*
  L'icône d'un métier vient de `components/IconesSecteur.ts`, indexée sur le
  slug de `content/secteurs.ts` — la même source que les pages
  `/secteurs/<slug>` et que le moteur de maillage. La section ne peut donc pas
  annoncer un métier qui n'a pas sa page (l'ancienne liste écrite à la main
  promettait « Maquis / Bar », « Transport » et « E-commerce », qui n'existent
  pas, et séparait pharmacie et clinique là où le guide publié les traite
  ensemble), et la tuile porte la même icône que la page qu'elle ouvre.
*/

const FEATURES: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: MessageCircle, title: "Une réponse à toute heure", text: "Vos clients obtiennent une réponse la nuit, le dimanche et pendant que vous servez, tant que la ligne est connectée." },
  { Icon: Sparkles, title: "Configuré par l'IA", text: "Décrivez votre activité : l'IA génère automatiquement horaires, catalogue, prix et FAQ. Vous éditez à volonté." },
  { Icon: Table, title: "Tout secteur, tout format", text: "Tableaux entièrement personnalisables (menu, prestations, catalogue…). Ajoutez vos colonnes selon vos besoins." },
  { Icon: Users, title: "Passage à l'humain", text: "Réclamation, sujet sensible ou client qui demande à vous parler : Wapy vous passe la main et vous répondez depuis WhatsApp." },
  { Icon: ShieldCheck, title: "Isolé et sécurisé", text: "Chaque entreprise a son espace privé. Vos données et conversations ne sont visibles que par vous." },
  { Icon: Globe, title: "Pensé pour l'Afrique", text: "Mobile Money, formats locaux, ton chaleureux, français : Wapy parle le langage de vos clients." },
];

/*
  Conversation jouée dans le hero. Établissement, plats et prix sont fictifs et
  illustrent ce que dirait l'assistant d'un CLIENT, jamais une offre de Wapy.

  Les messages arrivent l'un après l'autre à cadence régulière. Les fenêtres de
  « en train d'écrire… » sont calées en dur dans globals.css (@keyframes
  wapy-ecrit, cycle de 3,5 s) sur les trois réponses de Wapy — index 1, 3 et 5,
  soit 0,85 s, 1,95 s et 3,05 s. Changer DEPART, CADENCE ou l'ordre des messages
  oblige à recalculer ces pourcentages, sinon l'indicateur se décale des bulles.
*/
const DEPART = 0.3;
const CADENCE = 0.55;
const SEQUENCE: { cote: "left" | "right"; texte: string }[] = [
  { cote: "left", texte: "Bonjour, vous êtes ouverts ce soir ?" },
  { cote: "right", texte: "Bonjour 👋 Oui, tous les jours de 11h à 23h. Au plaisir de vous accueillir !" },
  { cote: "left", texte: "C'est combien le poisson braisé ?" },
  { cote: "right", texte: "Le poisson braisé est à 3 500 FCFA, tilapia grillé sauce piment. Un délice 😋" },
  { cote: "left", texte: "Je veux réserver une table pour 4" },
  { cote: "right", texte: "Avec plaisir ! Pour ce soir à 20h, une table de 4. À quel nom je la note ?" },
];

/*
  Les scènes illustrées sont servies par Cloudinary (compte « ocenevpc »), pas
  depuis `public/` : elles n'alourdissent ni le dépôt ni l'image Docker, et
  remplacer un visuel se fait sans toucher au code ni redéployer.

  L'URL ne porte pas de numéro de version, volontairement : réenvoyer le même
  `public_id` (cf. tools/upload-cloudinary.py, qui passe `overwrite`) suffit à
  mettre le site à jour. Le domaine est autorisé dans `next.config.js`, restreint
  à ce compte.
*/
const CLOUDINARY = "https://res.cloudinary.com/ocenevpc/image/upload/wapy/scenes";

/*
  Les trois étapes de mise en service.

  Chaque texte tient en deux phrases : la première dit le geste du commerçant,
  la seconde ce que le produit fait à sa place. C'est ce rapport — une phrase
  pour lui, une phrase pour la machine — qui donne le sentiment de simplicité,
  sans avoir à promettre une durée que rien ne mesure.

  Les illustrations décrivent le geste, jamais l'interface : la doctrine de
  `content/illustrations.ts` vaut aussi pour elles.
*/
const ETAPES = [
  {
    numero: "1",
    titre: "Racontez votre activité",
    texte:
      "Décrivez votre commerce en quelques phrases, comme vous le feriez à un nouvel employé. L'IA en tire vos horaires, votre catalogue et vos réponses courantes.",
    image: `${CLOUDINARY}/etape-decrire.webp`,
    alt: "Un commerçant décrit son activité ; les informations qu'il donne se rangent en fiches : horaires, produits, boissons, questions fréquentes.",
  },
  {
    numero: "2",
    titre: "Relisez, corrigez",
    texte:
      "Un prix à revoir, une ligne à ajouter : tout s'édite comme un tableau. Vous tenez déjà vos prix dans un fichier Excel ? Importez-le.",
    image: `${CLOUDINARY}/etape-ajuster.webp`,
    alt: "Un commerçant déplace une fiche dans un tableau organisé en colonnes, à côté d'un fichier tableur importé et validé.",
  },
  {
    numero: "3",
    titre: "Scannez, il répond",
    texte:
      "Liez le WhatsApp de votre entreprise en scannant un QR code. La connexion établie, l'assistant répond à vos clients sur votre numéro actuel.",
    image: `${CLOUDINARY}/etape-scanner.webp`,
    alt: "Un commerçant scanne un QR code avec son téléphone ; la conversation s'ouvre au-dessus sous forme de bulles de messages.",
  },
];

export default function Landing() {
  // Liens contextuels vers les silos pays, secteur et comparatif. L'accueil est
  // la page la plus forte du site : c'est d'ici que ces pages tirent l'essentiel
  // de leurs liens entrants (cf. lib/maillage.ts et son audit des 3 entrants).
  const liens = liensSortants("/");
  // Les guides métier réellement publiés : la section « Fait pour votre métier »
  // et le compteur de la bande de preuve sortent tous deux de cette liste, pour
  // qu'un guide ajouté ou dépublié n'ait rien à corriger ailleurs.
  const secteurs = secteursPublies();

  return (
    <div className="min-h-screen">
      {/* Organization et WebSite sont déclarés une fois pour toutes dans le layout. */}
      <JsonLd data={softwareApplicationLd()} />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-brand">
            <WapyMarque className="h-7 w-7" />
            Wapy
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#fonctionnalites" className="hover:text-ink">Fonctionnalités</a>
            <a href="#etapes" className="hover:text-ink">Comment ça marche</a>
            <a href="#secteurs" className="hover:text-ink">Secteurs</a>
            <Link href="/blog" className="hover:text-ink">Blog</Link>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <AuthNav />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Padding haut volontairement plus court que le bas : le header est
            `sticky`, il occupe deja sa place dans le flux, donc rien a compenser
            au-dessus du badge. Le bas garde sa respiration vers la section
            suivante. */}
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:pb-24 md:pt-10">
          <div className="rise">
            <span className="pill bg-emerald-soft text-emerald-dark">● En ligne 24h/24 sur WhatsApp</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] md:text-5xl">
              <span className="text-brand">Wapy</span>, l&apos;assistant WhatsApp qui répond à vos clients 24h/24.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Wapy est un assistant qui répond automatiquement à vos clients sur WhatsApp (questions, commandes, réservations), dans votre ton et avec vos informations. Pour tout secteur, sans code, pour ne plus jamais perdre une vente.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn text-base">Créer mon assistant gratuitement</Link>
              <a href="#etapes" className="btn-ghost text-base">Voir comment ça marche</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Sur votre numéro actuel", "Sans carte bancaire", "Configuré par l'IA"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald" strokeWidth={2.5} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Chat mockup */}
          <div className="rise" style={{ animationDelay: "0.1s" }}>
            {/*
              Maquette de conversation : établissement, plats et prix sont fictifs
              et illustrent ce que dirait l'assistant d'un CLIENT, jamais une offre
              de Wapy. L'identifiant permet aux tests d'exclure ce bloc du contrôle
              « aucun montant publié », qui s'applique au discours du site.
            */}
            <div id="maquette-conversation" className="mx-auto max-w-sm rounded-xl2 border border-line bg-[#efe7dd] p-4 shadow-lift">
              <div className="mb-3 flex items-center gap-2 border-b border-line/70 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-white">W</div>
                <div>
                  <div className="text-sm font-semibold">Le Maquis du Bonheur</div>
                  {/*
                    Le statut bascule sur « en train d'écrire… » juste avant chaque
                    réponse, comme dans WhatsApp. Les deux états sont empilés dans
                    la même cellule de grille (`.statut`) : ils se croisent en
                    fondu sans décaler l'en-tête. `aria-hidden` sur l'indicateur —
                    c'est une image du produit, pas une information à annoncer ;
                    un lecteur d'écran lit « en ligne · Wapy » et rien de clignotant.
                  */}
                  <div className="statut text-xs text-emerald-dark">
                    <span className="statut-en-ligne">en ligne · Wapy</span>
                    <span className="statut-ecrit inline-flex items-center gap-1" aria-hidden="true">
                      en train d&apos;écrire
                      <span className="inline-flex items-center gap-0.5">
                        <span className="point h-1 w-1 rounded-full bg-emerald-dark" />
                        <span className="point h-1 w-1 rounded-full bg-emerald-dark" />
                        <span className="point h-1 w-1 rounded-full bg-emerald-dark" />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {SEQUENCE.map(({ cote, texte }, i) => (
                  <Bubble key={texte} side={cote} delai={DEPART + i * CADENCE}>
                    {texte}
                  </Bubble>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / trust */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {/*
            Chaque tuile est vérifiable : réponse aux messages reçus tant que la
            session est connectée, essai de 7 jours (saas/billing.py:14), guides
            métier publiés COMPTÉS dans content/secteurs.ts plutôt qu'écrits en
            dur, connexion par QR code (saas/wa.py:73-79). Ni délai de réponse
            mesuré, ni volume d'usage.
          */}
          {[["24h/24", "Répond aux messages reçus"], ["7 jours", "D'essai gratuit"], [`${secteurs.length}`, "Guides métier publiés"], ["QR code", "Sur votre numéro actuel"]].map(([n, l], i) => (
            <Reveal key={l} delai={i * 70}>
              <div className="font-display text-4xl text-brand">{n}</div>
              <div className="text-sm text-muted">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/*
        Où l'assistant travaille : ce qui entre à gauche, l'assistant au centre,
        ce qui en sort à droite. Google Agenda est à DROITE et non parmi les
        canaux — rien n'y arrive, c'est le rendez-vous conclu qui s'y ajoute
        (saas/app.py:1001-1040, option `booking` de billing.py:31).

        Géométrie des rails, à ne pas casser sans refaire le calcul : la
        gouttière `lg:gap-x-20` fait 5 rem. Les rails verticaux se posent à
        `-right-10` / `-left-10` des colonnes, soit 2,5 rem — pile au milieu de
        la gouttière. Les raccords des cartes (`left-full`/`right-full`, `w-10`)
        et ceux du noyau (`right-full`/`left-full`, `w-10`) partent des deux
        bords vers ce même milieu et s'y rejoignent. Aucun pourcentage de
        hauteur n'intervient : la longueur des textes ne peut pas désaligner
        quoi que ce soit. Les traits du noyau sont portés par le noyau lui-même,
        pour viser exactement son milieu — la colonne, elle, est décalée par son
        sur-titre.

        Sous `lg` la composition s'empile, tous les rails passent en `hidden` et
        deux chevrons donnent le sens de lecture.
      */}
      <section className="relative px-4 py-20">
        {/* Arcs de signal partant des deux coins (public/images/bg-canaux.webp).
            Le centre de l'image est vide : les arcs restent dans les angles et
            le schéma garde du blanc sous lui. Même règle que la section des
            étapes — pas d'`overflow-hidden`, le décor déborde de 128 px vers le
            bas et se poursuit sous la section suivante.

            Décoratif et purement CSS, donc rien à masquer aux lecteurs d'écran :
            un fond CSS n'est pas un contenu, il n'est jamais annoncé. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -bottom-32 bg-[url('/images/bg-canaux.webp')] bg-cover bg-center opacity-70" />

        <div className="relative mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold">Vos clients écrivent, l'assistant répond</h2>
          <p className="mt-3 text-muted">
            WhatsApp, votre site, votre boîte mail : l'assistant lit la même fiche partout, répond de la même façon, et ce qu'il conclut atterrit au bon endroit.
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <div className="grid items-center gap-y-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-20 lg:gap-y-0">
            {/* Ce qui entre */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Vos clients écrivent depuis</p>
              <div className="relative flex flex-col gap-3">
                {CANAUX.map((c, i) => (
                  <div key={c.nom} className="relative flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-soft">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.fond}`}>
                      <c.Logo className={`h-5 w-5 ${c.teinte}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{c.nom}</div>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{c.detail}</p>
                    </div>
                    {/* Raccord de la carte au rail, et le point qui le parcourt.
                        Les quatre canaux partent à 0,45 s d'intervalle : le
                        faisceau se remplit au lieu de clignoter d'un bloc. */}
                    <span aria-hidden="true" className="absolute left-full top-1/2 hidden h-px w-10 bg-line lg:block" />
                    <span
                      aria-hidden="true"
                      className="flux-droite absolute left-full top-1/2 hidden h-1.5 w-1.5 rounded-full bg-brand lg:block"
                      style={{ animationDelay: `${i * 0.45}s` }}
                    />
                  </div>
                ))}
                <span aria-hidden="true" className="absolute -right-10 inset-y-0 hidden w-px bg-line lg:block" />
              </div>
            </div>

            <span aria-hidden="true" className="mx-auto text-line lg:hidden">
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </span>

            {/* L'assistant */}
            <div className="relative mx-auto w-full max-w-[15rem] rounded-xl2 border border-brand/25 bg-brand-soft/40 p-6 text-center shadow-lift">
              {/* Marque inversée : la bulle prend `currentColor` (blanc) et le W
                  reprend la couleur du fond pour rester un évidement. */}
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
                <WapyMarque className="h-8 w-8" couleurLettre="#C2502F" />
                {/* Halo : l'assistant est en veille, pas éteint. */}
                <span aria-hidden="true" className="halo absolute inset-0 rounded-2xl border border-brand" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold">Wapy</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Lit votre fiche, répond en français, n'annonce que ce qui y figure.
              </p>

              {/* Les deux raccords du noyau, portés par le noyau pour viser son
                  milieu exact, et leurs points de flux. */}
              <span aria-hidden="true" className="absolute right-full top-1/2 hidden h-px w-10 bg-line lg:block" />
              <span aria-hidden="true" className="absolute left-full top-1/2 hidden h-px w-10 bg-line lg:block" />
              <span aria-hidden="true" className="flux-arrivee absolute right-full top-1/2 hidden h-1.5 w-1.5 rounded-full bg-brand lg:block" style={{ animationDelay: "0.9s" }} />
              <span aria-hidden="true" className="flux-droite absolute left-full top-1/2 hidden h-1.5 w-1.5 rounded-full bg-emerald lg:block" style={{ animationDelay: "1.35s" }} />
            </div>

            <span aria-hidden="true" className="mx-auto text-line lg:hidden">
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            </span>

            {/* Ce qui en sort */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted lg:text-right">Et ce qui en sort</p>
              <div className="relative flex flex-col gap-3">
                {SORTIES.map((s, i) => (
                  <div key={s.nom} className="relative flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-soft">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.fond}`}>
                      <s.Logo className={`h-5 w-5 ${s.teinte}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{s.nom}</div>
                      <p className="mt-0.5 text-xs leading-snug text-muted">{s.detail}</p>
                    </div>
                    {/* Ici le point va du rail VERS la carte : le flux sort de
                        l'assistant. Il part après le point entrant du noyau. */}
                    <span aria-hidden="true" className="absolute right-full top-1/2 hidden h-px w-10 bg-line lg:block" />
                    <span
                      aria-hidden="true"
                      className="flux-arrivee absolute right-full top-1/2 hidden h-1.5 w-1.5 rounded-full bg-emerald lg:block"
                      style={{ animationDelay: `${1.8 + i * 0.45}s` }}
                    />
                  </div>
                ))}
                <span aria-hidden="true" className="absolute -left-10 inset-y-0 hidden w-px bg-line lg:block" />
              </div>
            </div>
          </div>
        </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold">Tout ce qu'il faut pour vendre plus, sans effort</h2>
          <p className="mt-3 text-muted">Un assistant qui travaille pour vous pendant que vous travaillez.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* Cascade de 70 ms : la grille se remplit dans l'ordre de lecture au
              lieu d'apparaitre d'un bloc. Au-dela, l'attente devient perceptible. */}
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delai={i * 70} className="h-full">
              <div className="card h-full transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <f.Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-xl">{f.title}</h3>
                <p className="mt-2 text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="etapes" className="relative border-y border-line bg-surface/60">
        {/* Isolignes en trois plateaux (public/images/bg-etapes.webp) : les trois
            crêtes portent les trois étapes.

            La section ne porte PAS `overflow-hidden` et le décor déborde de
            160 px sous elle : la vague traverse la bordure et se prolonge sur la
            section suivante au lieu d'être coupée net. C'est voulu — ne pas
            « ranger » l'image dans les limites de son bloc.

            Le débordement va vers le bas uniquement. Vers le haut, le décor
            serait peint APRÈS la section précédente (ordre du DOM) et passerait
            devant son texte ; vers le bas, les sections suivantes se peignent
            après lui et le recouvrent proprement. */}
        <div className="pointer-events-none absolute inset-x-0 top-[38%] -bottom-40 bg-[url('/images/bg-etapes.webp')] bg-cover bg-bottom opacity-60" />

        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-semibold">En ligne en 3 étapes</h2>
            {/* La simplicité se montre, elle ne s'annonce pas : on dit ce que le
                commerçant fait — parler, relire, scanner — et le peu que ça
                représente parle de lui-même. Aucune durée n'est promise ici,
                pour la même raison que « Prêt en 5 minutes » a quitté le hero
                (cf. le commentaire du bloc final) : rien ne la mesure. */}
            <p className="mt-3 text-lg text-muted">
              Vous parlez, vous relisez, vous scannez. L&apos;assistant fait le reste.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ETAPES.map((etape, i) => (
              // Ici la cascade dit quelque chose : les trois cartes sont des
              // etapes, elles se decouvrent donc dans l'ordre ou on les suit.
              <Reveal key={etape.numero} delai={i * 110} className="h-full">
                <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  {/* Les illustrations sont sur fond blanc : posées telles quelles
                      sur une carte blanche, elles n'auraient aucune limite. Le
                      dégradé vert très pâle les détache et reprend le vert des
                      objets qu'elles contiennent. */}
                  <div className="relative bg-gradient-to-b from-emerald-soft/70 to-surface">
                    <Image
                      src={etape.image}
                      alt={etape.alt}
                      width={900}
                      height={675}
                      sizes="(min-width: 768px) 360px, 100vw"
                      className="w-full transition duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand font-display text-base text-white shadow-lift">
                      {etape.numero}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl">{etape.titre}</h3>
                    <p className="mt-2 text-muted">{etape.texte}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Secteurs : une cellule par guide métier publié.
          Une grille à filets, et non douze cartes posées sur le fond : les
          sections Fonctionnalités et Étapes emploient déjà la carte flottante,
          et trois murs de cartes d'affilée donnent une page sans relief. Depuis
          que `cream` et `surface` valent tous deux le blanc pur, les bandes de
          section ne se distinguent plus qu'à leur filet — le bloc a donc besoin
          d'un dessin à lui.

          Les filets sont les gouttières d'un pixel du conteneur : `gap-px` sur
          un fond `line` laisse voir le fond entre des cellules blanches. Ils
          suivent le nombre de colonnes sans une seule bordure conditionnelle,
          là où `border-r` sur chaque cellule laisse un trait orphelin en bout
          de rangée dès que la grille passe de 3 à 2 puis à 1 colonne.

          Ces liens sont les premiers du HTML vers `/secteurs/<slug>`, et leur
          ancre est le mot-clé de la page visée (`Secteur.motCle`) : c'est celle
          qui compte, avant le bloc « Explorer le site » en bas de page. */}
      <section id="secteurs" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold">Le guide de votre métier</h2>
          <p className="mt-3 text-muted">
            Un client de restaurant ne demande pas la même chose qu'un client de garage. Chaque guide part des contraintes réelles du métier, et de ce que l'assistant en fait à partir de votre fiche.
          </p>
        </Reveal>

        {/* Une seule révélation pour la grille entière : douze apparitions en
            cascade sur un bloc aussi dense se voient comme un scintillement. */}
        <Reveal className="mt-12 overflow-hidden rounded-xl2 border border-line shadow-soft">
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {secteurs.map((s) => {
              const Icone = iconeSecteur(s.slug);
              return (
                <Link
                  key={s.slug}
                  href={`/secteurs/${s.slug}`}
                  className="group flex flex-col bg-surface p-6 transition duration-300 hover:bg-brand-soft/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
                      <Icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="text-lg leading-tight transition duration-300 group-hover:text-brand">{s.nom}</h3>
                  </div>
                  {/* La contrainte du métier, reprise telle quelle du guide :
                      elle dit au visiteur qu'on parle de son quotidien. */}
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{`${s.douleurs[0]}.`}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    {capitale(s.motCle)}
                    <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" strokeWidth={2.25} />
                  </span>
                </Link>
              );
            })}

            {/* Douzième cellule : l'index du silo, que rien d'autre ne liait
                depuis l'accueil, et la réponse au métier absent de la liste.
                Douze cellules pour trois colonnes : aucune rangée bancale. */}
            <Link
              href="/secteurs"
              className="group flex flex-col justify-center bg-brand-soft/30 p-6 text-center transition duration-300 hover:bg-brand-soft/70"
            >
              <span className="font-display text-lg font-semibold text-brand">Votre métier n'est pas listé ?</span>
              <span className="mt-2 text-sm leading-relaxed text-muted">
                L'assistant ne connait que ce que vous écrivez dans votre fiche : il s'adapte à tout métier.
              </span>
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand">
                Voir tous les guides
                <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" strokeWidth={2.25} />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* EEAT / trust band — l'illustration à gauche, le propos à droite.
          La citation qui occupait la colonne de droite disait la même chose que
          le premier paragraphe, en plus court : deux fois le même argument côte
          à côte, dont un entre guillemets sans auteur. Elle est retirée. */}
      <section className="border-y border-line bg-brand-soft/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <Reveal>
            <Image
              src={`${CLOUDINARY}/terrain-assistant.webp`}
              alt="Un commerçant, téléphone en main, entouré des services que l'assistant relie : messagerie, agenda, sécurité des données et passage à un humain."
              width={1200}
              height={900}
              sizes="(min-width: 768px) 550px, 100vw"
              className="w-full rounded-xl2"
            />
          </Reveal>

          <Reveal delai={120}>
            <h2 className="font-display text-3xl font-semibold">Conçu au plus près du terrain</h2>
            {/* Deux paragraphes courts plutôt qu'un bloc de six lignes : le
                constat, puis la règle de conduite de l'assistant. */}
            <p className="mt-4 text-muted">
              Wapy est né d&apos;un constat simple : on perd des ventes parce qu&apos;on ne répond pas assez vite sur WhatsApp. Pas par négligence — parce qu&apos;on est en train de servir un client, de couper des cheveux, de conduire.
            </p>
            <p className="mt-3 text-muted">
              L&apos;assistant répond à partir de vos seules informations. Quand il ne sait pas, il le dit et vous passe la main, plutôt que d&apos;inventer une réponse qui vous coûterait le client.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                "Réponses fondées uniquement sur vos informations",
                "Passage à l'humain pour les réclamations et les cas sensibles",
                "Données isolées par entreprise, accès sécurisés",
                "Adapté aux usages locaux (Mobile Money, français, ton chaleureux)",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" strokeWidth={2.5} /> <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="text-center font-display text-4xl font-semibold">Questions fréquentes</h2>
        {/* Deux colonnes à partir de `md`. `items-start` est indispensable :
            sans lui, les cellules d'une même ligne s'étirent à la hauteur de la
            plus haute, et ouvrir une question ferait grandir la carte voisine,
            restée fermée, avec un grand vide au milieu. */}
        <div className="mt-10 grid items-start gap-3 md:grid-cols-2">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delai={(i % 2) * 70} className="h-full">
              <details className="card group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                  {f.q}
                  <span className="shrink-0 text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        {/*
          Le balisage FAQPage n'est émis que par /faq : deux FAQPage sur deux
          URLs qui reprennent les mêmes questions se concurrencent au lieu de
          s'additionner.
        */}
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/faq" className="font-semibold text-brand hover:text-brand-dark">
            Voir toutes les questions fréquentes
          </Link>
        </p>
      </section>

      {/* Maillage : pays, secteurs, comparatifs et pages entité, rangés par
          famille. Plus de titre « Explorer le site » : les quatre intitulés de
          colonnes disent déjà ce qu'on trouve, et le bloc se lit comme un plan
          de site avant l'appel à l'action, non comme une section de plus. */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-6">
        <MaillageAccueil liens={liens} />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-xl2 bg-ink px-6 py-14 text-center text-cream shadow-lift">
          <h2 className="font-display text-4xl font-semibold">Prêt à répondre à chaque client ?</h2>
          {/* Pas de durée annoncée : rien ne la mesure, et « en quelques minutes »
              tombait sous la même règle que « Prêt en 5 minutes », retiré du hero. */}
          <p className="mx-auto mt-3 max-w-xl text-cream/70">Créez votre assistant WhatsApp et jugez-le sur vos vraies conversations. Sept jours d&apos;essai gratuit.</p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup" className="btn text-base">Commencer maintenant</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Bubble({
  side,
  children,
  delai,
}: {
  side: "left" | "right";
  children: React.ReactNode;
  /** Retard d'apparition, en secondes. Absent = la bulle est là d'emblée. */
  delai?: number;
}) {
  const right = side === "right";
  return (
    <div
      className={`flex ${delai === undefined ? "" : "bulle"} ${right ? "justify-end" : "justify-start"}`}
      style={delai === undefined ? undefined : ({ "--delai": `${delai}s` } as React.CSSProperties)}
    >
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-soft ${right ? "bg-[#d9fdd3] text-ink" : "bg-white text-ink"}`}>{children}</div>
    </div>
  );
}
