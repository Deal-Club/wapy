import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { POSTS, getPost } from "@/lib/blog";

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

export default function Article({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
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
    inLanguage: "fr",
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-semibold text-brand">Wapy</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/blog" className="text-muted hover:text-ink">Blog</Link>
            <Link href="/signup" className="btn text-sm">Commencer</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/blog" className="text-sm text-muted hover:text-ink">← Tous les articles</Link>
        <div className="mt-4 text-xs text-muted">
          {new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {post.readingMin} min de lecture
        </div>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted">{post.excerpt}</p>

        <article className="article mt-8" dangerouslySetInnerHTML={{ __html: post.body }} />

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-semibold">Prêt à ne plus rater un client ?</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">Créez votre assistant WhatsApp en quelques minutes, gratuitement.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/signup" className="btn">Commencer maintenant</Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
          <div className="font-display text-lg text-brand">Wapy</div>
          <p>Assistant WhatsApp intelligent pour les entreprises · Conçu pour l&apos;Afrique</p>
          <div className="flex gap-4">
            <Link href="/blog" className="hover:text-ink">Blog</Link>
            <Link href="/signup" className="hover:text-ink">Commencer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
