import { isValidElement, type ReactElement } from "react";

/**
 * Inspection de l'arbre rendu par un Server Component appelé directement depuis
 * un test.
 *
 * Ces pages sont des fonctions synchrones sans état : `PagePays({ params })`
 * renvoie un arbre d'éléments React qu'on peut parcourir sans DOM ni moteur de
 * rendu. `vitest.config.ts` active `esbuild.jsx: "automatic"` précisément pour
 * permettre cet appel direct.
 *
 * Ce module n'est pas un fichier de test (`test.include` ne collecte que
 * `tests/**\/*.test.ts`) mais reste typecheck par `tsc`.
 */

/**
 * Props d'un élément, sous une forme indexable.
 *
 * `ReactElement.props` est typé `unknown` par @types/react : l'assertion est
 * confinée ici plutôt que répétée à chaque lecture, et reste plus étroite qu'un
 * `any` puisque chaque valeur lue est encore un `unknown` à vérifier.
 */
function props(el: ReactElement): Record<string, unknown> {
  return el.props as Record<string, unknown>;
}

/** Parcourt l'arbre en profondeur et visite chaque élément rencontré. */
export function parcourir(noeud: unknown, visiter: (el: ReactElement) => void): void {
  if (Array.isArray(noeud)) {
    for (const enfant of noeud) parcourir(enfant, visiter);
    return;
  }
  if (!isValidElement(noeud)) return;
  visiter(noeud);
  parcourir(props(noeud).children, visiter);
}

/**
 * Premier élément portant `id={id}`, ou `null`.
 *
 * Sert à restreindre une assertion à une seule section de la page : chercher un
 * `href` dans l'arbre entier confondrait les liens d'une section avec ceux du
 * bloc « À lire aussi », qui pointent vers les mêmes URLs.
 */
export function section(racine: unknown, id: string): ReactElement | null {
  const trouves: ReactElement[] = [];
  parcourir(racine, (el) => {
    if (props(el).id === id) trouves.push(el);
  });
  return trouves[0] ?? null;
}

/** Tous les `href` d'un sous-arbre, dans l'ordre du parcours. */
export function hrefs(racine: unknown): string[] {
  const liens: string[] = [];
  parcourir(racine, (el) => {
    const href = props(el).href;
    if (typeof href === "string") liens.push(href);
  });
  return liens;
}

/** Toutes les chaînes de texte d'un sous-arbre, dans l'ordre du parcours. */
export function textes(racine: unknown): string[] {
  const morceaux: string[] = [];
  parcourir(racine, (el) => {
    const children = props(el).children;
    const enfants = Array.isArray(children) ? children : [children];
    for (const enfant of enfants) {
      if (typeof enfant === "string") morceaux.push(enfant);
    }
  });
  return morceaux;
}
