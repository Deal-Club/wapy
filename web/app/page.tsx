import Link from "next/link";
import type { Metadata } from "next";
import { MessageCircle, Sparkles, Table, Users, ShieldCheck, Globe, Check, type LucideIcon } from "lucide-react";
import AuthNav from "@/components/AuthNav";
import JsonLd from "@/components/seo/JsonLd";
import PagesLiees from "@/components/seo/PagesLiees";
import { liensSortants } from "@/lib/maillage";
import { softwareApplicationLd } from "@/lib/schema";
import { SITE_URL as SITE } from "@/lib/site";

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

const SECTORS = ["Restaurant", "Maquis / Bar", "Salon de beauté", "Boutique", "Hôtel", "Pharmacie", "Clinique", "École", "Transport", "Immobilier", "Artisan", "E-commerce"];

const FEATURES: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: MessageCircle, title: "Une réponse à toute heure", text: "Vos clients obtiennent une réponse la nuit, le dimanche et pendant que vous servez, tant que la ligne est connectée." },
  { Icon: Sparkles, title: "Configuré par l'IA", text: "Décrivez votre activité : l'IA génère automatiquement horaires, catalogue, prix et FAQ. Vous éditez à volonté." },
  { Icon: Table, title: "Tout secteur, tout format", text: "Tableaux entièrement personnalisables (menu, prestations, catalogue…). Ajoutez vos colonnes selon vos besoins." },
  { Icon: Users, title: "Passage à l'humain", text: "Réclamation, sujet sensible ou client qui demande à vous parler : Wapy vous passe la main et vous répondez depuis WhatsApp." },
  { Icon: ShieldCheck, title: "Isolé et sécurisé", text: "Chaque entreprise a son espace privé. Vos données et conversations ne sont visibles que par vous." },
  { Icon: Globe, title: "Pensé pour l'Afrique", text: "Mobile Money, formats locaux, ton chaleureux, français : Wapy parle le langage de vos clients." },
];

export default function Landing() {
  // Liens contextuels vers les silos pays, secteur et comparatif. L'accueil est
  // la page la plus forte du site : c'est d'ici que ces pages tirent l'essentiel
  // de leurs liens entrants (cf. lib/maillage.ts et son audit des 3 entrants).
  const liens = liensSortants("/");

  return (
    <div className="min-h-screen">
      {/* Organization et WebSite sont déclarés une fois pour toutes dans le layout. */}
      <JsonLd data={softwareApplicationLd()} />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-semibold text-brand">Wapy</Link>
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
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="rise">
            <span className="pill bg-emerald-soft text-emerald-dark">● En ligne 24h/24 sur WhatsApp</span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
              Ne perdez plus jamais un client sur <span className="text-brand">WhatsApp</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Wapy répond automatiquement à vos clients (questions, commandes, réservations), dans votre ton, avec vos informations. Pour tout secteur. Sans code.
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
                  <div className="text-xs text-emerald-dark">en ligne · Wapy</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <Bubble side="left">Bonjour, vous êtes ouverts ce soir ?</Bubble>
                <Bubble side="right">Bonjour 👋 Oui, tous les jours de 11h à 23h. Au plaisir de vous accueillir !</Bubble>
                <Bubble side="left">C'est combien le poisson braisé ?</Bubble>
                <Bubble side="right">Le poisson braisé est à 3 500 FCFA, tilapia grillé sauce piment. Un délice 😋</Bubble>
                <Bubble side="left">Je veux réserver une table pour 4</Bubble>
                <Bubble side="right">Avec plaisir ! Pour ce soir à 20h, une table de 4. À quel nom je la note ?</Bubble>
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
            session est connectée, essai de 7 jours (saas/billing.py:14), 11 guides
            métier publiés (content/secteurs.ts), connexion par QR code
            (saas/wa.py:73-79). Ni délai de réponse mesuré, ni volume d'usage.
          */}
          {[["24h/24", "Répond aux messages reçus"], ["7 jours", "D'essai gratuit"], ["11", "Guides métier publiés"], ["QR code", "Sur votre numéro actuel"]].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-4xl text-brand">{n}</div>
              <div className="text-sm text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold">Tout ce qu'il faut pour vendre plus, sans effort</h2>
          <p className="mt-3 text-muted">Un assistant qui travaille pour vous pendant que vous travaillez.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card transition hover:shadow-lift">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <f.Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 text-xl">{f.title}</h3>
              <p className="mt-2 text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="etapes" className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-semibold">En ligne en 3 étapes</h2>
            <p className="mt-3 text-muted">Aucune compétence technique requise.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Décrivez votre activité", "Choisissez votre secteur et décrivez votre entreprise. L'IA remplit horaires, catalogue et FAQ."],
              ["2", "Ajustez en un clin d'œil", "Éditez vos tableaux (menu, prestations, prix…), ajoutez vos colonnes, importez un Excel si vous préférez."],
              ["3", "Scannez votre WhatsApp", "Liez le WhatsApp de votre entreprise en scannant un QR. Wapy répond immédiatement à vos clients."],
            ].map(([n, t, d]) => (
              <div key={n} className="card">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-display text-lg text-white">{n}</div>
                <h3 className="mt-4 text-xl">{t}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section id="secteurs" className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="font-display text-4xl font-semibold">Fait pour votre métier</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">Restaurants, salons, boutiques, hôtels, cliniques, écoles… et tous les autres. Wapy s'adapte, vous ne changez rien à votre façon de travailler.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SECTORS.map((s) => (<span key={s} className="chip">{s}</span>))}
          <span className="chip text-brand">+ le vôtre</span>
        </div>
      </section>

      {/* EEAT / trust band */}
      <section className="border-y border-line bg-brand-soft/40">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Conçu au plus près du terrain</h2>
            <p className="mt-3 text-muted">
              Wapy est né d'un constat simple : les entreprises perdent des ventes parce qu'elles ne répondent pas assez vite sur WhatsApp. Nous avons construit un assistant qui répond à partir de vos seules informations, qui dit se renseigner plutôt que d'inventer, et qui passe la main à un humain quand il le faut.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
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
          </div>
          <div className="card">
            <p className="font-display text-2xl leading-snug">« Un client qui attend une réponse est un client qui va ailleurs. »</p>
            <p className="mt-3 text-muted">Wapy répond à sa place, tout de suite, et vous reprenez la main quand vous voulez.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center font-display text-4xl font-semibold">Questions fréquentes</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.q}
                <span className="text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
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

      {/* Maillage : pays, secteurs, comparatifs et pages entité */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <PagesLiees liens={liens} titre="Explorer le site" />
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

      {/* Footer */}
      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
          <div className="font-display text-lg text-brand">Wapy</div>
          <p>Assistant WhatsApp intelligent pour les entreprises · Conçu pour l'Afrique</p>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-ink">Blog</Link>
            <Link href="/login" className="hover:text-ink">Connexion</Link>
            <Link href="/signup" className="hover:text-ink">Commencer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const right = side === "right";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-soft ${right ? "bg-[#d9fdd3] text-ink" : "bg-white text-ink"}`}>{children}</div>
    </div>
  );
}
