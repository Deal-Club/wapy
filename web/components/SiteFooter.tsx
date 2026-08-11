import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row">
        <div className="font-display text-lg font-bold text-brand">Wapy</div>
        <p>Assistant WhatsApp intelligent pour les entreprises · Conçu pour l&apos;Afrique</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/a-propos" className="hover:text-ink">À propos</Link>
          <Link href="/tarifs" className="hover:text-ink">Tarifs</Link>
          <Link href="/faq" className="hover:text-ink">FAQ</Link>
          <Link href="/blog" className="hover:text-ink">Blog</Link>
          <Link href="/signup" className="hover:text-ink">Commencer</Link>
        </div>
      </div>
    </footer>
  );
}
