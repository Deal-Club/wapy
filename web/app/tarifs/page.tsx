import type { Metadata } from "next";
import Link from "next/link";
import { Check, Plus, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import Note from "@/components/gabarit/Note";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire from "@/components/seo/Sommaire";
import TableauComparatif from "@/components/seo/TableauComparatif";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import {
  PLANS,
  OPTIONS,
  JOURS_ESSAI,
  COLONNES_TARIFS,
  TARIF_NON_PUBLIE,
  lignesTarifs,
  offresPubliables,
} from "@/content/plans";
import { liensSortants } from "@/lib/maillage";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { breadcrumbLd, offerLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

const URL_PAGE = `${SITE_URL}/tarifs`;
const TITRE = "Tarifs de Wapy : trois plans, sept jours d'essai";
// 155 caractères maximum : au-delà, Google tronque et choisit lui-même où.
// `tests/metadonnees.test.ts` mesure la description réellement exportée.
const DESCRIPTION =
  "Les trois plans de l'assistant WhatsApp Wapy, ce que chacun contient et les limites appliquées, après sept jours d'essai et en francs CFA.";

/** Identifiants d'ancrage posés par les sections, repris tels quels par le sommaire. */
const ID_ESSAI = "essai";
const ID_PLANS = "plans";
const ID_OPTIONS = "options";
const ID_MONTANTS = "montants";

/*
  Repères du haut de page. Trois plans comptés sur `content/plans.ts`, essai de
  `JOURS_ESSAI` jours (`saas/billing.py:14`), aucun moyen de paiement demandé à
  l'inscription (`saas/app.py:243-247`, abonnement créé en statut « trial »),
  facturation mensuelle en francs CFA (`content/plans.ts`, devise XOF). Aucun
  montant : la grille n'est pas arrêtée.
*/
const REPERES: [string, string][] = [
  [`${PLANS.length} plans`, "Le même assistant, des fonctions différentes"],
  [`${JOURS_ESSAI} jours`, "D'essai, toutes fonctions ouvertes"],
  ["Sans carte", "Aucun moyen de paiement pour démarrer"],
  ["Mensuel", "Facturation en francs CFA"],
];

/*
  Ce que l'essai ouvre vraiment (`saas/billing.py:69`, TRIAL_ENT : toutes les
  fonctions, sans limite). Ces trois lignes tiennent lieu de démonstration : ce
  sont les seules garanties que le code donne sur la période d'essai.
*/
const CE_QUE_OUVRE_L_ESSAI = [
  "Toutes les fonctions des trois plans",
  "Sans limite de comptes ni de documents",
  "Aucun moyen de paiement à fournir",
];

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["tarifs Wapy", "prix assistant WhatsApp", "abonnement chatbot WhatsApp"],
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

export default function PageTarifs() {
  const liens = liensSortants("/tarifs");
  // `offerLd` lève sur un tableau vide (schema.ts) : tant qu'aucun plan ne porte
  // de montant, la page n'émet aucune AggregateOffer. Le jour où `content/plans.ts`
  // reçoit des prix, le balisage apparait sans qu'on touche à ce fichier.
  const offres = offresPubliables(PLANS);

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Tarifs", url: URL_PAGE },
        ])}
      />
      {offres.length > 0 && <JsonLd data={offerLd(offres)} />}

      <SiteHeader lienSecondaire={{ href: "/comment-ca-marche", libelle: "Comment ça marche" }} />

      <main>
        <HeroGuide
          visuel={
            /* L'essai plutôt qu'une image : sur une page de tarifs, ce que le
               visiteur cherche d'abord est ce qu'il obtient sans payer. */
            <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                Avant tout abonnement
              </p>
              <p className="mt-3 font-display text-5xl font-bold leading-none text-brand">
                {JOURS_ESSAI} jours
              </p>
              <p className="mt-2 font-display text-lg font-bold">d&apos;essai gratuit</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {CE_QUE_OUVRE_L_ESSAI.map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald"
                      strokeWidth={2.5}
                    />
                    <span className="text-muted">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand" strokeWidth={1.75} />
                Le compte WhatsApp lié se délie depuis le tableau de bord.
              </p>
            </div>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Tarifs</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Abonnement mensuel</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            Tarifs de Wapy : trois plans,{" "}
            <span className="text-brand">sept jours d&apos;essai</span>
          </h1>

          <EnBref>
            Wapy se règle par abonnement mensuel, facturé en francs CFA, après sept jours d&apos;essai
            gratuit. Trois plans se distinguent par les fonctions ouvertes et par le nombre de
            comptes et de documents autorisés. Les montants ne sont pas publiés à ce jour.
          </EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Commencer l&apos;essai
            </Link>
            <a href={`#${ID_PLANS}`} className="btn-ghost text-base">
              Comparer les plans
            </a>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        <BandeReperes reperes={REPERES} />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              { id: ID_ESSAI, libelle: `Les ${JOURS_ESSAI} jours d'essai` },
              { id: ID_PLANS, libelle: "Les trois plans" },
              { id: ID_OPTIONS, libelle: "Les options" },
              { id: ID_MONTANTS, libelle: "Pourquoi aucun montant n'est affiché" },
            ]}
          />
        </div>

        <SectionGuide
          id={ID_ESSAI}
          titre={`Les ${JOURS_ESSAI} jours d'essai`}
          intro="Ce que la période ouvre, et ce qu'elle sert vraiment à vérifier."
        >
          <Reveal>
            <div className="card">
              <p className="leading-relaxed text-muted">
                {/* saas/app.py:243-247 (abonnement créé en statut « trial ») et
                    saas/billing.py:14,69 (TRIAL_DAYS = 7, TRIAL_ENT = toutes les
                    fonctions, sans limite). */}
                L&apos;inscription ouvre un essai de {JOURS_ESSAI} jours pendant lequel toutes les
                fonctions sont accessibles, sans limite de comptes ni de documents. Aucun moyen de
                paiement n&apos;est demandé pour le démarrer, et le compte WhatsApp lié se délie
                depuis le tableau de bord.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Un essai ne vaut que sur vos vraies conversations. Sept jours suffisent à voir ce
                que l&apos;assistant répond à vos clients habituels, et surtout à repérer ce qui
                manque dans votre fiche, puisque c&apos;est elle qui décide de ses réponses.
              </p>
            </div>
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_PLANS}
          fond="teinte"
          disposition="pleine"
          titre="Les trois plans"
          intro={
            <>
              {/* saas/billing.py:34-50. Les limites citées sont les deux que le code
                  contrôle vraiment : agents (saas/app.py:285-289) et documents
                  (saas/app.py:696-698). */}
              Les trois plans donnent le même assistant sur le même numéro. Ce qui change est
              l&apos;étendue des fonctions ouvertes, ainsi que le nombre de comptes collaborateurs
              et de documents autorisés, les deux seules limites que la plateforme applique.
            </>
          }
        >
          <ul className="grid gap-5 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.slug} delai={i * 80} className="h-full">
                <li className="flex h-full flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
                  <h3 className="font-display text-xl font-bold">{p.nom}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.resume}</p>

                  {/* Le tarif tient la même place sur les trois cartes, occupée
                      aujourd'hui par la mention d'absence : une carte de plan
                      sans ligne de prix se lit comme une carte inachevée. */}
                  <p className="mt-5 rounded-lg border border-dashed border-line bg-cream px-3 py-2 text-center text-xs font-semibold text-muted">
                    {TARIF_NON_PUBLIE}
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {p.inclus.map((inclus) => (
                      <li key={inclus} className="flex items-start gap-2.5">
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald"
                          strokeWidth={2.5}
                        />
                        <span className="leading-snug text-muted">{inclus}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                      Limites appliquées
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {p.limites.join(". ")}.
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>

          <TableauComparatif
            colonnes={COLONNES_TARIFS}
            lignes={lignesTarifs(PLANS)}
            legende="Composition des plans relevée sur la plateforme le 11 août 2026. La colonne Tarif reste vide de montant tant que la grille n'est pas arrêtée."
          />
        </SectionGuide>

        <SectionGuide
          id={ID_OPTIONS}
          titre="Les options"
          intro={
            <>
              {/* saas/billing.py:53-64. L'add-on « +1 000 conversations » n'est pas
                  repris : il augmente une limite qu'aucun code ne contrôle. */}
              Une fonction absente de votre plan peut s&apos;activer à part, sans changer de plan.
              Chaque option s&apos;ajoute à l&apos;abonnement et ouvre le service correspondant.
            </>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((o, i) => (
              <Reveal key={o.slug} delai={(i % 2) * 60} className="h-full">
                <li className="flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-soft">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="text-sm font-semibold leading-snug">{o.nom}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </SectionGuide>

        <SectionGuide
          id={ID_MONTANTS}
          titre="Pourquoi aucun montant n'est affiché"
          intro="La grille est en cours de révision, et un tarif corrigé coûte plus cher qu'un tarif annoncé plus tard."
        >
          <Reveal>
            <div className="card">
              <p className="leading-relaxed text-muted">
                La grille tarifaire est en cours de révision. Publier des montants aujourd&apos;hui
                reviendrait à vous engager sur des valeurs qui vont bouger, et un tarif annoncé puis
                corrigé coûte plus cher en confiance qu&apos;un tarif annoncé plus tard. La colonne
                Tarif du tableau porte donc la mention « {TARIF_NON_PUBLIE} ».
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Ce qui est acquis, en revanche : la facturation est mensuelle, en francs CFA, et
                l&apos;essai de {JOURS_ESSAI} jours la précède. Écrivez-nous ou lancez l&apos;essai
                pour connaitre le montant applicable à votre établissement.
              </p>
            </div>
          </Reveal>

          <Reveal delai={80}>
            <div className="mt-6">
              <Note>
                Le jour où la grille est arrêtée, les montants paraissent ici, dans le tableau et
                dans le balisage de la page sans qu&apos;aucune autre page soit à reprendre : ils
                sont lus depuis un seul fichier de données.
              </Note>
            </div>
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre="Essayez avant de choisir un plan"
          texte={
            <>
              Sept jours d&apos;essai gratuit, toutes fonctions ouvertes. Vous liez le compte
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
