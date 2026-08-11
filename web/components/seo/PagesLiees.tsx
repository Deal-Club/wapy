import Link from "next/link";
import type { Lien } from "@/lib/maillage";

/** Liens contextuels calculés par le moteur de maillage. */
export default function PagesLiees({
  liens,
  titre = "À lire aussi",
}: {
  liens: Lien[];
  titre?: string;
}) {
  if (liens.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-xl font-bold">{titre}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {liens.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-line bg-surface p-4 text-sm font-semibold text-ink shadow-soft transition hover:text-brand hover:shadow-lift"
            >
              {l.ancre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
