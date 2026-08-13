export type Colonne = { cle: string; libelle: string };
export type Ligne = Record<string, string>;

/**
 * Tableau HTML brut, lisible par les moteurs génératifs.
 *
 * Le défilement horizontal est confiné au conteneur : `max-w-full` et `min-w-0`
 * empêchent la largeur minimale du tableau de remonter jusqu'au parent, ce qui
 * ferait déborder la page entière au lieu du seul tableau (un enfant de flex ou
 * de grid a `min-width: auto` par défaut et refuse de rétrécir sans cela).
 */
export default function TableauComparatif({
  colonnes,
  lignes,
  legende,
}: {
  colonnes: Colonne[];
  lignes: Ligne[];
  legende?: string;
}) {
  if (colonnes.length === 0) return null;
  return (
    <figure className="mt-8 min-w-0 max-w-full">
      <div className="max-w-full overflow-x-auto rounded-xl2 border border-line bg-surface shadow-soft">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            {/* En-tête teinté : sur un tableau qui défile horizontalement, la
                première ligne doit rester reconnaissable d'un coup d'oeil. */}
            <tr className="bg-brand-soft/40">
              {colonnes.map((c) => (
                <th
                  key={c.cle}
                  scope="col"
                  className="border-b border-line px-4 py-3.5 text-left text-[13px] font-bold uppercase tracking-wide text-ink"
                >
                  {c.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className="transition-colors hover:bg-brand-soft/20">
                {colonnes.map((c, j) => (
                  <td
                    key={c.cle}
                    className={`border-b border-line/60 px-4 py-3.5 align-top leading-relaxed ${
                      // La première colonne nomme la ligne : elle se lit comme
                      // un intitulé, pas comme une valeur parmi d'autres.
                      j === 0 ? "font-semibold text-ink" : "text-muted"
                    }`}
                  >
                    {l[c.cle] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legende && (
        <figcaption className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <span aria-hidden="true" className="mt-1.5 h-px w-6 shrink-0 bg-brand/50" />
          {legende}
        </figcaption>
      )}
    </figure>
  );
}
