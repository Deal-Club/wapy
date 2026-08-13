import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Minus, Phone, Coins, Building } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import ParcoursMessage from "@/components/ParcoursMessage";
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

      <main>
        <HeroGuide
          visuel={
            /* Carte d'identité du pays : les trois repères qu'on cherche en
               premier pour paramétrer un assistant. Le tableau de la section
               « Ce qui change » les reprend avec les opérateurs et la capitale
               économique, c'est lui qui fait foi. */
            <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                Repères locaux
              </p>
              <p className="mt-2 font-display text-2xl font-bold">{p.nom}</p>
              <dl className="mt-5 space-y-3.5">
                {[
                  { Icone: Phone, cle: "Indicatif", valeur: p.indicatif },
                  { Icone: Coins, cle: "Mobile Money", valeur: p.mobileMoney.join(", ") },
                  { Icone: Building, cle: "Capitale", valeur: p.capitale },
                ].map(({ Icone, cle, valeur }) => (
                  <div key={cle} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icone className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted">{cle}</dt>
                      <dd className="text-sm font-semibold leading-snug">{valeur}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <Link href="/chatbot-whatsapp" className="transition hover:text-brand">
              Pays
            </Link>
            <span className="text-ink/70">{p.nom}</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">
            {p.nom} {p.indicatif}
          </span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.8rem]">
            Chatbot WhatsApp {p.nom} :{" "}
            <span className="text-brand">répondre à vos clients 24h/24</span>
          </h1>

          <EnBref>{p.enBref}</EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Créer mon assistant
            </Link>
            <a href={`#${ID_REPERES}`} className="btn-ghost text-base">
              Ce qui change {dansLePays}
            </a>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        {/* Trois repères tenus par le code ou comptés sur les données du pays :
            l'assistant répond aux messages reçus tant que la session est
            connectée, la facturation se fait dans la monnaie du pays, et les
            guides métier liés sont ceux de `secteursPhares` réellement publiés. */}
        <BandeReperes
          reperes={[
            ["24h/24", "Répond aux messages reçus"],
            ["Franc CFA", `Facturation en ${p.monnaie}`],
            [`${secteurs.length} guides`, "Métiers les plus concernés"],
          ]}
        />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              { id: ID_CONTEXTE, libelle: `WhatsApp et le commerce ${dansLePays}` },
              { id: ID_SOLUTION, libelle: "Ce que fait l'assistant" },
              { id: ID_REPERES, libelle: "Ce qui change localement" },
              { id: ID_VILLES, libelle: "Villes couvertes" },
              { id: ID_SECTEURS, libelle: "Secteurs les plus concernés" },
              ENTREE_FAQ,
            ]}
          />
        </div>

        <SectionGuide
          id={ID_CONTEXTE}
          titre={`WhatsApp et le commerce ${dansLePays}`}
          intro="Le terrain d'abord : à qui les clients écrivent, et à quel moment."
        >
          <Reveal>
            <div className="card">
              <p className="text-[1.0625rem] leading-relaxed text-ink/85">{p.angle}</p>
            </div>
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_SOLUTION}
          fond="teinte"
          titre="Ce que fait l'assistant Wapy"
          intro="Le même trajet pour chaque message reçu, quel que soit le pays."
        >
          <Reveal>
            <div className="card">
              {/*
                Chaque affirmation des paragraphes ci-dessous est vérifiable dans le
                code du produit : réponse tirée de la seule fiche et interdiction
                d'inventer une donnée absente, conduite de la demande jusqu'à son
                enregistrement avec notification du responsable, passage de main
                limité aux cas rares, information manquante qui ne déclenche PAS de
                transfert, et réponse en français seulement
                (brain/brain.py, construction du prompt système).
              */}
              <p className="leading-relaxed text-muted">
                Wapy répond depuis la fiche que vous remplissez : vos horaires, votre adresse,
                votre catalogue, vos tarifs, vos consignes. Il mène la demande jusqu&apos;au bout
                au lieu d&apos;accuser réception, pose les questions qui manquent, confirme au
                client, enregistre la commande ou la réservation et vous envoie le récapitulatif
                sur WhatsApp. Il ne vous passe la main que dans les cas rares où un humain est
                indispensable : une réclamation, un sujet sensible, ou un client qui demande
                explicitement à vous parler.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Quand une information manque à la fiche, il ne vous dérange pas pour autant : il
                dit qu&apos;il se renseigne, sans jamais avancer un prix ni une disponibilité
                qu&apos;il n&apos;a pas. Ses réponses sont en français, la seule langue prévue à
                ce jour.
              </p>
            </div>
          </Reveal>

          <Reveal delai={80}>
            <div className="mt-8">
              <ParcoursMessage />
            </div>
          </Reveal>

          <Reveal delai={160}>
            <BlocPreuve id="formats-numeros" />
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_REPERES}
          disposition="pleine"
          titre={`Ce qui change ${dansLePays}`}
          intro="Les repères à connaitre pour paramétrer une fiche qui parle à vos clients."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="min-w-0">
              <TableauComparatif
                colonnes={[
                  { cle: "critere", libelle: "Critère" },
                  { cle: "valeur", libelle: p.nom },
                ]}
                lignes={reperes}
                legende={`Repères utiles pour paramétrer un assistant WhatsApp ${dansLePays}.`}
              />
              <Population chiffre={p.population} />
            </div>

            {/* Les particularités locales : ce que le tableau ne peut pas dire
                en une cellule. */}
            <ul className="divide-y divide-line self-start overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft">
              {p.particularites.map((x) => (
                <li key={x} className="flex items-start gap-3 p-5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <span className="text-sm leading-relaxed text-muted">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionGuide>

        {/* En pleine largeur : une poignée de pastilles dans une colonne de
            droite laisse la moitié gauche vide sous le titre. */}
        <SectionGuide
          id={ID_VILLES}
          disposition="pleine"
          titre={`Villes couvertes ${dansLePays}`}
          intro="L'assistant répond aux messages du compte WhatsApp que vous connectez, quelle que soit la ville où vous travaillez. Les pages détaillées de ces villes arrivent progressivement."
        >
          <ul className="flex flex-wrap gap-2">
            {villes.map((v) =>
              v.publie ? (
                <li key={v.slug}>
                  <Link
                    href={`/chatbot-whatsapp/${v.pays}/${v.slug}`}
                    className="chip !py-1.5 font-medium text-brand"
                  >
                    {v.nom}
                  </Link>
                </li>
              ) : (
                /* Ville non publiée : nommée, jamais cliquable. Un lien mort
                   coûte plus cher qu'une ville qui attend sa page. */
                <li
                  key={v.slug}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-muted"
                >
                  {v.nom}
                </li>
              ),
            )}
          </ul>
        </SectionGuide>

        <SectionGuide
          id={ID_SECTEURS}
          fond="teinte"
          disposition="pleine"
          titre={`Secteurs les plus concernés ${dansLePays}`}
          intro="Les questions d'un client ne sont pas les mêmes d'un métier à l'autre. Chaque guide part des demandes réelles du secteur."
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {secteurs.map((s, i) => {
              const Icone = iconeSecteur(s.slug);
              return (
                <Reveal key={s.slug} delai={i * 70} className="h-full">
                  <li className="h-full">
                    <Link
                      href={`/secteurs/${s.slug}`}
                      className="group flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
                        <Icone className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span className="flex-1 text-sm font-semibold leading-snug transition group-hover:text-brand">
                        {s.nom}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-line transition duration-300 group-hover:translate-x-0.5 group-hover:text-brand"
                        strokeWidth={2.25}
                      />
                    </Link>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </SectionGuide>

        <SectionGuide id={ID_FAQ} disposition="pleine" titre="Questions fréquentes">
          <Reveal>
            <FAQ items={p.faq} titre={null} colonnes={2} id={`${ID_FAQ}-liste`} />
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre={`Essayez ${dansLePays}`}
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
