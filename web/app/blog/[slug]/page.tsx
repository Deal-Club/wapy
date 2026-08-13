import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { POSTS, getPost, tagFor, related } from "@/lib/blog";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} · Wapy`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      images: [IMAGE_OG_PAR_DEFAUT],
      type: "article",
      url,
      siteName: "Wapy",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
    robots: { index: true, follow: true },
  };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Article({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const tag = tagFor(post.slug);
  const others = related(post.slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: "Wapy" },
    publisher: { "@type": "Organization", name: "Wapy", url: SITE_URL },
    mainEntityOfPage: url,
    articleSection: tag,
    inLanguage: "fr",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <SiteHeader lienSecondaire={{ href: "/blog", libelle: "Blog" }} />

      <main>
        {/* Chapeau d'article : sur toute la largeur de la colonne de lecture,
            avec la trame de points du reste du site. Le corps de l'article
            garde ses 48 rem, c'est la largeur qui se lit. */}
        <div className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden="true"
            className="decor-points pointer-events-none absolute inset-0 hidden md:block"
          />
          <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-8">
            <FilAriane>
              <Link href="/" className="transition hover:text-brand">
                Accueil
              </Link>
              <Link href="/blog" className="transition hover:text-brand">
                Blog
              </Link>
              <span className="text-ink/70">{tag}</span>
            </FilAriane>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
              <span className="pill bg-brand-soft text-brand">{tag}</span>
              <span className="text-muted">
                {fmtDate(post.date)} · {post.readingMin} min de lecture
              </span>
            </div>
            <h1 className="mt-4 font-display text-[2rem] font-bold leading-[1.12] md:text-[2.6rem]">
              {post.title}
            </h1>
            <p className="mt-5 border-l-2 border-brand pl-4 text-lg leading-relaxed text-ink/80">
              {post.excerpt}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-16">
          <article className="article mt-10" dangerouslySetInnerHTML={{ __html: post.body }} />

          {/* Articles similaires avant l'appel à l'action : un lecteur arrivé au
              bout d'un article cherche d'abord le suivant. */}
          {others.length > 0 && (
            <section className="mt-14 border-t border-line pt-10">
              <h2 className="font-display text-xl font-bold">Sur le même sujet</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {others.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group flex h-full flex-col rounded-xl2 border border-line bg-surface p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                      {tagFor(p.slug)}
                    </span>
                    <h3 className="mt-2.5 flex-1 text-sm font-bold leading-snug transition group-hover:text-brand">
                      {p.title}
                    </h3>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-4 h-4 w-4 text-line transition duration-300 group-hover:translate-x-1 group-hover:text-brand"
                      strokeWidth={2.25}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <BlocFinal
          titre="Prêt à ne plus rater un client ?"
          texte="Créez votre assistant WhatsApp sans code. Sept jours d'essai gratuit, sur le numéro que vous utilisez déjà."
        >
          <Link href="/signup" className="btn text-base">
            Commencer maintenant
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
