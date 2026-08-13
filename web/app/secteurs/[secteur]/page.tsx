import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Minus } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { iconeSecteur } from "@/components/IconesSecteur";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire, { ENTREE_FAQ } from "@/components/seo/Sommaire";
import FAQ, { ID_FAQ } from "@/components/seo/FAQ";
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

/*
  Ce que l'assistant fait, en trois temps, sur le même métier.

  Chaque ligne est vérifiable dans le code du produit : réponse tirée de la
  seule fiche et interdiction d'inventer une donnée absente, conduite de la
  demande jusqu'à son enregistrement avec notification du responsable, passage
  de main limité aux cas rares, et information manquante qui ne déclenche PAS de
  transfert (brain/brain.py, construction du prompt système).
*/
const CE_QUE_FAIT_L_ASSISTANT: { titre: string; texte: string }[] = [
  {
    titre: "Il répond depuis votre fiche",
    texte:
      "Vos informations, votre catalogue, vos consignes. Il n'annonce ni un prix ni une disponibilité qui n'y figurent pas, et ses réponses sont en français, la seule langue prévue à ce jour.",
  },
  {
    titre: "Il mène la demande jusqu'au bout",
    texte:
      "Au lieu d'accuser réception, il pose les questions qui manquent, confirme au client, enregistre la commande ou la réservation dans votre carnet, puis vous envoie le récapitulatif sur WhatsApp.",
  },
  {
    titre: "Il vous passe la main dans les cas rares",
    texte:
      "Une réclamation, un sujet sensible, un client qui demande explicitement à vous parler. Quand une information manque à la fiche, il ne vous dérange pas pour autant : il dit qu'il se renseigne.",
  },
];

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
  const Icone = iconeSecteur(s.slug);
  const metier = s.nomPluriel.toLowerCase();

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

      <main>
        <HeroGuide
          visuel={
            /* Le quotidien du métier, à côté du titre : ce sont les seules
               lignes de la page qui parlent du visiteur avant de parler du
               produit. Elles viennent de `douleurs`, donc du contenu du
               secteur, jamais d'un texte de gabarit. */
            <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    Le quotidien
                  </p>
                  <p className="font-display font-bold leading-tight">{s.nom}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {s.douleurs.map((d) => (
                  <li key={d} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-muted"
                    >
                      <Minus className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm leading-relaxed text-muted">{d}</span>
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
            <Link href="/secteurs" className="transition hover:text-brand">
              Secteurs
            </Link>
            <span className="text-ink/70">{s.nom}</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">{s.tag}</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.8rem]">
            {capitale(s.motCle)} : <span className="text-brand">répondre à vos clients 24h/24</span>
          </h1>

          <EnBref>{s.enBref}</EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Créer mon assistant
            </Link>
            <a href={`#${ID_SOLUTION}`} className="btn-ghost text-base">
              Ce que fait l&apos;assistant
            </a>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        <BandeReperes
          reperes={[
            ["24h/24", "Répond aux messages reçus"],
            ["QR code", "Sur votre numéro actuel"],
            [`${s.faq.length} réponses`, `Aux questions propres au métier`],
          ]}
        />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              { id: ID_PROBLEME, libelle: `Ce que vivent les ${metier}` },
              { id: ID_SOLUTION, libelle: "Ce que fait l'assistant" },
              ENTREE_FAQ,
            ]}
          />
        </div>

        <SectionGuide
          id={ID_PROBLEME}
          titre={`Ce que vivent les ${metier} sur WhatsApp`}
          intro="Le constat d'abord, sans quoi la solution ne veut rien dire."
        >
          <Reveal>
            <div className="card">
              <p className="text-[1.0625rem] leading-relaxed text-ink/85">{s.angle}</p>
            </div>
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_SOLUTION}
          fond="teinte"
          titre="Ce que fait l'assistant Wapy"
          intro="Trois temps, les mêmes pour tous les métiers, appliqués à votre fiche."
        >
          <ol className="grid gap-3 md:grid-cols-3">
            {CE_QUE_FAIT_L_ASSISTANT.map(({ titre, texte }, i) => (
              <Reveal key={titre} delai={i * 80} className="h-full">
                <li className="card h-full">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-soft text-emerald-dark">
                    <Check className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.5} />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold leading-snug">{titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{texte}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal delai={240}>
            <BlocPreuve id="secteurs-couverts" />
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_FAQ}
          disposition="pleine"
          titre="Questions fréquentes"
          intro={`Les questions que posent les ${metier} avant de brancher un assistant sur leur numéro.`}
        >
          <Reveal>
            <FAQ items={s.faq} titre={null} colonnes={2} id={`${ID_FAQ}-liste`} />
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre="Essayez sur vos vraies conversations"
          texte={
            <>
              Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez déjà
              en scannant un QR code, sans changer de numéro.
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
