import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire from "@/components/seo/Sommaire";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import Figure from "@/components/seo/Figure";
import { ETAPES } from "@/content/etapes";
import { PARCOURS_MESSAGE } from "@/content/illustrations";
import { JOURS_ESSAI } from "@/content/plans";
import { liensSortants } from "@/lib/maillage";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { howToLd, breadcrumbLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

const URL_PAGE = `${SITE_URL}/comment-ca-marche`;
const TITRE = "Comment ça marche : mettre en place l'assistant WhatsApp";
// 155 caractères maximum : au-delà, Google tronque et choisit lui-même où.
const DESCRIPTION =
  "Décrire son activité, corriger la fiche, écrire ses consignes, scanner le QR code : les étapes réelles pour mettre Wapy en ligne sur votre numéro.";

/** Titre du procédé décrit, repris à l'identique par le balisage HowTo. */
const NOM_PROCEDE = "Mettre en place un assistant WhatsApp avec Wapy";

/** Identifiants d'ancrage posés par les sections, repris tels quels par le sommaire. */
const ID_ETAPES = "etapes";
const ID_ENSUITE = "ensuite";
const ID_PREREQUIS = "prerequis";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: [
    "comment ça marche Wapy",
    "installer chatbot WhatsApp",
    "connecter WhatsApp QR code",
  ],
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

export default function PageCommentCaMarche() {
  const liens = liensSortants("/comment-ca-marche");

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd data={howToLd({ nom: NOM_PROCEDE, etapes: ETAPES })} />
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Comment ça marche", url: URL_PAGE },
        ])}
      />

      <SiteHeader lienSecondaire={{ href: "/tarifs", libelle: "Tarifs" }} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">Comment ça marche</span>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {TITRE}
        </h1>

        <EnBref>
          Vous décrivez votre activité, vous corrigez la fiche que l&apos;intelligence
          artificielle propose, vous ajoutez vos consignes, puis vous scannez un QR code depuis
          WhatsApp. L&apos;assistant répond ensuite sur votre numéro habituel, à partir de cette
          seule fiche.
        </EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            { id: ID_ETAPES, libelle: `Les ${ETAPES.length} étapes de la mise en route` },
            { id: ID_ENSUITE, libelle: "Ce qui se passe une fois en ligne" },
            { id: ID_PREREQUIS, libelle: "Ce qu'il vous faut avant de commencer" },
          ]}
        />

        <section id={ID_ETAPES} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Les {ETAPES.length} étapes de la mise en route
          </h2>
          <ol className="mt-6 space-y-6">
            {ETAPES.map((e, i) => (
              <li key={e.nom} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{e.nom}</h3>
                  <p className="mt-1.5 text-muted">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id={ID_ENSUITE} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ce qui se passe une fois en ligne</h2>
          <Figure illustration={PARCOURS_MESSAGE} />
          <p className="mt-4 text-muted">
            {/* brain/brain.py:56-70 (conduite de la demande jusqu'à son
                enregistrement) et brain.py:119-138 (escalade rare, information
                manquante qui ne déclenche pas de transfert). */}
            L&apos;assistant lit chaque message reçu et compose sa réponse à partir de votre
            fiche. Il mène la demande jusqu&apos;au bout plutôt que d&apos;accuser réception :
            il pose les questions qui manquent, confirme au client, inscrit la réservation ou la
            commande dans votre carnet et vous envoie le récapitulatif.
          </p>
          <p className="mt-4 text-muted">
            Il vous passe la main dans les cas rares où un humain est indispensable : une
            réclamation, un sujet sensible, un client qui demande explicitement à vous parler, ou
            une consigne de votre fiche qui l&apos;exige. Quand une information manque, il dit
            qu&apos;il se renseigne plutôt que d&apos;avancer un prix ou une disponibilité
            qu&apos;il n&apos;a pas.
          </p>
          <p className="mt-4 text-muted">
            {/* saas/bot.py:20,55-100 : relais du responsable par citation de
                l'alerte, commande de retour au bot. */}
            Quand il vous passe la main, l&apos;alerte arrive sur votre WhatsApp. Vous citez ce
            message et votre réponse part au client, ou vous répondez depuis le tableau de bord.
            Un mot convenu rend ensuite la conversation à l&apos;assistant.
          </p>
        </section>

        <section id={ID_PREREQUIS} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">
            Ce qu&apos;il vous faut avant de commencer
          </h2>
          <ul className="mt-5 space-y-2">
            {[
              "Un compte WhatsApp actif sur un téléphone, celui que vos clients utilisent déjà pour vous écrire.",
              "Vos informations pratiques sous la main : horaires, adresse, moyens de paiement, catalogue ou prestations avec leurs prix.",
              "Une adresse électronique pour créer le compte, et un navigateur. Aucune installation, aucune ligne de code.",
              "Un peu de temps pour relire la fiche : c'est le seul travail qui compte vraiment, puisque tout ce que l'assistant dira en vient.",
            ].map((t) => (
              <li key={t} className="flex gap-2 text-muted">
                <span aria-hidden="true" className="text-brand">
                  ·
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted">
            L&apos;assistant ne répond qu&apos;en français, et il n&apos;envoie ni campagne ni
            message en nombre : il répond à ce qu&apos;on lui écrit. Si votre besoin est
            d&apos;émettre vers une liste de contacts, ce n&apos;est pas le bon outil.
          </p>
        </section>

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">
            Le plus long, c&apos;est de relire la fiche
          </h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Le reste tient en un QR code scanné. Ensuite, {JOURS_ESSAI} jours d&apos;essai gratuit
            sur vos vraies conversations, sans changer de numéro.
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
