import { SOURCES } from "@/content/sources";
import type { Chiffre, NatureChiffre, Source } from "@/content/types";

export type PopulationResolue = {
  chiffre: Chiffre;
  source: Source;
  /** Formulation qui porte la nature du chiffre dans la phrase publiée. */
  libelleNature: string;
};

/**
 * Comment lire le chiffre, en toutes lettres.
 *
 * `Partial` volontairement : `NatureChiffre` contient aussi "mesure", qui
 * qualifie un relevé fait sur notre propre logiciel et ne peut pas qualifier une
 * population (cf. `tests/donnees.test.ts`, NATURES_DEMOGRAPHIQUES). Lui donner
 * un libellé ici reviendrait à préparer l'affichage d'un cas que les données
 * interdisent ; l'absence d'entrée le fait au contraire refuser au rendu.
 */
const NATURE_POPULATION: Partial<Record<NatureChiffre, string>> = {
  recensement: "Population recensée",
  estimation: "Population estimée",
};

/**
 * Applique le garde-fou G1 au chiffre de population : aucun chiffre sans source,
 * et aucune nature démographique inventée.
 *
 * Isolée du composant pour être testable avec un chiffre fabriqué, ce que
 * `Population` seul ne permet pas puisqu'il ne rend rien d'inspectable. Renvoie
 * `null` quand rien ne doit être affiché, ce qui est un cas normal : le Bénin
 * n'a pas de population publiable, son dernier dénombrement datant de 2013.
 */
export function resoudrePopulation(chiffre: Chiffre | undefined): PopulationResolue | null {
  if (!chiffre) return null;
  const libelleNature = NATURE_POPULATION[chiffre.nature];
  if (!libelleNature) return null;
  const source = SOURCES[chiffre.source];
  if (!source) return null;
  return { chiffre, source, libelleNature };
}

/**
 * Chiffre de population avec son année, sa nature et le lien de sa source.
 *
 * Rendu hors du tableau de repères : une cellule de `TableauComparatif` est une
 * chaîne et ne peut pas porter le lien qu'exige G1. Server Component, sans état.
 */
export default function Population({ chiffre }: { chiffre?: Chiffre }) {
  const resolu = resoudrePopulation(chiffre);
  if (!resolu) return null;

  const { source, libelleNature } = resolu;
  return (
    <p className="mt-4 text-sm text-muted">
      {libelleNature} en {resolu.chiffre.annee} :{" "}
      <strong className="font-semibold text-ink">
        {resolu.chiffre.valeur.toLocaleString("fr-FR")} habitants
      </strong>
      . Source :{" "}
      <a href={source.url} className="underline hover:text-brand">
        {source.label}
      </a>
      .
    </p>
  );
}
