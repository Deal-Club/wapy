import { CalendarDays } from "lucide-react";

/**
 * Formate une date ISO courte en français. Une chaîne illisible est rendue telle
 * quelle plutôt qu'en « Invalid Date » : mieux vaut afficher la donnée brute
 * qu'un message d'erreur au milieu d'une page publique.
 */
function fmt(d: string): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Dates({ publieLe, modifieLe }: { publieLe: string; modifieLe: string }) {
  return (
    <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-brand/70" strokeWidth={2} />
      {/* Un seul enfant de texte : l'espacement du conteneur ne doit séparer que
          l'icône de la phrase, pas « le » de sa date. */}
      <span>
        Publié le <time dateTime={publieLe}>{fmt(publieLe)}</time>
        {modifieLe !== publieLe && (
          <>
            {" · Mis à jour le "}
            <time dateTime={modifieLe}>{fmt(modifieLe)}</time>
          </>
        )}
      </span>
    </p>
  );
}
