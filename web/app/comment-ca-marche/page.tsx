import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Clock,
  ListChecks,
  MessageCircle,
  QrCode,
  Reply,
  Sparkles,
  Table,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import ParcoursMessage from "@/components/ParcoursMessage";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import Note from "@/components/gabarit/Note";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire from "@/components/seo/Sommaire";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { ETAPES } from "@/content/etapes";
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

/*
  Scène illustrée servie par Cloudinary, comme celles de l'accueil : voir le
  commentaire de `app/page.tsx` pour la raison (poids du dépôt, remplacement
  d'un visuel sans redéploiement) et `next.config.js` pour l'autorisation du
  domaine, restreinte à ce compte.
*/
const SCENE_SCANNER =
  "https://res.cloudinary.com/ocenevpc/image/upload/wapy/scenes/etape-scanner.webp";

/*
  Une icône par étape, dans l'ordre de `content/etapes.ts` : génération de la
  fiche par l'IA, correction du tableau, consignes de la maison, connexion par
  QR code, puis conversation. L'ordre des étapes est imposé par la plateforme et
  ne bouge pas ; une étape ajoutée sans icône retombe sur `MessageCircle`, la
  ligne s'affiche et rien ne casse.
*/
const ICONES_ETAPE: LucideIcon[] = [Sparkles, Table, ListChecks, QrCode, MessageCircle];

/*
  Ce que l'assistant fait une fois la ligne connectée, en trois temps.

  Ancrage : conduite de la demande jusqu'à son enregistrement
  (`brain/brain.py:56-70`), escalade réservée aux cas sensibles et information
  manquante qui ne déclenche PAS de transfert (`brain/brain.py:119-138`), relais
  du responsable par citation de l'alerte et commande de retour au bot
  (`saas/bot.py:20,55-100`).
*/
const UNE_FOIS_EN_LIGNE: { Icone: LucideIcon; titre: string; texte: string }[] = [
  {
    Icone: MessageCircle,
    titre: "Il mène la demande jusqu'au bout",
    texte:
      "L'assistant lit chaque message reçu et compose sa réponse à partir de votre fiche. Il mène la demande jusqu'au bout plutôt que d'accuser réception : il pose les questions qui manquent, confirme au client, inscrit la réservation ou la commande dans votre carnet et vous envoie le récapitulatif.",
  },
  {
    Icone: UserRound,
    titre: "Il vous passe la main dans les cas rares",
    texte:
      "Une réclamation, un sujet sensible, un client qui demande explicitement à vous parler, ou une consigne de votre fiche qui l'exige : l'assistant s'efface. Quand une information manque, il dit qu'il se renseigne plutôt que d'avancer un prix ou une disponibilité qu'il n'a pas.",
  },
  {
    Icone: Reply,
    titre: "Vous reprenez la conversation quand vous voulez",
    texte:
      "Quand il vous passe la main, l'alerte arrive sur votre WhatsApp. Vous citez ce message et votre réponse part au client, ou vous répondez depuis le tableau de bord. Un mot convenu rend ensuite la conversation à l'assistant.",
  },
];

/*
  Les prérequis, en titre court et explication : le visiteur vérifie en un coup
  d'oeil qu'il a ce qu'il faut, sans lire quatre phrases entières. Aucun n'est
  une exigence technique inventée, ce sont les quatre choses que la mise en
  route demande réellement.
*/
const PREREQUIS: { titre: string; texte: string }[] = [
  {
    titre: "Un compte WhatsApp actif",
    texte: "Sur un téléphone, celui que vos clients utilisent déjà pour vous écrire.",
  },
  {
    titre: "Vos informations pratiques",
    texte:
      "Horaires, adresse, moyens de paiement, catalogue ou prestations avec leurs prix.",
  },
  {
    titre: "Une adresse électronique et un navigateur",
    texte: "Pour créer le compte. Aucune installation, aucune ligne de code.",
  },
  {
    titre: "Un peu de temps pour relire la fiche",
    texte:
      "C'est le seul travail qui compte vraiment, puisque tout ce que l'assistant dira en vient.",
  },
];

