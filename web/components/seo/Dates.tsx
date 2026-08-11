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
    <p className="mt-6 text-xs text-muted">
      Publié le <time dateTime={publieLe}>{fmt(publieLe)}</time>
      {modifieLe !== publieLe && (
        <>
          {" · Mis à jour le "}
          <time dateTime={modifieLe}>{fmt(modifieLe)}</time>
        </>
      )}
    </p>
  );
}
