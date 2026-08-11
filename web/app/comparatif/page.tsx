import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { breadcrumbLd, itemListLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { resume } from "@/lib/texte";

const URL_PAGE = `${SITE_URL}/comparatif`;
const TITRE = "Comparatifs : bien choisir son assistant WhatsApp";
// 155 caractères maximum : au-delà, Google tronque et c'est lui qui choisit où.
// `tests/metadonnees.test.ts` mesure la description réellement exportée.
const DESCRIPTION =
  "Huit comparatifs pour choisir un outil WhatsApp en Afrique francophone : alternatives à WhatsApp Business, éditeurs comparés un à un, tarifs relevés.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["comparatif chatbot WhatsApp", "alternative WhatsApp Business", "assistant WhatsApp"],
  alternates: { canonical: URL_PAGE },
  openGraph: {
    images: [IMAGE_OG_PAR_DEFAUT],
    type: "website",
    url: URL_PAGE,
    siteName: "Wapy",
    locale: "fr_FR",
    title: TITRE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITRE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function IndexComparatifs() {
  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Comparatifs", url: URL_PAGE },
        ])}
      />
      <JsonLd
        data={itemListLd(
          COMPARATIFS_PUBLIES.map((c) => ({
            nom: c.titre,
            url: `${SITE_URL}/comparatif/${c.slug}`,
          })),
        )}
      />

      <SiteHeader />

      <section className="border-b border-line bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <nav
            className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
            aria-label="Fil d'Ariane"
          >
            <Link href="/" className="hover:text-ink">
              Accueil
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-ink/70">Comparatifs</span>
          </nav>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            {TITRE}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Quatre pages expliquent ce que les outils existants font et ne font pas, quatre autres
            comparent Wapy à un éditeur précis. Les caractéristiques de chaque éditeur tiers sont
            relevées sur son propre site, à la date indiquée en bas de chaque tableau.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Ces comparatifs sont édités par Wapy, qui y figure. C&apos;est pour cette raison que les
            points sur lesquels un concurrent fait mieux que nous y sont écrits noir sur blanc.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARATIFS_PUBLIES.map((c) => (
            <li key={c.slug} className="flex">
              <Link
                href={`/comparatif/${c.slug}`}
                className="group flex w-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition hover:shadow-lift"
              >
                <h2 className="font-display text-xl font-bold leading-snug group-hover:text-brand">
                  {c.titre}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">{resume(c.enBref, 140)}</p>
                <span className="mt-4 text-sm font-semibold text-brand">Lire le comparatif →</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Comparer sur ses propres messages</h2>
          <p className="mx-auto mt-2 max-w-lg text-cream/70">
            Aucun tableau ne remplace un essai sur vos vraies conversations. Sept jours gratuits,
            sur le compte WhatsApp que vous utilisez déjà.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/signup" className="btn">
              Créer mon assistant
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
