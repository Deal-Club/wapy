import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import BandeReperes from "@/components/gabarit/BandeReperes";
import BlocFinal, { LIEN_SECONDAIRE_SOMBRE } from "@/components/gabarit/BlocFinal";
import FilAriane from "@/components/gabarit/FilAriane";
import HeroGuide from "@/components/gabarit/HeroGuide";
import SectionGuide from "@/components/gabarit/SectionGuide";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire, { ENTREE_FAQ } from "@/components/seo/Sommaire";
import FAQ, { ID_FAQ } from "@/components/seo/FAQ";
import TableauComparatif from "@/components/seo/TableauComparatif";
import PagesLiees from "@/components/seo/PagesLiees";
import Auteur, { AUTEUR } from "@/components/seo/Auteur";
import Dates from "@/components/seo/Dates";
import { getComparatif, COMPARATIFS_PUBLIES } from "@/content/comparatifs";
import { liensSortants } from "@/lib/maillage";
import { articleLd, faqLd, breadcrumbLd, itemListLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { resume } from "@/lib/texte";

const PUBLIE_LE = "2026-08-11";
const MODIFIE_LE = "2026-08-11";

/** Identifiants d'ancrage posés par la page, repris tels quels par le sommaire. */
const ID_TABLEAU = "tableau";

/**
 * Seule page du silo à porter un classement d'outils : c'est la seule qui
 * publie un `ItemList`. L'émettre ailleurs annoncerait une liste ordonnée
 * d'entités là où le tableau compare des critères.
 */
const SLUG_CLASSEMENT = "meilleur-chatbot-whatsapp-afrique-2026";

export function generateStaticParams() {
  return COMPARATIFS_PUBLIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getComparatif(params.slug);
  if (!c || !c.publie) return {};
  const url = `${SITE_URL}/comparatif/${c.slug}`;
  const description = resume(c.enBref);
  return {
    title: `${c.titre} · Wapy`,
    description,
    keywords: [c.ancre, "comparatif chatbot WhatsApp", "assistant WhatsApp Afrique"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Wapy",
      locale: "fr_FR",
      title: c.titre,
      description,
      publishedTime: PUBLIE_LE,
      modifiedTime: MODIFIE_LE,
    },
    twitter: { card: "summary_large_image", title: c.titre, description },
    robots: { index: true, follow: true },
  };
}

export default function PageComparatif({ params }: { params: { slug: string } }) {
  const c = getComparatif(params.slug);
  if (!c || !c.publie) notFound();

  const url = `${SITE_URL}/comparatif/${c.slug}`;
  const liens = liensSortants(`/comparatif/${c.slug}`);
  const estClassement = c.slug === SLUG_CLASSEMENT;

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={articleLd({
          titre: c.titre,
          description: c.enBref,
          url,
          publieLe: PUBLIE_LE,
          modifieLe: MODIFIE_LE,
          auteur: AUTEUR.nom,
          section: "Comparatif",
        })}
      />
      <JsonLd data={faqLd(c.faq)} />
      <JsonLd
        data={breadcrumbLd([
          { nom: "Accueil", url: SITE_URL },
          { nom: "Comparatifs", url: `${SITE_URL}/comparatif` },
          { nom: c.ancre, url },
        ])}
      />
      {estClassement && (
        <JsonLd data={itemListLd(c.tableau.lignes.map((l) => ({ nom: l.outil ?? "", url })))} />
      )}

      <SiteHeader lienSecondaire={{ href: "/comparatif", libelle: "Comparatifs" }} />

      <main>
        <HeroGuide>
          <FilAriane>
            <Link href="/" className="transition hover:text-brand">
              Accueil
            </Link>
            <Link href="/comparatif" className="transition hover:text-brand">
              Comparatifs
            </Link>
            <span className="text-ink/70">{c.ancre}</span>
          </FilAriane>

          <span className="pill mt-5 bg-brand-soft text-brand">Comparatif</span>

          {/* Le titre est rendu d'un seul tenant : `tests/pages.test.ts` le
              cherche tel quel dans le texte de la page, et une mise en couleur
              par morceaux le couperait en deux chaînes. */}
          <h1 className="mt-4 font-display text-[2.1rem] font-bold leading-[1.1] md:text-[2.8rem]">
            {c.titre}
          </h1>

          <EnBref>{c.enBref}</EnBref>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={`#${ID_TABLEAU}`} className="btn text-base">
              Voir le tableau
            </a>
            <Link href="/signup" className="btn-ghost text-base">
              Essayer Wapy
            </Link>
          </div>

          <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />
        </HeroGuide>

        {/*
          Repères vrais pour TOUS les comparatifs. Rien n'est déduit de la forme
          du tableau : selon la page, une ligne est un critère (comparaison à
          deux outils) ou un outil (page de classement). Compter « les outils »
          sur les lignes donnerait donc un chiffre faux une page sur deux.
        */}
        <BandeReperes
          reperes={[
            ["Relevé daté", "Chaque tableau porte sa date"],
            [`${c.faq.length} réponses`, "Aux questions qui décident"],
            ["Nos limites", "Écrites noir sur blanc"],
          ]}
        />

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <Sommaire
            variante="barre"
            entrees={[
              ...c.sections.map((s) => ({ id: s.id, libelle: s.titre })),
              { id: ID_TABLEAU, libelle: "Le comparatif en tableau" },
              ENTREE_FAQ,
            ]}
          />
        </div>

        {/* Une bande sur deux est teintée : sur un comparatif, le nombre de
            sections vient du contenu, et sans alternance la page redevient une
            colonne de texte de trois mètres. */}
        {c.sections.map((s, i) => (
          <SectionGuide key={s.id} id={s.id} titre={s.titre} fond={i % 2 === 1 ? "teinte" : "clair"}>
            <Reveal>
              <div className="card">
                {s.paragraphes.map((p, j) => (
                  <p key={p.slice(0, 40)} className={`leading-relaxed text-muted ${j ? "mt-4" : ""}`}>
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          </SectionGuide>
        ))}

        <SectionGuide
          id={ID_TABLEAU}
          disposition="pleine"
          titre="Le comparatif en tableau"
          intro="Les mêmes critères pour tous les outils, relevés chez leurs éditeurs à la date indiquée sous le tableau."
          fond={c.sections.length % 2 === 1 ? "teinte" : "clair"}
        >
          <TableauComparatif
            colonnes={c.tableau.colonnes}
            lignes={c.tableau.lignes}
            legende={c.tableau.legende}
          />
        </SectionGuide>

        <SectionGuide id={ID_FAQ} disposition="pleine" titre="Questions fréquentes">
          <Reveal>
            <FAQ items={c.faq} titre={null} colonnes={2} id={`${ID_FAQ}-liste`} />
          </Reveal>
        </SectionGuide>

        <BlocFinal
          titre="Comparez sur vos vraies conversations"
          texte={
            <>
              Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez déjà
              en scannant un QR code, sans changer de numéro.
            </>
          }
        >
          <Link href="/signup" className="btn text-base">
            Essayer Wapy
          </Link>
          <Link href="/comparatif" className={LIEN_SECONDAIRE_SOMBRE}>
            Voir les autres comparatifs
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
