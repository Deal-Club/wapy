import Link from "next/link";

export default function SiteHeader({
  lienSecondaire = { href: "/", libelle: "Accueil" },
}: {
  lienSecondaire?: { href: string; libelle: string };
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-2xl font-bold text-brand">
          Wapy
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href={lienSecondaire.href} className="text-muted hover:text-ink">
            {lienSecondaire.libelle}
          </Link>
          <Link href="/signup" className="btn text-sm">
            Commencer
          </Link>
        </div>
      </nav>
    </header>
  );
}
