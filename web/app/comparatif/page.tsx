import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
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

      <main>
        <HeroGuide
          visuel={
            /* L'aveu de conflit d'intérêts, sorti du corps de texte et posé à
               côté du titre : c'est la première chose à savoir en arrivant sur
               un comparatif édité par l'un des outils comparés. */
            <div className="rounded-xl2 border border-brand/20 bg-brand-soft/30 p-7 shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <Scale className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-display text-lg font-bold leading-snug">
                Ces comparatifs sont édités par Wapy, qui y figure.
              </p>
              <p className="mt-2 leading-relaxed text-muted">
                C&apos;est pour cette raison que les points sur lesquels un concurrent fait mieux
                que nous y sont écrits noir sur blanc.
              </p>
            </div>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Comparatifs</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Comparatifs</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            {TITRE}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted">
            Quatre pages expliquent ce que les outils existants font et ne font pas, quatre autres
            comparent Wapy à un éditeur précis. Les caractéristiques de chaque éditeur tiers sont
            relevées sur son propre site, à la date indiquée en bas de chaque tableau.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Essayer Wapy
            </Link>
            <Link href="/tarifs" className="btn-ghost text-base">
              Voir les tarifs
            </Link>
          </div>
        </HeroGuide>

        <BandeReperes
          reperes={[
            [`${COMPARATIFS_PUBLIES.length} comparatifs`, "Publiés à ce jour"],
            ["Relevé daté", "Chaque tableau porte sa date"],
            ["Points faibles", "Les nôtres y figurent aussi"],
          ]}
        />

        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMPARATIFS_PUBLIES.map((c, i) => (
              <Reveal key={c.slug} delai={(i % 3) * 70} className="h-full">
                <li className="h-full">
                  <Link
                    href={`/comparatif/${c.slug}`}
                    className="group flex h-full w-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
                      <Scale className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-4 font-display text-lg font-bold leading-snug transition duration-300 group-hover:text-brand">
                      {c.titre}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {resume(c.enBref, 140)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                      Lire le comparatif
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1"
                        strokeWidth={2.25}
                      />
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        <BlocFinal
          titre="Comparer sur ses propres messages"
          texte={
            <>
              Aucun tableau ne remplace un essai sur vos vraies conversations. Sept jours gratuits,
              sur le compte WhatsApp que vous utilisez déjà.
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
