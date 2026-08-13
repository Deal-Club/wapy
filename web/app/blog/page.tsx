import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { POSTS, tagFor } from "@/lib/blog";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import WapyMarque from "@/components/WapyMarque";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";

export const metadata: Metadata = {
  title: "Blog Wapy · Réussir la relation client sur WhatsApp",
  description:
    "Conseils concrets pour répondre à vos clients sur WhatsApp, automatiser sans se tromper et vendre plus, secteur par secteur.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    images: [IMAGE_OG_PAR_DEFAUT],
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: "Wapy",
    title: "Blog Wapy · Réussir la relation client sur WhatsApp",
    description: "Conseils concrets pour répondre à vos clients sur WhatsApp et vendre plus.",
  },
  robots: { index: true, follow: true },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <main>
        <HeroGuide>
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Blog</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Le blog Wapy</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            Répondre à vos clients sur WhatsApp,{" "}
            <span className="text-brand">vendre plus, sans effort</span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted">
            Des guides concrets, métier par métier, pour automatiser sans se tromper et ne plus
            jamais rater une vente.
          </p>
        </HeroGuide>

        <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-20">
          {/* Article vedette : le plus récent, en pleine largeur. */}
          {featured && (
            <Reveal>
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft transition duration-300 hover:border-brand/30 hover:shadow-lift md:grid-cols-[0.9fr_1.1fr]"
              >
                {/* Pas de photo dans le dépôt : la marque tient lieu de vignette
                    plutôt qu'une image d'illustration achetée qui ne dirait rien
                    de l'article. */}
                <div className="flex items-center justify-center bg-gradient-to-br from-brand-soft to-cream p-12 text-brand">
                  <WapyMarque className="h-20 w-20" couleurLettre="#F4E5DC" />
                </div>
                <div className="p-7 md:p-9">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="pill bg-brand-soft text-brand">{tagFor(featured.slug)}</span>
                    <span className="text-muted">
                      {fmtDate(featured.date)} · {featured.readingMin} min de lecture
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold leading-snug transition duration-300 group-hover:text-brand md:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">{featured.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    Lire l&apos;article
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition duration-300 group-hover:translate-x-1"
                      strokeWidth={2.25}
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          )}

          {/* Grille des autres articles */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delai={(i % 3) * 70} className="h-full">
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="pill bg-brand-soft text-brand">{tagFor(p.slug)}</span>
                    <span className="text-muted">{p.readingMin} min</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug transition duration-300 group-hover:text-brand">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    Lire
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1"
                      strokeWidth={2.25}
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <BlocFinal
          titre="Assez lu, essayez"
          texte={
            <>
              Sept jours d&apos;essai gratuit sur vos vraies conversations. Vous liez le compte
              WhatsApp que vous utilisez déjà en scannant un QR code, sans changer de numéro.
            </>
          }
        >
          <Link href="/signup" className="btn text-base">
            Créer mon assistant
          </Link>
          <Link href="/comment-ca-marche" className={LIEN_SECONDAIRE_SOMBRE}>
            Voir comment ça marche
          </Link>
        </BlocFinal>

        <div className="pb-10" />
      </main>

      <SiteFooter />
    </div>
  );
}
