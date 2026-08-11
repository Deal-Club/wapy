import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import { secteursPublies } from "@/content/secteurs";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { breadcrumbLd, itemListLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { resume } from "@/lib/texte";

const URL_PAGE = `${SITE_URL}/secteurs`;
const TITRE = "Un assistant WhatsApp pour chaque métier";
// 155 caractères maximum : au-delà, Google tronque et c'est lui qui choisit où.
// `tests/metadonnees.test.ts` mesure la description réellement exportée.
const DESCRIPTION =
  "Onze guides métier pour répondre à vos clients sur WhatsApp : restaurant, boutique, salon, hôtel, garage et les autres, avec leurs questions types.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["assistant WhatsApp", "chatbot WhatsApp", "WhatsApp par métier"],
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

export default function IndexSecteurs() {
  const secteurs = secteursPublies();

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Secteurs", url: URL_PAGE },
        ])}
      />
      <JsonLd
        data={itemListLd(
          secteurs.map((s) => ({ nom: s.motCle, url: `${SITE_URL}/secteurs/${s.slug}` })),
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
            <span className="text-ink/70">Secteurs</span>
          </nav>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            {TITRE}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Les questions d&apos;un client de restaurant ne sont pas celles d&apos;un client de
            garage. Chaque guide part des demandes réelles du métier et explique ce que
            l&apos;assistant en fait, à partir de la fiche que vous remplissez.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {secteurs.map((s) => (
            <li key={s.slug} className="flex">
              <Link
                href={`/secteurs/${s.slug}`}
                className="group flex w-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition hover:shadow-lift"
              >
                <span className="chip !py-1 text-xs text-brand">{s.tag}</span>
                <h2 className="mt-3 font-display text-xl font-bold leading-snug group-hover:text-brand">
                  {s.nom}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">{resume(s.enBref, 140)}</p>
                <span className="mt-4 text-sm font-semibold text-brand">
                  Lire le guide {s.nom.toLowerCase()} →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Votre métier n&apos;est pas listé ?</h2>
          <p className="mx-auto mt-2 max-w-lg text-cream/70">
            L&apos;assistant ne connait que ce que vous écrivez dans votre fiche : il
            s&apos;adapte donc à tout métier, listé ici ou non. Sept jours d&apos;essai gratuit,
            sur vos vraies conversations.
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
