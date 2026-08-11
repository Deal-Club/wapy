import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/seo/JsonLd";
import EnBref from "@/components/seo/EnBref";
import Sommaire, { ENTREE_FAQ } from "@/components/seo/Sommaire";
import FAQ from "@/components/seo/FAQ";
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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted"
          aria-label="Fil d'Ariane"
        >
          <Link href="/" className="hover:text-ink">
            Accueil
          </Link>
          <span aria-hidden="true">›</span>
          <Link href="/comparatif" className="hover:text-ink">
            Comparatifs
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-ink/70">{c.ancre}</span>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
          {c.titre}
        </h1>

        <EnBref>{c.enBref}</EnBref>
        <Dates publieLe={PUBLIE_LE} modifieLe={MODIFIE_LE} />

        <Sommaire
          entrees={[
            ...c.sections.map((s) => ({ id: s.id, libelle: s.titre })),
            { id: ID_TABLEAU, libelle: "Le comparatif en tableau" },
            ENTREE_FAQ,
          ]}
        />

        {c.sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold">{s.titre}</h2>
            {s.paragraphes.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section id={ID_TABLEAU} className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Le comparatif en tableau</h2>
          <TableauComparatif
            colonnes={c.tableau.colonnes}
            lignes={c.tableau.lignes}
            legende={c.tableau.legende}
          />
        </section>

        <FAQ items={c.faq} />

        <div className="mt-12 rounded-xl2 bg-ink px-6 py-10 text-center text-cream">
          <h2 className="font-display text-2xl font-bold">Comparez sur vos vraies conversations</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/70">
            Sept jours d&apos;essai gratuit. Vous liez le compte WhatsApp que vous utilisez déjà en
            scannant un QR code, sans changer de numéro.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/signup" className="btn">
              Essayer Wapy
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
