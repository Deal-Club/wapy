import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { POSTS, getPost, tagFor, related } from "@/lib/blog";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Fil d'Ariane */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-ink">Blog</Link>
          <span>›</span>
          <span className="text-ink/70">{tag}</span>
        </nav>

        <div className="mt-5 flex items-center gap-2 text-xs">
          <span className="chip !py-1 text-brand">{tag}</span>
          <span className="text-muted">{fmtDate(post.date)} · {post.readingMin} min de lecture</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">{post.title}</h1>
        <p className="mt-4 border-l-2 border-brand/40 pl-4 text-lg text-muted">{post.excerpt}</p>

        <article className="article mt-8" dangerouslySetInnerHTML={{ __html: post.body }} />

        {/* CTA */}
        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Prêt à ne plus rater un client ?</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">Créez votre assistant WhatsApp en quelques minutes, gratuitement.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/signup" className="btn">Commencer maintenant</Link>
          </div>
        </div>

        {/* Articles similaires */}
        {others.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-bold">Sur le même sujet</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {others.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group rounded-xl border border-line bg-surface p-5 shadow-soft transition hover:shadow-lift">
                  <span className="chip !py-1 text-xs text-brand">{tagFor(p.slug)}</span>
                  <h3 className="mt-2 text-sm font-bold leading-snug group-hover:text-brand">{p.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
