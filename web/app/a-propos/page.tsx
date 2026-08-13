import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Minus, Scale, ScrollText, Code2, type LucideIcon } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import Note from "@/components/gabarit/Note";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire from "@/components/seo/Sommaire";
import BlocPreuve from "@/components/seo/BlocPreuve";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur, { AUTEUR } from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import Figure from "@/components/seo/Figure";
import { SILOS_DU_SITE } from "@/content/illustrations";
import { liensSortants } from "@/lib/maillage";
import { IMAGE_OG_PAR_DEFAUT } from "@/lib/og";
import { breadcrumbLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

const URL_PAGE = `${SITE_URL}/a-propos`;
const TITRE = "À propos de Wapy : qui édite ce site et comment il est écrit";
// 155 caractères maximum : au-delà, Google tronque et choisit lui-même où.
const DESCRIPTION =
  "Qui édite Wapy, sur quoi repose ce qu'on y affirme, comment les chiffres publiés sont mesurés, et ce que l'assistant WhatsApp ne fait pas.";

/** Identifiants d'ancrage posés par les sections, repris tels quels par le sommaire. */
const ID_PROJET = "projet";
const ID_METHODE = "methode";
const ID_SOURCES = "sources";
const ID_LIMITES = "limites";

/*
  Scène illustrée servie par Cloudinary, comme celles de l'accueil : voir le
  commentaire de `app/page.tsx`. C'est la même image que la bande « Conçu au
  plus près du terrain » de l'accueil, et c'est voulu : la page qui dit qui
  édite le site montre la même scène que celle qui l'annonce.
*/
const SCENE_TERRAIN =
  "https://res.cloudinary.com/ocenevpc/image/upload/wapy/scenes/terrain-assistant.webp";

/*
  Les deux chiffres de ce site qui portent sur notre propre plateforme, et la
  façon dont ils se remesurent. `content/sources.ts` fait pointer la source
  « wapy-plateforme » vers cette page : `tests/entite.test.ts` vérifie que les
  deux méthodes y sont bien publiées, en cherchant « content/secteurs.ts » et
  « pytest » dans le texte rendu.
*/
const METHODES: { titre: string; texte: string }[] = [
  {
    titre: "Nombre de guides sectoriels",
    texte:
      "C'est le nombre d'entrées marquées comme publiées dans le fichier de contenu qui décrit les secteurs, content/secteurs.ts, et donc le nombre exact de pages « guide métier » servies par ce site. La mesure se refait en comptant les entrées de ce fichier, ou simplement en dénombrant les guides listés sur la page des secteurs.",
  },
  {
    titre: "Nombre de tests automatisés du backend",
    texte:
      "C'est le nombre de tests que la suite du serveur collecte et exécute, relevé en lançant pytest sur le dossier de tests du dépôt. Ce chiffre dit combien de comportements sont vérifiés, pas que le logiciel est sans défaut. Il bouge à chaque test ajouté, et la valeur publiée porte sa date de relevé.",
  },
];

/*
  Les trois règles d'écriture du site, dans l'ordre de contrainte croissante.
  Ce sont les trois paragraphes de l'ancienne section, découpés : chacune tient
  seule, et la troisième est celle qui a le plus modifié ces pages.
*/
const REGLES: { Icone: LucideIcon; titre: string; texte: string }[] = [
  {
    Icone: ScrollText,
    titre: "Un chiffre porte sa source et sa date",
    texte:
      "Les populations viennent des instituts nationaux de statistique, les plans de numérotation des régulateurs ou de l'Union internationale des télécommunications. La date de consultation est publiée avec le chiffre.",
  },
  {
    Icone: Scale,
    titre: "Un concurrent est relevé chez lui",
    texte:
      "Une caractéristique attribuée à un outil concurrent est relevée sur le site de son éditeur, à une date indiquée, et rien n'est complété de mémoire ni déduit d'un positionnement. Nos comparatifs exposent aussi les points sur lesquels ces outils font mieux que nous, parce qu'un classement où l'auteur se met premier cesse d'être lu.",
  },
  {
    Icone: Code2,
    titre: "Une affirmation correspond au code",
    texte:
      "Toute affirmation sur ce que fait Wapy doit correspondre au code du produit. C'est la règle la plus contraignante, et celle qui a le plus modifié ces pages : plusieurs formulations flatteuses ont été retirées parce que le logiciel ne les tenait pas.",
  },
];

/* Ce que le produit ne fait pas. Liste reprise telle quelle : chaque ligne est
   une limite constatée dans le code, pas une précaution de langage. */
const LIMITES = [
  "Il ne répond qu'en français, y compris à un message écrit dans une autre langue.",
  "Il ne passe pas par l'interface professionnelle officielle de Meta : ni campagne, ni diffusion, ni envoi en nombre.",
  "Il n'encaisse pas les paiements de vos clients. Il peut indiquer le moyen de paiement de votre fiche et noter qu'un justificatif reste à vérifier.",
  "Il ne sait rien que votre fiche ne contienne. Une information absente ne s'invente pas : il dit qu'il se renseigne.",
  "Ses consignes de rédaction sont des instructions données à un modèle de langage, pas un verrou : elles orientent ses réponses, elles ne les décident pas caractère par caractère.",
  "Il ne remplace pas un humain sur une réclamation, un litige ou un sujet sensible : dans ces cas, il vous passe la main.",
];

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  keywords: ["à propos Wapy", "éditeur Wapy", "assistant WhatsApp Afrique francophone"],
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

export default function PageAPropos() {
  const liens = liensSortants("/a-propos");

  return (
    <div className="min-h-screen bg-cream">
      {/*
        Pas de second `organizationLd()` ici : le layout en émet un sur toutes
        les pages, avec le même @id. Le répéter sur celle-ci produirait deux
        nœuds identiques dans le même document, sans rien consolider de plus.
      */}
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "À propos", url: URL_PAGE },
        ])}
      />

      <SiteHeader lienSecondaire={{ href: "/faq", libelle: "Questions fréquentes" }} />

      <main>
        <HeroGuide
          visuel={
            <figure className="overflow-hidden rounded-xl2 border border-line bg-gradient-to-b from-brand-soft/50 to-surface shadow-lift">
              <Image
                src={SCENE_TERRAIN}
                alt="Un commerçant, téléphone en main, entouré des services que l'assistant relie : messagerie, agenda, sécurité des données et passage à un humain."
                width={1200}
                height={900}
                priority
                sizes="(min-width: 768px) 520px, 100vw"
                className="w-full"
              />
              <figcaption className="border-t border-line/70 bg-surface px-5 py-3.5 text-sm text-muted">
                Un produit fait pour les entreprises qui reçoivent leurs demandes sur WhatsApp,
                et rien d&apos;autre.
              </figcaption>
            </figure>
          }
        >
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <span className="text-ink/70">À propos</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">L&apos;éditeur et sa méthode</span>

          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.9rem]">
            À propos de <span className="text-brand">Wapy</span>
          </h1>

          <EnBref>
            Wapy est un assistant qui répond aux messages reçus sur le compte WhatsApp d&apos;une
            entreprise, à partir d&apos;une fiche qu&apos;elle remplit. Cette page dit qui
            l&apos;édite, comment les chiffres de ce site sont mesurés, et ce que le produit ne
            fait pas.
          </EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn text-base">
              Créer mon assistant
            </Link>
            <a href={`#${ID_LIMITES}`} className="btn-ghost text-base">
              Ce que Wapy ne fait pas
            </a>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              { id: ID_PROJET, libelle: "Le projet et qui l'édite" },
              { id: ID_METHODE, libelle: "Comment nos chiffres sont mesurés" },
              { id: ID_SOURCES, libelle: "Comment ces pages sont écrites" },
              { id: ID_LIMITES, libelle: "Ce que Wapy ne fait pas" },
            ]}
          />
        </div>

        <SectionGuide
          id={ID_PROJET}
          titre="Le projet et qui l'édite"
          intro="Une équipe, un canal, et aucune identité inventée pour faire sérieux."
        >
          <Reveal>
            <div className="card">
              <p className="leading-relaxed text-muted">
                Wapy est un logiciel destiné aux entreprises d&apos;Afrique francophone qui
                reçoivent leurs demandes sur WhatsApp : un client écrit, l&apos;assistant répond
                avec les informations de l&apos;établissement, mène la demande jusqu&apos;à son
                enregistrement et prévient le responsable. Le site et le produit sont édités par la
                même équipe, signée « {AUTEUR.nom} » au bas de chaque page.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Aucun nom de personne n&apos;est publié ici, aucune date de fondation, aucun
                effectif. Ce serait facile à écrire et impossible à vérifier depuis
                l&apos;extérieur : ce serait donc la première entorse à la règle qui gouverne ces
                pages. Pour la même raison, ce site ne publie aucune parole de client rapportée,
                aucun nombre d&apos;utilisateurs et aucun résultat obtenu par un établissement.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Ce sur quoi repose le produit est étroit et se vérifie à l&apos;usage : la
                connaissance du canal WhatsApp et des contraintes locales. Les plans de numérotation
                de la région en sont l&apos;exemple le plus concret, à commencer par le passage des
                numéros béninois de huit à dix chiffres, qui rend caduque une bonne partie des
                carnets d&apos;adresses.
              </p>
            </div>
          </Reveal>
          <Reveal delai={80}>
            <BlocPreuve id="formats-numeros" />
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_METHODE}
          fond="teinte"
          titre="Comment nos chiffres sont mesurés"
          intro="Deux chiffres portant sur notre propre plateforme sont cités ailleurs sur ce site, et leur source renvoie ici. Ils ne viennent d'aucune étude : ce sont des relevés faits sur le dépôt du logiciel."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {METHODES.map((m, i) => (
              <Reveal key={m.titre} delai={i * 80} className="h-full">
                <div className="card h-full">
                  <dt className="font-display text-base font-bold leading-snug">{m.titre}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{m.texte}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
          <Reveal delai={160}>
            <div className="mt-6">
              <Note>
                Quand une de ces mesures cesse de donner le même résultat, c&apos;est le chiffre
                publié qu&apos;il faut corriger, pas la méthode.
              </Note>
            </div>
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_SOURCES}
          titre="Comment ces pages sont écrites"
          intro="Trois règles, et elles tiennent lieu de ligne éditoriale."
        >
          <ol className="grid gap-3 md:grid-cols-3">
            {REGLES.map(({ Icone, titre, texte }, i) => (
              <Reveal key={titre} delai={i * 80} className="h-full">
                <li className="card h-full">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-display text-2xl font-bold text-line"
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold leading-snug">{titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{texte}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal delai={240}>
            <Figure illustration={SILOS_DU_SITE} />
          </Reveal>
        </SectionGuide>

        <SectionGuide
          id={ID_LIMITES}
          fond="teinte"
          titre="Ce que Wapy ne fait pas"
          intro="Aussi utile que la liste précédente : un outil qui ne dit pas ce qu'il ne fait pas se fait juger dessus après la signature."
        >
          <Reveal>
            <ul className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft">
              {LIMITES.map((t) => (
                <li key={t} className="flex items-start gap-3 p-5">
                  {/* Un moins dans un rond neutre : ce sont des absences, pas
                      des erreurs. Une croix rouge ferait lire la liste comme un
                      constat d'échec. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-muted"
                  >
                    <Minus className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span className="leading-relaxed text-muted">{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre="Jugez sur vos conversations"
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
          <Link href="/faq" className={LIEN_SECONDAIRE_SOMBRE}>
            Lire les questions fréquentes
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
