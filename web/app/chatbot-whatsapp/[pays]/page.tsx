import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire, { ENTREE_FAQ } from "@/components/seo/Sommaire";
import FAQ from "@/components/seo/FAQ";
import TableauComparatif, { type Ligne } from "@/components/seo/TableauComparatif";
import BlocPreuve from "@/components/seo/BlocPreuve";
import Population from "@/components/seo/Population";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { getPays, paysPublies } from "@/content/pays";
import { villesDuPays } from "@/content/villes";
import { getSecteur } from "@/content/secteurs";
import { liensSortants } from "@/lib/maillage";
import { serviceLd, faqLd, breadcrumbLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { auPays, resume } from "@/lib/texte";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

/** Identifiants d'ancrage posés par les sections, repris tels quels par le sommaire. */
const ID_CONTEXTE = "contexte";
const ID_SOLUTION = "solution";
const ID_REPERES = "reperes";
const ID_VILLES = "villes";
const ID_SECTEURS = "secteurs";

function titrePage(nom: string): string {
  return `Chatbot WhatsApp ${nom} : répondre à vos clients 24h/24`;
}

export function generateStaticParams() {
  return paysPublies().map((p) => ({ pays: p.slug }));
}

export function generateMetadata({ params }: { params: { pays: string } }): Metadata {
  const p = getPays(params.pays);
  if (!p || !p.publie) return {};
  const url = `${SITE_URL}/chatbot-whatsapp/${p.slug}`;
  const titre = titrePage(p.nom);
  const description = resume(p.enBref);
  return {
    title: `${titre} · Wapy`,
    description,
    keywords: [
      `chatbot WhatsApp ${p.nom}`,
      `assistant WhatsApp ${p.nom}`,
      `répondre automatiquement WhatsApp ${p.nom}`,
    ],
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

export default function PagePays({ params }: { params: { pays: string } }) {
  const p = getPays(params.pays);
  if (!p || !p.publie) notFound();

  const url = `${SITE_URL}/chatbot-whatsapp/${p.slug}`;
  const villes = villesDuPays(p.slug);
  const secteurs = p.secteursPhares.flatMap((slug) => {
    const s = getSecteur(slug);
    return s && s.publie ? [s] : [];
  });
  const liens = liensSortants(`/chatbot-whatsapp/${p.slug}`);
  const dansLePays = auPays(p);

  const reperes: Ligne[] = [
    { critere: "Indicatif téléphonique", valeur: p.indicatif },
    { critere: "Monnaie", valeur: p.monnaie },
    { critere: "Capitale", valeur: p.capitale },
    ...(p.capitaleEconomique && p.capitaleEconomique !== p.capitale
      ? [{ critere: "Capitale économique", valeur: p.capitaleEconomique }]
      : []),
    { critere: "Mobile Money", valeur: p.mobileMoney.join(", ") },
    { critere: "Opérateurs mobiles", valeur: p.operateurs.join(", ") },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={serviceLd({
          nom: `Chatbot WhatsApp ${p.nom}`,
          description: p.enBref,
          url,
          areaServed: { type: "Country", nom: p.nom },
        })}
      />
      <JsonLd data={faqLd(p.faq)} />
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Pays", url: `${SITE_URL}/chatbot-whatsapp` },
          { nom: p.nom, url },
        ])}
      />

      <SiteHeader lienSecondaire={{ href: "/chatbot-whatsapp", libelle: "Pays" }} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <Link href="/chatbot-whatsapp" className="hover:text-ink">
            Pays
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">{p.nom}</span>
        </nav>

        <div className="mt-5">
          <span className="chip !py-1 text-xs text-brand">
            {p.nom} {p.indicatif}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {titrePage(p.nom)}
        </h1>

        <EnBref>{p.enBref}</EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            { id: ID_CONTEXTE, libelle: `WhatsApp et le commerce ${dansLePays}` },
            { id: ID_SOLUTION, libelle: "Ce que fait l'assistant" },
            { id: ID_REPERES, libelle: "Ce qui change localement" },
            { id: ID_VILLES, libelle: "Villes couvertes" },
            { id: ID_SECTEURS, libelle: "Secteurs les plus concernés" },
            ENTREE_FAQ,
          ]}
        />

        <section id={ID_CONTEXTE} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            WhatsApp et le commerce {dansLePays}
          </h2>
          <p className="mt-4 text-muted">{p.angle}</p>
        </section>

        <section id={ID_SOLUTION} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ce que fait l&apos;assistant Wapy</h2>
          {/*
            Chaque affirmation des paragraphes ci-dessous est vérifiable dans le
            code du produit : réponse tirée de la seule fiche et interdiction
            d'inventer une donnée absente, conduite de la demande jusqu'à son
            enregistrement avec notification du responsable, passage de main
            limité aux cas rares, information manquante qui ne déclenche PAS de
            transfert, et réponse en français seulement
            (brain/brain.py, construction du prompt système).
          */}
          <p className="mt-4 text-muted">
            Wapy répond depuis la fiche que vous remplissez : vos horaires,
            votre adresse, votre catalogue, vos tarifs, vos consignes. Il mène la demande
            jusqu&apos;au bout au lieu d&apos;accuser réception, pose les questions qui
            manquent, confirme au client, enregistre la commande ou la réservation et vous
            envoie le récapitulatif sur WhatsApp. Il ne vous passe la main que dans les cas
            rares où un humain est indispensable : une réclamation, un sujet sensible, ou un
            client qui demande explicitement à vous parler.
          </p>
          <p className="mt-4 text-muted">
            Quand une information manque à la fiche, il ne vous dérange pas pour autant : il
            dit qu&apos;il se renseigne, sans jamais avancer un prix ni une disponibilité
            qu&apos;il n&apos;a pas. Ses réponses sont en français, la seule langue prévue à
            ce jour.
          </p>
          <BlocPreuve id="formats-numeros" />
        </section>

        <section id={ID_REPERES} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ce qui change {dansLePays}</h2>
          <TableauComparatif
            colonnes={[
              { cle: "critere", libelle: "Critère" },
              { cle: "valeur", libelle: p.nom },
            ]}
            lignes={reperes}
            legende={`Repères utiles pour paramétrer un assistant WhatsApp ${dansLePays}.`}
          />
          <Population chiffre={p.population} />
          <ul className="mt-6 space-y-2">
            {p.particularites.map((x) => (
              <li key={x} className="flex gap-2 text-muted">
                <span aria-hidden="true" className="text-brand">
                  ·
                </span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id={ID_VILLES} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Villes couvertes {dansLePays}</h2>
          <p className="mt-4 text-muted">
            L&apos;assistant répond aux messages du compte WhatsApp que vous connectez, quelle
            que soit la ville où vous travaillez. Les pages détaillées de ces villes arrivent
            progressivement.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {villes.map((v) =>
              v.publie ? (
                <li key={v.slug}>
                  <Link
                    href={`/chatbot-whatsapp/${v.pays}/${v.slug}`}
                    className="chip !py-1 text-brand hover:underline"
                  >
                    {v.nom}
                  </Link>
                </li>
              ) : (
                <li key={v.slug} className="chip !py-1 text-muted">
                  {v.nom}
                </li>
              ),
            )}
          </ul>
        </section>

        <section id={ID_SECTEURS} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Secteurs les plus concernés {dansLePays}
          </h2>
          <p className="mt-4 text-muted">
            Les questions d&apos;un client ne sont pas les mêmes d&apos;un métier à
            l&apos;autre. Chaque guide part des demandes réelles du secteur.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {secteurs.map((s) => (
              <li key={s.slug} className="flex">
                <Link
                  href={`/secteurs/${s.slug}`}
                  className="block w-full rounded-xl border border-line bg-surface p-4 text-sm font-semibold shadow-soft transition hover:text-brand hover:shadow-lift"
                >
                  {s.nom}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <FAQ items={p.faq} />

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Essayez {dansLePays}</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez
            déjà en scannant un QR code, sans changer de numéro.
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
