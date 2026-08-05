import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wapy — Assistant WhatsApp pour restaurants",
  description: "Répondez à vos clients sur WhatsApp, automatiquement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
