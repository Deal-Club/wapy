import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import JsonLd from "@/components/seo/JsonLd";
import { organizationLd, websiteLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

// Police unique du site : Montserrat (équivalent libre de GothamPro, la police du
// site de référence eservices.anip.bj). Un seul jeu, décliné en graisses.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

/** Titre et description de repli, hérités par toute page qui n'en exporte pas. */
const TITRE = "Wapy · Votre assistant WhatsApp intelligent";
const DESCRIPTION =
  "Répondez à vos clients sur WhatsApp, automatiquement. Pour tout secteur d'activité.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITRE,
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: "Wapy",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Wapy" },
  // Le favicon 32 px vient en premier : sans lui, l'onglet tirait l'icône 192,
  // soit ~9 Ko redimensionnés par le navigateur pour afficher 16 px.
  // Le .ico multi-tailles (16/32/48) couvre les vieux navigateurs et le raccourci
  // bureau, qui demandent /favicon.ico sans regarder les balises.
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  // Canonique et OpenGraph de repli. Chaque page publique exporte les siens et
  // les remplace ; sans ce socle, une route qui n'en déclare pas (dashboard,
  // onboarding, widget) part sans canonique du tout.
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Wapy",
    locale: "fr_FR",
    title: TITRE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITRE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#C2502F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` : le script ci-dessous ajoute la classe `js` sur
    // <html> avant l'hydratation, donc le client voit un className que le serveur
    // n'a pas rendu. Sans cette annotation, React signale une différence
    // d'hydratation à chaque chargement. Elle ne porte que sur cet élément.
    <html lang="fr" className={montserrat.variable} suppressHydrationWarning>
      <body>
        {/*
          Marque le document comme « JavaScript actif », avant tout contenu.
          Les états cachés des animations (`.js .revele`, `.js .bulle` dans
          globals.css) en dépendent : sans script — navigateur sans JS, robot
          d'indexation, échec de chargement du bundle — rien n'est masqué et la
          page reste entièrement lisible. Placé en tête de body, il s'exécute
          avant que le contenu suivant soit peint : pas de clignotement.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
        {/*
          Filet de sécurité, développement uniquement : désinscrit tout service
          worker et vide ses caches, puis recharge une fois.

          Pourquoi ici plutôt que dans PWARegister, qui fait déjà ce nettoyage :
          PWARegister est un composant React, son effet ne tourne qu'une fois
          l'application montée. Or c'est précisément quand un chunk périmé casse
          l'hydratation que le nettoyage devient nécessaire — et là, React ne
          monte jamais. Le nettoyage ne pouvait donc jamais s'exécuter dans le
          seul cas où il servait à quelque chose. Ce script est inline dans le
          HTML : il tourne avant tout chunk, même quand le bundle est cassé.

          Pas de boucle de rechargement possible : après le passage il ne reste
          aucun enregistrement, la condition est fausse et rien ne se produit.
        */}
        {process.env.NODE_ENV !== "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){if(!navigator.serviceWorker)return;navigator.serviceWorker.getRegistrations().then(function(r){if(!r.length)return;Promise.all(r.map(function(x){return x.unregister()})).then(function(){return caches.keys()}).then(function(k){return Promise.all(k.map(function(n){return caches.delete(n)}))}).then(function(){location.reload()})}).catch(function(){})})()`,
            }}
          />
        )}
        {/*
          Entité et site déclarés une seule fois, pour toutes les pages. Les
          schémas propres à une page (Service, FAQPage, HowTo, BreadcrumbList)
          restent émis par la page elle-même. `organizationLd` porte un @id
          stable, référencé par les autres schémas en publisher/provider.
        */}
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
