import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const CONTACT = "contact@wapy.pro";

export const metadata: Metadata = {
  title: "Politique de confidentialité · Wapy",
  description:
    "Comment Wapy collecte, utilise et protège les données des établissements et de leurs clients sur WhatsApp.",
  alternates: { canonical: `${SITE_URL}/confidentialite` },
  robots: { index: true, follow: true },
};

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : 11 août 2026</p>

        <article className="article mt-8">
          <p>
            Cette politique explique quelles données Wapy collecte, pourquoi, et comment nous les protégeons. Wapy
            est un assistant qui répond aux clients des entreprises sur WhatsApp. Nous traitons deux types de
            personnes : les <strong>établissements</strong> qui utilisent Wapy, et les <strong>clients</strong> de
            ces établissements qui écrivent sur WhatsApp.
          </p>

          <h2>1. Données que nous collectons</h2>
          <p>Pour un établissement qui crée un compte :</p>
          <ul>
            <li>Adresse e-mail, mot de passe (stocké haché, jamais en clair), nom de l'entreprise.</li>
            <li>Le numéro WhatsApp du responsable et celui connecté à l'assistant.</li>
            <li>La configuration que vous saisissez : informations, catalogue, prix, prestations, FAQ, consignes.</li>
            <li>Des compteurs d'usage (nombre de messages) à des fins de facturation et de sécurité.</li>
          </ul>
          <p>Pour les clients d'un établissement :</p>
          <ul>
            <li>Le contenu des messages WhatsApp échangés avec l'assistant et le numéro de l'expéditeur, afin de générer une réponse et de tenir l'historique de la conversation.</li>
            <li>Les demandes conclues par l'assistant (réservations, commandes, rendez-vous) enregistrées pour l'établissement.</li>
          </ul>
          <p>Nous ne collectons pas vos données bancaires : les paiements sont traités par notre prestataire de paiement.</p>

          <h2>2. Pourquoi nous utilisons ces données</h2>
          <ul>
            <li>Fournir le service : comprendre les messages et y répondre à partir des informations de l'établissement.</li>
            <li>Gérer votre compte, votre abonnement et la facturation.</li>
            <li>Assurer la sécurité, prévenir les abus, et vous fournir un support.</li>
          </ul>
          <p>Nous n'utilisons pas vos conversations pour de la publicité, et nous ne les vendons pas.</p>

          <h2>3. Prestataires qui nous aident</h2>
          <p>Pour faire fonctionner le service, certaines données sont transmises à des prestataires, uniquement pour la finalité concernée :</p>
          <ul>
            <li><strong>Anthropic</strong> (modèle d'IA Claude) : le contenu du message et la fiche de l'établissement sont envoyés pour générer la réponse.</li>
            <li><strong>Prestataire de paiement</strong> (GeniusPay) : pour traiter les abonnements. Vos coordonnées bancaires ne transitent pas par Wapy.</li>
            <li><strong>Google</strong> : uniquement si l'établissement active la synchronisation Google Agenda, pour créer ses rendez-vous.</li>
            <li><strong>WhatsApp / Meta</strong> : le canal par lequel transitent les messages.</li>
            <li><strong>Hébergeur</strong> : la plateforme est hébergée sur un serveur dédié, en Europe.</li>
          </ul>

          <h2>4. Durée de conservation</h2>
          <p>
            Nous conservons vos données tant que votre compte est actif. À la fermeture du compte, ou sur demande,
            nous supprimons ou anonymisons vos données dans un délai raisonnable, sauf obligation légale de
            conservation. Des sauvegardes chiffrées peuvent subsister quelques jours avant purge automatique.
          </p>

          <h2>5. Sécurité</h2>
          <ul>
            <li>Chaque établissement dispose d'un espace isolé : vos données ne sont accessibles qu'à vous.</li>
            <li>Les mots de passe sont stockés hachés.</li>
            <li>Les échanges avec la plateforme sont chiffrés (HTTPS).</li>
            <li>Les accès sont protégés et les sauvegardes régulières.</li>
          </ul>

          <h2>6. Vos droits</h2>
          <p>
            Vous pouvez demander l'accès, la rectification ou la suppression de vos données, ainsi que l'export de
            votre configuration. Pour exercer ces droits, écrivez-nous à <strong>{CONTACT}</strong>.
          </p>

          <h2>7. Cookies et stockage local</h2>
          <p>
            Wapy n'utilise pas de cookies publicitaires ni de traceurs. Un jeton de connexion est conservé dans
            votre navigateur pour vous garder connecté à votre tableau de bord.
          </p>

          <h2>8. Modifications</h2>
          <p>
            Nous pouvons mettre à jour cette politique. En cas de changement important, nous vous en informerons via
            le service. La date en haut de page indique la dernière mise à jour.
          </p>

          <h2>9. Contact</h2>
          <p>Pour toute question relative à vos données : <strong>{CONTACT}</strong>.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
