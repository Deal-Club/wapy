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
      <div className="max-w-full overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="bg-surface">
              {colonnes.map((c) => (
                <th
                  key={c.cle}
                  scope="col"
                  className="border-b border-line px-4 py-3 text-left font-semibold"
                >
                  {c.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className="odd:bg-cream/40">
                {colonnes.map((c) => (
                  <td
                    key={c.cle}
                    className="border-b border-line/60 px-4 py-3 align-top text-muted"
                  >
                    {l[c.cle] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legende && <figcaption className="mt-2 text-xs text-muted">{legende}</figcaption>}
    </figure>
  );
}
