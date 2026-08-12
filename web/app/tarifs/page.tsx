import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">Tarifs</span>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {TITRE}
        </h1>

        <EnBref>
          Wapy se règle par abonnement mensuel, facturé en francs CFA, après sept jours
          d&apos;essai gratuit. Trois plans se distinguent par les fonctions ouvertes et par le
          nombre de comptes et de documents autorisés. Les montants ne sont pas publiés à ce jour.
        </EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            { id: ID_ESSAI, libelle: `Les ${JOURS_ESSAI} jours d'essai` },
            { id: ID_PLANS, libelle: "Les trois plans" },
            { id: ID_OPTIONS, libelle: "Les options" },
            { id: ID_MONTANTS, libelle: "Ce que vous payez, et ce qui est compté" },
          ]}
        />

        <section id={ID_ESSAI} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Les {JOURS_ESSAI} jours d&apos;essai
          </h2>
          <p className="mt-4 text-muted">
            {/* saas/app.py:243-247 (abonnement créé en statut « trial ») et
                saas/billing.py:14,69 (TRIAL_DAYS = 7, TRIAL_ENT = toutes les
                fonctions, sans limite). */}
            L&apos;inscription ouvre un essai de {JOURS_ESSAI} jours pendant lequel toutes les
            fonctions sont accessibles, sans limite de comptes ni de documents. Aucun moyen de
            paiement n&apos;est demandé pour le démarrer, et le compte WhatsApp lié se délie depuis
            le tableau de bord.
          </p>
          <p className="mt-4 text-muted">
            Un essai ne vaut que sur vos vraies conversations. Sept jours suffisent à voir ce que
            l&apos;assistant répond à vos clients habituels, et surtout à repérer ce qui manque
            dans votre fiche, puisque c&apos;est elle qui décide de ses réponses.
          </p>
        </section>

        <section id={ID_PLANS} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Les trois plans</h2>
          <p className="mt-4 text-muted">
            {/* saas/billing.py:34-50. Les limites citées sont les deux que le code
                contrôle vraiment : agents (saas/app.py:285-289) et documents
                (saas/app.py:696-698). */}
            Les trois plans donnent le même assistant sur le même numéro. Ce qui change est
            l&apos;étendue des fonctions ouvertes, ainsi que le nombre de comptes collaborateurs et
            de documents autorisés, les deux seules limites que la plateforme applique.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            {PLANS.map((p) => (
              <li
                key={p.slug}
                className="flex flex-col rounded-xl2 border border-line bg-surface p-6 shadow-soft"
              >
                <h3 className="font-display text-xl font-bold">{p.nom}</h3>
                <p className="mt-2 text-sm text-muted">{p.resume}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                  {p.inclus.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="text-brand">
                        ·
                      </span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                  {p.limites.join(". ")}.
                </p>
              </li>
            ))}
          </ul>

          <TableauComparatif
            colonnes={COLONNES_TARIFS}
            lignes={lignesTarifs(PLANS)}
            legende="Composition des plans relevée sur la plateforme le 11 août 2026. La colonne Tarif reste vide de montant tant que la grille n'est pas arrêtée."
          />
        </section>

        <section id={ID_OPTIONS} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Les options</h2>
          <p className="mt-4 text-muted">
            {/* saas/billing.py:53-64. L'add-on « +1 000 conversations » n'est pas
                repris : il augmente une limite qu'aucun code ne contrôle. */}
            Une fonction absente de votre plan peut s&apos;activer à part, sans changer de plan.
            Chaque option s&apos;ajoute à l&apos;abonnement et ouvre le service correspondant.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {OPTIONS.map((o) => (
              <li key={o.slug} className="chip">
                {o.nom}
              </li>
            ))}
          </ul>
        </section>

        <section id={ID_MONTANTS} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Ce que vous payez, et ce qui est compté
          </h2>
          <p className="mt-4 text-muted">
            La facturation est mensuelle, en francs CFA, sans engagement de durée et sans frais
            de mise en service. L&apos;entrée de gamme est à 9 900 FCFA par mois, et
            l&apos;essai de {JOURS_ESSAI} jours la précède, sans carte bancaire.
          </p>
          <p className="mt-4 text-muted">
            Ce qui est compté, c&apos;est la conversation : un client qui vous écrit dans le mois
            compte pour une, qu&apos;il envoie deux messages ou trente, et qu&apos;il revienne ou
            non les jours suivants. Un habitué qui vous écrit chaque semaine reste donc une seule
            conversation sur sa facture. Le plan Starter en couvre 500 par mois, le plan Pro
            2 000, le plan Business 6 000.
          </p>
          <p className="mt-4 text-muted">
            Si vous atteignez le plafond, les échanges déjà engagés continuent normalement et
            vous êtes prévenu sur WhatsApp. Les nouveaux clients reçoivent un message
            d&apos;attente jusqu&apos;à ce que vous ajoutiez du volume : rien ne se coupe sans
            que vous le sachiez.
          </p>
        </section>

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Essayez avant de choisir un plan</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit, toutes fonctions ouvertes. Vous liez le compte
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
