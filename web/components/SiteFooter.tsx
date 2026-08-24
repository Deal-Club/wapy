import Link from "next/link";

import WapyMarque from "@/components/WapyMarque";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-brand">
          <WapyMarque className="h-6 w-6" couleurLettre="#FFFFFF" />
          Wapy
        </div>
        <p>Assistant WhatsApp intelligent pour les entreprises · Conçu pour l&apos;Afrique</p>
        <div className="flex flex-wrap justify-center gap-4">
          {/* Les 4 pages entité, au complet : en omettre une la privait du seul
              lien de navigation présent sur toutes les pages du site. */}
          <Link href="/a-propos" className="hover:text-ink">À propos</Link>
          <Link href="/comment-ca-marche" className="hover:text-ink">Comment ça marche</Link>
          <Link href="/tarifs" className="hover:text-ink">Tarifs</Link>
          <Link href="/faq" className="hover:text-ink">FAQ</Link>
          <Link href="/blog" className="hover:text-ink">Blog</Link>
          {/* Le pont est un service distinct de l'assistant : sa porte d'entrée
              est ici, pas dans le parcours d'inscription des établissements. */}
          <Link href="/developpeurs" className="hover:text-ink">Développeurs</Link>
          <Link href="/signup" className="hover:text-ink">Commencer</Link>
          <Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link>
          <Link href="/conditions" className="hover:text-ink">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
