import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import FAQ from "@/components/seo/FAQ";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { FAQ_GLOBALE } from "@/content/faq-globale";
import { liensSortants } from "@/lib/maillage";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { faqLd, breadcrumbLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

const URL_PAGE = `${SITE_URL}/faq`;
const TITRE = "Questions fréquentes sur l'assistant WhatsApp Wapy";
// 155 caractères maximum : au-delà, Google tronque et choisit lui-même où.
const DESCRIPTION =
  "Connexion au numéro existant, réponses tirées de votre fiche, passage à un humain, langue, données, essai : les réponses courtes, vérifiables.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["FAQ Wapy", "questions assistant WhatsApp", "chatbot WhatsApp questions"],
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

export default function PageFaq() {
  const liens = liensSortants("/faq");

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd data={faqLd(FAQ_GLOBALE)} />
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Questions fréquentes", url: URL_PAGE },
        ])}
      />

      <SiteHeader lienSecondaire={{ href: "/comment-ca-marche", libelle: "Comment ça marche" }} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">Questions fréquentes</span>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {TITRE}
        </h1>

        <EnBref>
          Wapy répond à vos clients sur le compte WhatsApp que vous utilisez déjà, à partir
          d&apos;une fiche que vous remplissez. Les questions ci-dessous portent sur la connexion,
          sur ce que l&apos;assistant fait de vos informations, et sur ce qu&apos;il ne fait pas.
        </EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <p className="mt-8 text-muted">
          Chaque réponse décrit le comportement réel du produit, y compris quand il déçoit :
          l&apos;assistant ne répond qu&apos;en français, il n&apos;envoie pas de campagnes, et il
          ne sait dire que ce que votre fiche contient. Une question qui manque ici mérite
          d&apos;être posée avant l&apos;essai plutôt qu&apos;après.
        </p>

        <FAQ items={FAQ_GLOBALE} />

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">La réponse tient en un essai</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit, sur vos vraies conversations. Vous liez le compte
            WhatsApp que vous utilisez déjà en scannant un QR code, sans changer de numéro.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/signup" className="btn">
              Créer mon assistant
            </Link>
          </div>
        </div>

        <PagesLiees liens={liens} />
        <Auteur />
      </main>

      <SiteFooter />
    </div>
  );
}
