import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

/*
  Conditions du pont, distinctes de celles de l'assistant : le service, les
  obligations et les motifs de suspension n'ont rien à voir. La version affichée
  ici DOIT rester alignée sur `CONDITIONS_VERSION` de `saas/pont.py` — changer le
  texte sans changer la version laisserait croire que d'anciens comptes ont
  accepté des règles qu'ils n'ont jamais lues.
*/
// Non exporté : une page App Router ne peut exporter que des noms réservés
// (`metadata`, `default`, `generateStaticParams`…), et tout autre export fait
// échouer le build.
const VERSION = "2026-08-24";

const TITRE = "Conditions d'utilisation du pont développeurs";
const DESCRIPTION =
  "Ce que le pont WhatsApp de Wapy autorise, ce qu'il interdit, et ce qui fait suspendre un compte développeur.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/developpeurs/conditions` },
  robots: { index: true, follow: true },
};

function Article({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold">{titre}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function ConditionsPont() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader lienSecondaire={{ href: "/developpeurs", libelle: "Développeurs" }} />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-[1.9rem] font-bold leading-tight md:text-[2.4rem]">
          {TITRE}
        </h1>
        <p className="mt-3 text-sm text-muted">Version {VERSION}</p>

        <Article titre="1. Ce que le pont est">
          <p>
            Le pont vous permet d&apos;émettre des messages WhatsApp depuis un numéro que vous
            connectez vous-même, par un appel HTTP depuis votre application. Il est destiné aux
            messages <strong>transactionnels</strong> : confirmation de paiement, d&apos;inscription
            ou de commande, code de vérification à usage unique.
          </p>
          <p>
            Le pont n&apos;est pas l&apos;assistant Wapy. Il ne lit pas les conversations, ne répond
            à personne et ne comporte aucune intelligence artificielle. Nous ne sommes qu&apos;un
            pont entre votre application et votre numéro.
          </p>
        </Article>

        <Article titre="2. Ce que vous vous engagez à ne pas envoyer">
          <p>
            Aucune prospection, aucune promotion, aucune diffusion à une liste. Aucun message à
            quelqu&apos;un qui ne vous a pas donné son accord pour être contacté. Aucun contenu
            illicite, trompeur, ou usurpant l&apos;identité d&apos;un tiers.
          </p>
          <p>
            Chaque envoi exige une référence de consentement. Nous ne pouvons pas la vérifier :
            elle engage votre responsabilité, pas la nôtre.
          </p>
        </Article>

        <Article titre="3. Le risque que vous acceptez">
          <p>
            WhatsApp peut restreindre ou bannir un numéro qui émet des messages non sollicités,
            <strong> y compris le vôtre</strong>. Ce risque ne dépend pas seulement de nous : il
            dépend de ce que vous envoyez et de la réaction de vos destinataires.
          </p>
          <p>
            Utilisez un numéro dédié aux notifications, distinct de votre ligne principale. Nous
            fournissons le pont ; nous ne pouvons garantir ni la disponibilité de WhatsApp, ni la
            conservation de votre numéro.
          </p>
        </Article>

        <Article titre="4. Les limites appliquées">
          <p>
            Un intervalle minimal sépare deux envois : les rafales sont refusées. Un plafond horaire
            et journalier s&apos;applique à chaque compte. Les codes de vérification sont limités à
            deux par heure et par destinataire.
          </p>
          <p>
            L&apos;en-tête <code className="font-mono text-ink">Idempotency-Key</code> est
            obligatoire sur chaque envoi : rejouer une requête ne produit jamais un second message.
            Un destinataire ayant répondu « STOP » cesse définitivement d&apos;être joignable depuis
            votre compte.
          </p>
        </Article>

        <Article titre="5. Ce que nous conservons">
          <p>
            <strong>Aucun contenu de message n&apos;est enregistré</strong> : ni le texte, ni les
            codes de vérification. Les numéros de vos destinataires ne sont jamais stockés en clair,
            mais sous forme d&apos;empreinte irréversible, qui sert uniquement à appliquer les
            limites.
          </p>
          <p>
            Nous conservons des métadonnées d&apos;envoi — date, genre, taille, issue — pendant
            quatre-vingt-dix jours, puis elles sont effacées. Votre clé d&apos;API n&apos;est
            stockée que sous forme d&apos;empreinte : nous ne pouvons pas vous la rappeler, seulement
            la remplacer.
          </p>
        </Article>

        <Article titre="6. Validation, suspension">
          <p>
            L&apos;inscription est libre, l&apos;émission ne l&apos;est pas : un compte doit être
            validé par nos soins avant d&apos;émettre. Nous pouvons refuser ou suspendre un compte
            sans préavis, notamment en cas d&apos;envoi non sollicité, de contournement des limites
            ou de plainte d&apos;un destinataire.
          </p>
          <p>
            Le service est gratuit et fourni sans garantie de disponibilité. Nous pouvons le
            modifier ou l&apos;interrompre, et vous préviendrons par courrier électronique en cas
            d&apos;arrêt.
          </p>
        </Article>

        <Article titre="7. Protection des données">
          <p>
            Vous restez responsable du traitement des données de vos destinataires. Nous agissons
            comme sous-traitant technique pour la seule transmission des messages. Vous devez
            informer vos utilisateurs de ce traitement et recueillir leur accord.
          </p>
        </Article>

        <p className="mt-10 text-sm text-muted">
          Une question sur ces conditions&nbsp;?{" "}
          <Link href="/developpeurs" className="text-brand underline">
            Revenir à l&apos;espace développeurs
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
