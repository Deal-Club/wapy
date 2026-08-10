import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import { SITE_URL } from "@/lib/site";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Wapy · Votre assistant WhatsApp intelligent",
  description: "Répondez à vos clients sur WhatsApp, automatiquement. Pour tout secteur d'activité.",
  manifest: "/manifest.webmanifest",
  applicationName: "Wapy",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Wapy" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C2502F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
