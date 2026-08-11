import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">À propos</span>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          À propos de Wapy
        </h1>

        <EnBref>
          Wapy est un assistant qui répond aux messages reçus sur le compte WhatsApp d&apos;une
          entreprise, à partir d&apos;une fiche qu&apos;elle remplit. Cette page dit qui l&apos;édite,
          comment les chiffres de ce site sont mesurés, et ce que le produit ne fait pas.
        </EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            { id: ID_PROJET, libelle: "Le projet et qui l'édite" },
            { id: ID_METHODE, libelle: "Comment nos chiffres sont mesurés" },
            { id: ID_SOURCES, libelle: "Comment ces pages sont écrites" },
            { id: ID_LIMITES, libelle: "Ce que Wapy ne fait pas" },
          ]}
        />

        <section id={ID_PROJET} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Le projet et qui l&apos;édite</h2>
          <p className="mt-4 text-muted">
            Wapy est un logiciel destiné aux entreprises d&apos;Afrique francophone qui reçoivent
            leurs demandes sur WhatsApp : un client écrit, l&apos;assistant répond avec les
            informations de l&apos;établissement, mène la demande jusqu&apos;à son enregistrement
            et prévient le responsable. Le site et le produit sont édités par la même équipe,
            signée « {AUTEUR.nom} » au bas de chaque page.
          </p>
          <p className="mt-4 text-muted">
            Aucun nom de personne n&apos;est publié ici, aucune date de fondation, aucun effectif.
            Ce serait facile à écrire et impossible à vérifier depuis l&apos;extérieur : ce serait
            donc la première entorse à la règle qui gouverne ces pages. Pour la même raison, ce
            site ne publie aucune parole de client rapportée, aucun nombre d&apos;utilisateurs et
            aucun résultat obtenu par un établissement.
          </p>
          <p className="mt-4 text-muted">
            Ce sur quoi repose le produit est étroit et se vérifie à l&apos;usage : la
            connaissance du canal WhatsApp et des contraintes locales. Les plans de numérotation
            de la région en sont l&apos;exemple le plus concret, à commencer par le passage des
            numéros béninois de huit à dix chiffres, qui rend caduque une bonne partie des
            carnets d&apos;adresses.
          </p>
          <BlocPreuve id="formats-numeros" />
        </section>

        <section id={ID_METHODE} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Comment nos chiffres sont mesurés</h2>
          <p className="mt-4 text-muted">
            Deux chiffres portant sur notre propre plateforme sont cités ailleurs sur ce site, et
            leur source renvoie ici. Ils ne viennent d&apos;aucune étude : ce sont des relevés
            faits sur le dépôt du logiciel, que voici, pour que le lecteur puisse juger de ce
            qu&apos;ils valent.
          </p>
          <dl className="mt-6 space-y-6">
            <div className="border-l-2 border-line pl-4">
              <dt className="font-semibold text-ink">Nombre de guides sectoriels</dt>
              <dd className="mt-1.5 text-muted">
                C&apos;est le nombre d&apos;entrées marquées comme publiées dans le fichier de
                contenu qui décrit les secteurs, content/secteurs.ts, et donc le nombre exact de
                pages « guide métier » servies par ce site. La mesure se refait en comptant les
                entrées de ce fichier, ou simplement en dénombrant les guides listés sur la page
                des secteurs.
              </dd>
            </div>
            <div className="border-l-2 border-line pl-4">
              <dt className="font-semibold text-ink">Nombre de tests automatisés du backend</dt>
              <dd className="mt-1.5 text-muted">
                C&apos;est le nombre de tests que la suite du serveur collecte et exécute, relevé
                en lançant pytest sur le dossier de tests du dépôt. Ce chiffre dit combien de
                comportements sont vérifiés, pas que le logiciel est sans défaut. Il bouge à
                chaque test ajouté, et la valeur publiée porte sa date de relevé.
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-muted">
            Quand une de ces mesures cesse de donner le même résultat, c&apos;est le chiffre
            publié qu&apos;il faut corriger, pas la méthode.
          </p>
        </section>

        <section id={ID_SOURCES} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Comment ces pages sont écrites</h2>
          <p className="mt-4 text-muted">
            Trois règles, et elles tiennent lieu de ligne éditoriale. Un chiffre publié porte sa
            source et sa date de consultation : les populations viennent des instituts nationaux
            de statistique, les plans de numérotation des régulateurs ou de l&apos;Union
            internationale des télécommunications.
          </p>
          <p className="mt-4 text-muted">
            Ensuite, une caractéristique attribuée à un outil concurrent est relevée sur le site
            de son éditeur, à une date indiquée, et rien n&apos;est complété de mémoire ni déduit
            d&apos;un positionnement. Nos comparatifs exposent aussi les points sur lesquels ces
            outils font mieux que nous, parce qu&apos;un classement où l&apos;auteur se met
            premier cesse d&apos;être lu.
          </p>
          <p className="mt-4 text-muted">
            Enfin, toute affirmation sur ce que fait Wapy doit correspondre au code du produit.
            C&apos;est la règle la plus contraignante, et celle qui a le plus modifié ces pages :
            plusieurs formulations flatteuses ont été retirées parce que le logiciel ne les tenait
            pas.
          </p>
          <Figure illustration={SILOS_DU_SITE} />
        </section>

        <section id={ID_LIMITES} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ce que Wapy ne fait pas</h2>
          <ul className="mt-5 space-y-2">
            {[
              "Il ne répond qu'en français, y compris à un message écrit dans une autre langue.",
              "Il ne passe pas par l'interface professionnelle officielle de Meta : ni campagne, ni diffusion, ni envoi en nombre.",
              "Il n'encaisse pas les paiements de vos clients. Il peut indiquer le moyen de paiement de votre fiche et noter qu'un justificatif reste à vérifier.",
              "Il ne sait rien que votre fiche ne contienne. Une information absente ne s'invente pas : il dit qu'il se renseigne.",
              "Ses consignes de rédaction sont des instructions données à un modèle de langage, pas un verrou : elles orientent ses réponses, elles ne les décident pas caractère par caractère.",
              "Il ne remplace pas un humain sur une réclamation, un litige ou un sujet sensible : dans ces cas, il vous passe la main.",
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
            Cette liste est aussi utile que la précédente. Un outil qui ne dit pas ce qu&apos;il
            ne fait pas se fait juger dessus après la signature.
          </p>
        </section>

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Jugez sur vos conversations</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez déjà
            en scannant un QR code, sans changer de numéro.
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
