import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire, { ENTREE_FAQ } from "@/components/seo/Sommaire";
import FAQ from "@/components/seo/FAQ";
import BlocPreuve from "@/components/seo/BlocPreuve";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { getSecteur, secteursPublies } from "@/content/secteurs";
import { liensSortants } from "@/lib/maillage";
import { serviceLd, faqLd, breadcrumbLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { capitale, resume } from "@/lib/texte";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

/** Identifiants d'ancrage posés par les sections, repris tels quels par le sommaire. */
const ID_PROBLEME = "probleme";
const ID_SOLUTION = "solution";

function titrePage(motCle: string): string {
  return `${capitale(motCle)} : répondre à vos clients 24h/24`;
}

export function generateStaticParams() {
  return secteursPublies().map((s) => ({ secteur: s.slug }));
}

export function generateMetadata({ params }: { params: { secteur: string } }): Metadata {
  const s = getSecteur(params.secteur);
  if (!s || !s.publie) return {};
  const url = `${SITE_URL}/secteurs/${s.slug}`;
  const titre = titrePage(s.motCle);
  const description = resume(s.enBref);
  return {
    title: `${titre} · Wapy`,
    description,
    keywords: [s.motCle, `assistant WhatsApp ${s.nom.toLowerCase()}`, "WhatsApp automatique"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Wapy",
      locale: "fr_FR",
      title: titre,
      description,
      publishedTime: PUBLIE_LE,
      modifiedTime: MODIFIE_LE,
    },
    twitter: { card: "summary_large_image", title: titre, description },
    robots: { index: true, follow: true },
  };
}

export default function PageSecteur({ params }: { params: { secteur: string } }) {
  const s = getSecteur(params.secteur);
  if (!s || !s.publie) notFound();

  const url = `${SITE_URL}/secteurs/${s.slug}`;
  const liens = liensSortants(`/secteurs/${s.slug}`);

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={serviceLd({
          nom: s.motCle,
          description: s.enBref,
          url,
          areaServed: { type: "Country", nom: "Afrique francophone" },
        })}
      />
      <JsonLd data={faqLd(s.faq)} />
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Secteurs", url: `${SITE_URL}/secteurs` },
          { nom: s.nom, url },
        ])}
      />

      <SiteHeader lienSecondaire={{ href: "/secteurs", libelle: "Secteurs" }} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <Link href="/secteurs" className="hover:text-ink">
            Secteurs
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">{s.nom}</span>
        </nav>

        <div className="mt-5">
          <span className="chip !py-1 text-xs text-brand">{s.tag}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {titrePage(s.motCle)}
        </h1>

        <EnBref>{s.enBref}</EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            { id: ID_PROBLEME, libelle: `Ce que vivent les ${s.nomPluriel.toLowerCase()}` },
            { id: ID_SOLUTION, libelle: "Ce que fait l'assistant" },
            ENTREE_FAQ,
          ]}
        />

        <section id={ID_PROBLEME} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Ce que vivent les {s.nomPluriel.toLowerCase()} sur WhatsApp
          </h2>
          <p className="mt-4 text-muted">{s.angle}</p>
          <ul className="mt-5 space-y-2">
            {s.douleurs.map((d) => (
              <li key={d} className="flex gap-2 text-muted">
                <span aria-hidden="true" className="text-brand">
                  ·
                </span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id={ID_SOLUTION} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ce que fait l&apos;assistant Wapy</h2>
          {/*
            Chaque affirmation ci-dessous est vérifiable dans le code du produit :
            réponse tirée de la seule fiche et interdiction d'inventer une donnée
            absente, conduite de la demande jusqu'à son enregistrement avec
            notification du responsable, passage de main limité aux cas rares, et
            information manquante qui ne déclenche PAS de transfert
            (brain/brain.py, construction du prompt système).
          */}
          <p className="mt-4 text-muted">
            Wapy répond depuis la fiche que vous remplissez : vos informations, votre catalogue,
            vos consignes. Il mène la demande jusqu&apos;au bout au lieu d&apos;accuser réception,
            pose les questions qui manquent, confirme au client, enregistre la commande ou la
            réservation dans votre carnet et vous envoie le récapitulatif sur WhatsApp.
          </p>
          <p className="mt-4 text-muted">
            Il ne vous passe la main que dans les cas rares où un humain est indispensable :
            une réclamation, un sujet sensible, ou un client qui demande explicitement à vous
            parler. Quand une information manque à la fiche, il ne vous dérange pas pour autant,
            il dit qu&apos;il se renseigne, sans jamais avancer un prix ou une disponibilité
            qu&apos;il n&apos;a pas. Ses réponses sont en français, la seule langue prévue à ce jour.
          </p>
          <BlocPreuve id="secteurs-couverts" />
        </section>

        <FAQ items={s.faq} />

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Essayez sur vos vraies conversations</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez déjà en
            scannant un QR code, sans changer de numéro.
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
