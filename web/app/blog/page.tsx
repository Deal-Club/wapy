import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog Wapy · Réussir la relation client sur WhatsApp",
  description:
    "Conseils concrets pour répondre à vos clients sur WhatsApp, automatiser sans se tromper et vendre plus, secteur par secteur.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: "Wapy",
    title: "Blog Wapy · Réussir la relation client sur WhatsApp",
    description: "Conseils concrets pour répondre à vos clients sur WhatsApp et vendre plus.",
  },
  robots: { index: true, follow: true },
};

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-semibold text-brand">Wapy</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted hover:text-ink">Accueil</Link>
            <Link href="/signup" className="btn text-sm">Commencer</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">Le blog Wapy</h1>
        <p className="mt-3 text-lg text-muted">
          Répondre à vos clients sur WhatsApp, automatiser sans se tromper, vendre plus. Des conseils concrets, métier par métier.
        </p>

        <div className="mt-10 space-y-4">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card block transition hover:shadow-lift">
              <div className="text-xs text-muted">{new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {p.readingMin} min de lecture</div>
              <h2 className="mt-1 font-display text-2xl">{p.title}</h2>
              <p className="mt-2 text-muted">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-medium text-brand">Lire l&apos;article →</span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
          <div className="font-display text-lg text-brand">Wapy</div>
          <p>Assistant WhatsApp intelligent pour les entreprises · Conçu pour l&apos;Afrique</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-ink">Accueil</Link>
            <Link href="/signup" className="hover:text-ink">Commencer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
