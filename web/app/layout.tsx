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
    <html lang="fr" className={montserrat.variable}>
      <body>
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
