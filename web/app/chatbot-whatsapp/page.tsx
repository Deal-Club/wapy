import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import JsonLd from "@/components/seo/JsonLd";
import { paysPublies } from "@/content/pays";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { breadcrumbLd, itemListLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { resume } from "@/lib/texte";

const URL_PAGE = `${SITE_URL}/chatbot-whatsapp`;
const TITRE = "Chatbot WhatsApp en Afrique francophone";
// 155 caractères maximum : au-delà, Google tronque et c'est lui qui choisit où.
// `tests/metadonnees.test.ts` mesure la description réellement exportée.
const DESCRIPTION =
  "Cinq guides pays pour répondre à vos clients sur WhatsApp : Bénin, Côte d'Ivoire, Sénégal, Cameroun et Togo, avec leurs numéros et leurs paiements.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["chatbot WhatsApp", "assistant WhatsApp", "WhatsApp Afrique francophone"],
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

export default function IndexPays() {
  const pays = paysPublies();

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Pays", url: URL_PAGE },
        ])}
      />
      <JsonLd
        data={itemListLd(
          pays.map((p) => ({
            nom: `Chatbot WhatsApp ${p.nom}`,
            url: `${SITE_URL}/chatbot-whatsapp/${p.slug}`,
          })),
        )}
      />

      <SiteHeader />

      <main>
        <HeroGuide>
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Pays</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Guides par pays</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            {TITRE}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted">
            Les formats de numéros, les moyens de paiement et les habitudes de la clientèle
            changent d&apos;un pays à l&apos;autre. Chaque guide part de ces repères locaux et
            explique ce que l&apos;assistant en fait, à partir de la fiche que vous remplissez.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Créer mon assistant
            </Link>
            <Link href="/comment-ca-marche" className="btn-ghost text-base">
              Voir comment ça marche
            </Link>
          </div>
        </HeroGuide>

        <BandeReperes
          reperes={[
            [`${pays.length} pays`, "Guides publiés à ce jour"],
            ["Franc CFA", "Facturation en monnaie locale"],
            ["QR code", "Sur votre numéro actuel"],
          ]}
        />

        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pays.map((p, i) => (
              <Reveal key={p.slug} delai={(i % 3) * 70} className="h-full">
                <li className="h-full">
                  <Link
                    href={`/chatbot-whatsapp/${p.slug}`}
                    className="group flex h-full w-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
                        <MapPin className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      {/* L'indicatif tient lieu d'étiquette : c'est le repère
                          qui distingue deux pays d'un coup d'oeil. */}
                      <span className="font-display text-sm font-bold text-muted">
                        {p.indicatif}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-xl font-bold leading-snug transition duration-300 group-hover:text-brand">
                      {p.nom}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {resume(p.enBref, 140)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                      Lire le guide {p.nom}
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
          titre="Votre pays n'est pas encore listé ?"
          texte={
            <>
              L&apos;assistant répond aux messages du compte WhatsApp que vous connectez, où que
              vous soyez. Les guides ci-dessus détaillent {pays.length} pays, la liste
              s&apos;allongera. Sept jours d&apos;essai gratuit, sur vos vraies conversations.
            </>
          }
        >
          <Link href="/signup" className="btn text-base">
            Créer mon assistant
          </Link>
          <Link href="/secteurs" className={LIEN_SECONDAIRE_SOMBRE}>
            Voir les guides métier
          </Link>
        </BlocFinal>

        <div className="pb-10" />
      </main>

      <SiteFooter />
    </div>
  );
}
