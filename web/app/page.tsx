import Link from "next/link";
import type { Metadata } from "next";

const SITE = "https://wapy.51.210.108.173.sslip.io";

export const metadata: Metadata = {
  title: "Wapy — Assistant WhatsApp IA pour répondre à vos clients 24h/24",
  description:
    "Wapy répond automatiquement à vos clients sur WhatsApp — questions, commandes, réservations — dans votre ton, avec vos informations. Pour tout secteur. Sans code. Essai gratuit.",
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
    title: "Wapy — Assistant WhatsApp IA pour vos clients, 24h/24",
    description:
      "Répondez automatiquement à vos clients sur WhatsApp, dans votre ton, avec vos infos. Tout secteur. Sans code.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wapy — Assistant WhatsApp IA pour vos clients",
    description: "Répondez à vos clients sur WhatsApp automatiquement. Tout secteur. Sans code.",
  },
  robots: { index: true, follow: true },
};

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
    a: "Wapy répond uniquement à partir des informations que vous fournissez. Pour une réservation, une commande ou une demande sensible, il transmet automatiquement à un humain de votre équipe.",
  },
  {
    q: "Puis-je reprendre la main sur une conversation ?",
    a: "Oui. Le tableau de bord affiche toutes les conversations en direct. Vous pouvez répondre vous-même depuis le web ou WhatsApp, puis rendre la main au bot d'un clic.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Chaque entreprise est isolée : votre configuration, vos conversations et votre numéro WhatsApp ne sont accessibles qu'à vous. Les accès sont protégés par mot de passe chiffré.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Vous pouvez commencer gratuitement et configurer votre assistant en quelques minutes. Des offres mensuelles sont proposées selon votre volume de messages.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Wapy",
      url: SITE,
      description: "Assistant WhatsApp intelligent pour les entreprises, conçu pour l'Afrique.",
      areaServed: "Afrique",
      slogan: "Ne perdez plus jamais un client sur WhatsApp.",
    },
    {
      "@type": "SoftwareApplication",
      name: "Wapy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "XOF", description: "Essai gratuit" },
      description:
        "Assistant WhatsApp IA qui répond automatiquement aux clients de toute entreprise, dans son ton, avec ses informations.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

const SECTORS = ["Restaurant", "Maquis / Bar", "Salon de beauté", "Boutique", "Hôtel", "Pharmacie", "Clinique", "École", "Transport", "Immobilier", "Artisan", "E-commerce"];

const FEATURES = [
  { icon: "💬", title: "Réponses instantanées 24h/24", text: "Vos clients obtiennent une réponse en quelques secondes, jour et nuit, même quand vous êtes occupé." },
  { icon: "✨", title: "Configuré par l'IA", text: "Décrivez votre activité : l'IA génère automatiquement horaires, catalogue, prix et FAQ. Vous éditez à volonté." },
  { icon: "🧩", title: "Tout secteur, tout format", text: "Tableaux 100% personnalisables (menu, prestations, catalogue…). Ajoutez vos colonnes selon vos besoins." },
  { icon: "🙋", title: "Passage à l'humain", text: "Réservation, commande, réclamation : Wapy prévient votre équipe et vous reprenez la conversation en un clic." },
  { icon: "🔒", title: "Isolé et sécurisé", text: "Chaque entreprise a son espace privé. Vos données et conversations ne sont visibles que par vous." },
  { icon: "🌍", title: "Pensé pour l'Afrique", text: "Mobile Money, formats locaux, ton chaleureux, français : Wapy parle le langage de vos clients." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-semibold text-brand">Wapy</Link>
          <div className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#fonctionnalites" className="hover:text-ink">Fonctionnalités</a>
            <a href="#etapes" className="hover:text-ink">Comment ça marche</a>
            <a href="#secteurs" className="hover:text-ink">Secteurs</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">Se connecter</Link>
            <Link href="/signup" className="btn text-sm">Commencer</Link>
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
              Wapy répond automatiquement à vos clients — questions, commandes, réservations — dans votre ton, avec vos informations. Pour tout secteur. Sans code.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn text-base">Créer mon assistant gratuitement</Link>
              <a href="#etapes" className="btn-ghost text-base">Voir comment ça marche</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span>✓ Prêt en 5 minutes</span>
              <span>✓ Sans carte bancaire</span>
              <span>✓ Configuré par l'IA</span>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="rise" style={{ animationDelay: "0.1s" }}>
            <div className="mx-auto max-w-sm rounded-xl2 border border-line bg-[#efe7dd] p-4 shadow-lift">
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
                <Bubble side="right">Avec plaisir ! Je transmets votre demande à notre équipe, on revient vers vous très vite 🙏</Bubble>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / trust */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[["24/7", "Toujours disponible"], ["< 10s", "Temps de réponse"], ["27+", "Secteurs couverts"], ["100%", "Piloté par vos infos"]].map(([n, l]) => (
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
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-xl">{f.title}</h3>
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
              Wapy est né d'un constat simple : les entreprises perdent des ventes parce qu'elles ne répondent pas assez vite sur WhatsApp. Nous avons construit un assistant qui répond avec exactitude — jamais d'invention — et qui sait passer la main à un humain quand il le faut.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✓ Réponses fondées uniquement sur vos informations</li>
              <li>✓ Passage à l'humain pour tout ce qui compte</li>
              <li>✓ Données isolées par entreprise, accès sécurisés</li>
              <li>✓ Adapté aux usages locaux (Mobile Money, français, ton chaleureux)</li>
            </ul>
          </div>
          <div className="card">
            <p className="font-display text-2xl leading-snug">« Un client qui attend une réponse est un client qui va ailleurs. »</p>
            <p className="mt-3 text-muted">Wapy répond à sa place, tout de suite — et vous reprenez la main quand vous voulez.</p>
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
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-xl2 bg-ink px-6 py-14 text-center text-cream shadow-lift">
          <h2 className="font-display text-4xl font-semibold">Prêt à répondre à chaque client ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/70">Créez votre assistant WhatsApp en quelques minutes. Gratuitement.</p>
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