/*
  Les repères du haut de page, tous vérifiables : le nombre d'étapes est compté
  sur `content/etapes.ts`, la connexion se fait bien par QR code
  (`saas/wa.py:73-79`), rien ne s'installe (application web), et l'essai dure
  `JOURS_ESSAI` jours (`saas/billing.py:14`). Ni durée de mise en route, ni
  volume d'usage : rien ne les mesure.
*/
const REPERES: [string, string][] = [
  [`${ETAPES.length} étapes`, "De la description à la première réponse"],
  ["QR code", "Sur votre numéro actuel"],
  ["Sans code", "Rien à installer sur votre téléphone"],
  [`${JOURS_ESSAI} jours`, "D'essai gratuit"],
];

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

      <main>
        {/* --- Haut de page ---------------------------------------------------
            Le guide s'ouvre comme une page, pas comme un article : le titre et
            la réponse directe à gauche, la scène de la mise en route à droite. */}
        <HeroGuide
          visuel={
            /* La scène de la connexion : le seul geste technique de la mise en
               route. Cadre à dégradé vert très pâle, comme les cartes d'étapes
               de l'accueil, pour détacher un dessin sur fond blanc d'une page
               blanche. */
            <figure className="overflow-hidden rounded-xl2 border border-line bg-gradient-to-b from-emerald-soft/70 to-surface shadow-lift">
              <Image
                src={SCENE_SCANNER}
                alt="Un commerçant scanne un QR code avec son téléphone ; la conversation s'ouvre au-dessus sous forme de bulles de messages."
                width={900}
                height={675}
                priority
                sizes="(min-width: 768px) 520px, 100vw"
                className="w-full"
              />
              <figcaption className="border-t border-line/70 bg-surface px-5 py-3.5 text-sm text-muted">
                Le seul geste technique de la mise en route : scanner le QR code depuis WhatsApp,
                comme pour WhatsApp Web.
              </figcaption>
            </figure>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">Comment ça marche</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Guide de mise en route</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            Comment ça marche : mettre en place{" "}
            <span className="text-brand">l&apos;assistant WhatsApp</span>
          </h1>

          <EnBref>
            Vous décrivez votre activité, vous corrigez la fiche que l&apos;intelligence
            artificielle propose, vous ajoutez vos consignes, puis vous scannez un QR code depuis
            WhatsApp. L&apos;assistant répond ensuite sur votre numéro habituel, à partir de cette
            seule fiche.
          </EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Créer mon assistant
            </Link>
            <a href={`#${ID_ETAPES}`} className="btn-ghost text-base">
              Voir les {ETAPES.length} étapes
            </a>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        {/* Repères : quatre faits tenus par le code, avant d'entrer dans le détail. */}
        <BandeReperes reperes={REPERES} />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              { id: ID_ETAPES, libelle: `Les ${ETAPES.length} étapes de la mise en route` },
              { id: ID_ENSUITE, libelle: "Ce qui se passe une fois en ligne" },
              { id: ID_PREREQUIS, libelle: "Ce qu'il vous faut avant de commencer" },
            ]}
          />
        </div>

        {/* --- Les étapes ------------------------------------------------------ */}
        <SectionGuide
          id={ID_ETAPES}
          titre={`Les ${ETAPES.length} étapes de la mise en route`}
          intro="Dans l'ordre où la plateforme les impose. Tout se fait depuis le tableau de bord et votre téléphone."
        >
          {/* Frise verticale : le rail passe par le centre des pastilles, qu'il
              traverse sans se voir grâce à leur bordure couleur fond. Les deux
              tailles de pastille ont donc leur position de rail : 1,125 rem au
              centre d'une pastille de 2,25 rem sur téléphone, 1,375 rem au
              centre d'une pastille de 2,75 rem au-delà. Sur petit écran, la
              colonne de gauche est ainsi rendue au texte.

              La révélation ne porte que sur la carte : les pastilles et le rail
              restent en place, sinon la frise se dessinerait par morceaux. */}
          <ol className="relative space-y-4">
            <span
              aria-hidden="true"
              className="absolute bottom-6 left-[1.125rem] top-6 w-px bg-line md:left-[1.375rem]"
            />
            {ETAPES.map((e, i) => {
              const Icone = ICONES_ETAPE[i] ?? MessageCircle;
              return (
                <li key={e.nom} className="relative flex gap-3 md:gap-5">
                  <span
                    aria-hidden="true"
                    className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-cream bg-brand font-display text-sm font-bold text-white md:h-11 md:w-11"
                  >
                    {i + 1}
                  </span>
                  <Reveal delai={i * 60} className="min-w-0 flex-1">
                    <div className="card h-full transition duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Icone className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
                        </span>
                        <h3 className="font-display text-lg font-bold leading-snug">{e.nom}</h3>
                      </div>
                      <p className="mt-3.5 leading-relaxed text-muted">{e.texte}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </SectionGuide>

        {/* --- Une fois en ligne ----------------------------------------------- */}
        <SectionGuide
          id={ID_ENSUITE}
          fond="teinte"
          titre="Ce qui se passe une fois en ligne"
          intro="Le trajet d'un message, et les deux moments où vous reprenez la main."
        >
          <Reveal>
            <ParcoursMessage />
          </Reveal>

          <Reveal delai={80}>
            <div className="mt-10 divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft">
              {UNE_FOIS_EN_LIGNE.map(({ Icone, titre, texte }) => (
                <div key={titre} className="flex gap-4 p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icone className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold leading-snug">{titre}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </SectionGuide>

        {/* --- Prérequis -------------------------------------------------------- */}
        <SectionGuide
          id={ID_PREREQUIS}
          titre="Ce qu'il vous faut avant de commencer"
          intro="Quatre choses, dont trois que vous avez déjà."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {PREREQUIS.map(({ titre, texte }, i) => (
              <Reveal key={titre} delai={i * 60} className="h-full">
                <div className="card h-full">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-soft text-emerald-dark">
                    <Check className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.5} />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold leading-snug">{titre}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{texte}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* La limite de l'outil, dite avant l'inscription plutôt qu'après :
              une note, pas une carte, pour qu'elle ne se lise pas comme un
              cinquième prérequis. */}
          <Reveal delai={240}>
            <div className="mt-6">
              <Note>
                L&apos;assistant ne répond qu&apos;en français, et il n&apos;envoie ni campagne ni
                message en nombre : il répond à ce qu&apos;on lui écrit. Si votre besoin est
                d&apos;émettre vers une liste de contacts, ce n&apos;est pas le bon outil.
              </Note>
            </div>
          </Reveal>
        </SectionGuide>

        {/* --- Appel à l'action -------------------------------------------------- */}
        <BlocFinal
          badge={
            <>
              <Clock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              {JOURS_ESSAI} jours d&apos;essai, sans carte bancaire
            </>
          }
          titre="Le plus long, c'est de relire la fiche"
          texte={
            <>
              Le reste tient en un QR code scanné. Ensuite, {JOURS_ESSAI} jours d&apos;essai gratuit
              sur vos vraies conversations, sans changer de numéro.
            </>
          }
        >
          <Link href="/signup" className="btn text-base">
            Créer mon assistant
          </Link>
          <Link href="/tarifs" className={LIEN_SECONDAIRE_SOMBRE}>
            Voir les tarifs
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
