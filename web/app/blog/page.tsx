import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS, tagFor } from "@/lib/blog";

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl font-bold text-brand">Wapy</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted hover:text-ink">Accueil</Link>
            <Link href="/signup" className="btn text-sm">Commencer</Link>
          </div>
        </nav>
      </header>

      {/* Hero du blog */}
      <section className="border-b border-line bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Le blog Wapy</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Répondre à vos clients sur WhatsApp, vendre plus, sans effort
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Des guides concrets, métier par métier, pour automatiser sans se tromper et ne plus jamais rater une vente.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Article vedette */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft transition hover:shadow-lift md:grid-cols-2"
          >
            <div className="flex items-center justify-center bg-brand-soft/50 p-10">
              <span className="font-display text-6xl font-bold text-brand/80">Wapy</span>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-2 text-xs">
                <span className="chip !py-1 text-brand">{tagFor(featured.slug)}</span>
                <span className="text-muted">{fmtDate(featured.date)} · {featured.readingMin} min</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold leading-snug group-hover:text-brand md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-muted">{featured.excerpt}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-brand">Lire l&apos;article →</span>
            </div>
          </Link>
        )}

        {/* Grille des autres articles */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition hover:shadow-lift"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="chip !py-1 text-brand">{tagFor(p.slug)}</span>
                <span className="text-muted">{p.readingMin} min</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-brand">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{p.excerpt}</p>
              <span className="mt-4 text-sm font-semibold text-brand">Lire →</span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
          <div className="font-display text-lg font-bold text-brand">Wapy</div>
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
