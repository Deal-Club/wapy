import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const CONTACT = "contact@wapy.pro";

export const metadata: Metadata = {
  title: "Conditions d'utilisation · Wapy",
  description:
    "Les conditions d'utilisation du service Wapy : abonnement, usage acceptable, responsabilités et résiliation.",
  alternates: { canonical: `${SITE_URL}/conditions` },
  robots: { index: true, follow: true },
};

export default function Conditions() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Conditions d'utilisation</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : 11 août 2026</p>

        <article className="article mt-8">
          <p>
            En créant un compte et en utilisant Wapy, vous acceptez les présentes conditions. Wapy est un service
            qui répond automatiquement, sur WhatsApp, aux clients d'un établissement, à partir des informations que
            celui-ci fournit.
          </p>

          <h2>1. Le service</h2>
          <p>
            Wapy fournit un assistant connecté au WhatsApp de votre entreprise. Il répond aux questions courantes,
            enregistre des demandes (réservations, commandes, rendez-vous) et vous passe la main quand un humain est
            nécessaire. Le service évolue : des fonctions peuvent être ajoutées, modifiées ou retirées.
          </p>

          <h2>2. Votre compte</h2>
          <ul>
            <li>Vous fournissez des informations exactes et les tenez à jour.</li>
            <li>Vous êtes responsable de la confidentialité de votre mot de passe et de l'activité sur votre compte.</li>
            <li>Un compte est réservé à l'établissement qui le crée.</li>
          </ul>

          <h2>3. Essai, abonnement et facturation</h2>
          <ul>
            <li>Un essai gratuit de sept jours est proposé à l'inscription, sans moyen de paiement requis.</li>
            <li>À l'issue de l'essai, l'accès nécessite un abonnement mensuel, facturé en francs CFA, selon le plan choisi.</li>
            <li>Les paiements sont traités par notre prestataire de paiement. Le défaut de paiement suspend l'accès au service.</li>
            <li>Vous pouvez arrêter votre abonnement à tout moment ; il prend fin à l'échéance de la période en cours.</li>
          </ul>

          <h2>4. Usage acceptable et respect de WhatsApp</h2>
          <p>
            Vous vous engagez à utiliser Wapy dans le respect de la loi et des conditions d'utilisation de WhatsApp
            et de Meta. En particulier :
          </p>
          <ul>
            <li>Vous ne devez pas envoyer de messages non sollicités en masse ni faire de la prospection à froid interdite par WhatsApp.</li>
            <li>Vous répondez aux personnes qui vous contactent et respectez leur volonté de ne plus être contactées.</li>
            <li>Vous êtes responsable des informations que vous configurez et des messages envoyés depuis votre numéro.</li>
          </ul>
          <p>
            Wapy peut suspendre un compte qui enfreint ces règles ou met en danger la stabilité du service. Le
            blocage d'un numéro WhatsApp par Meta relève de vos échanges avec Meta et de votre usage ; il ne peut
            être imputé à Wapy.
          </p>

          <h2>5. Contenu et exactitude</h2>
          <p>
            L'assistant répond à partir des informations que vous fournissez. Vous êtes responsable de leur
            exactitude (prix, horaires, disponibilités). Wapy s'efforce de ne pas inventer d'information absente de
            votre fiche, mais ne garantit pas l'absence totale d'erreur.
          </p>

          <h2>6. Disponibilité</h2>
          <p>
            Nous mettons tout en œuvre pour assurer un service continu, sans pouvoir garantir une disponibilité de
            100 %. Des interruptions peuvent survenir (maintenance, incident, dépendance à des tiers comme WhatsApp
            ou les fournisseurs d'IA et de paiement).
          </p>

          <h2>7. Limitation de responsabilité</h2>
          <p>
            Wapy est fourni « en l'état ». Dans les limites permises par la loi, Wapy ne saurait être tenu
            responsable des pertes indirectes (perte de chiffre d'affaires, de clientèle, de données) liées à
            l'utilisation ou à l'indisponibilité du service, ni des décisions prises sur la base d'une réponse
            automatique.
          </p>

          <h2>8. Résiliation</h2>
          <p>
            Vous pouvez fermer votre compte à tout moment. Nous pouvons suspendre ou fermer un compte en cas de
            manquement aux présentes conditions. À la fermeture, vos données sont traitées comme indiqué dans la
            politique de confidentialité.
          </p>

          <h2>9. Droit applicable</h2>
          <p>
            Les présentes conditions sont régies par le droit applicable au lieu d'établissement de l'éditeur de
            Wapy. Tout différend sera d'abord recherché à l'amiable.
          </p>

          <h2>10. Contact</h2>
          <p>Pour toute question : <strong>{CONTACT}</strong>.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
