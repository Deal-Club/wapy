import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import FAQ, { ID_FAQ } from "@/components/seo/FAQ";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { FAQ_GLOBALE } from "@/content/faq-globale";
import { JOURS_ESSAI } from "@/content/plans";
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

/*
  Repères comptés ou tenus par le code : le nombre de questions est compté sur
  `content/faq-globale.ts`, la connexion se fait par QR code (`saas/wa.py:73-79`),
  l'essai dure `JOURS_ESSAI` jours (`saas/billing.py:14`).
*/
const REPERES: [string, string][] = [
  [`${FAQ_GLOBALE.length} réponses`, "Chacune adossée au comportement réel"],
  ["QR code", "Sur le numéro que vous utilisez déjà"],
  [`${JOURS_ESSAI} jours`, "Pour vérifier par vous-même"],
];

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

      <main>
        <HeroGuide
          visuel={
            /* Ce que le produit ne fait pas, en trois lignes, à côté du titre.
               C'est la seule page du site où l'aveu vaut argument : elle est
               faite pour lever des doutes, et une page de doutes qui ne montre
               que des promesses se lit comme un argumentaire. Ancrages :
               `brain/brain.py:50-52` (français uniquement), `saas/bot.py:42`
               (groupes et diffusions ignorés), `brain/brain.py:53-55` (rien
               hors de la fiche). */
            <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                À savoir avant d&apos;essayer
              </p>
              <ul className="mt-4 space-y-4">
                {[
                  ["Il ne répond qu'en français.", "Quelle que soit la langue du message reçu."],
                  [
                    "Il n'émet pas vers une liste.",
                    "Ni campagne, ni diffusion : il répond, il n'appelle pas.",
                  ],
                  [
                    "Il ne dit que ce que contient votre fiche.",
                    "Une information absente n'est pas devinée.",
                  ],
                ].map(([titre, detail]) => (
                  <li key={titre} className="border-l-2 border-brand/40 pl-4">
                    <p className="font-semibold leading-snug text-ink">{titre}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Questions fréquentes</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Questions fréquentes</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            Questions fréquentes sur{" "}
            <span className="text-brand">l&apos;assistant WhatsApp Wapy</span>
          </h1>

          <EnBref>
            Wapy répond à vos clients sur le compte WhatsApp que vous utilisez déjà, à partir
            d&apos;une fiche que vous remplissez. Les questions ci-dessous portent sur la connexion,
            sur ce que l&apos;assistant fait de vos informations, et sur ce qu&apos;il ne fait pas.
          </EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={`#${ID_FAQ}`} className="btn text-base">
              Lire les réponses
            </a>
            <Link href="/signup" className="btn-ghost text-base">
              Créer mon assistant
            </Link>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        <BandeReperes reperes={REPERES} />

        <SectionGuide
          disposition="pleine"
          titre="Toutes les réponses"
          intro="Chaque réponse décrit le comportement réel du produit, y compris quand il déçoit : l'assistant ne répond qu'en français, il n'envoie pas de campagnes, et il ne sait dire que ce que votre fiche contient. Une question qui manque ici mérite d'être posée avant l'essai plutôt qu'après."
        >
          <Reveal>
            <FAQ items={FAQ_GLOBALE} titre={null} colonnes={2} />
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre="La réponse tient en un essai"
          texte={
            <>
              Sept jours d&apos;essai gratuit, sur vos vraies conversations. Vous liez le compte
              WhatsApp que vous utilisez déjà en scannant un QR code, sans changer de numéro.
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

        <div className="mx-auto max-w-6xl px-4 pb-16">
          <PagesLiees liens={liens} />
          <Auteur />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
