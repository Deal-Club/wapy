/**
 * Rendu des images OpenGraph. Les contenus affichés viennent de `lib/og.ts`.
 *
 * Contraintes techniques de `ImageResponse` :
 *
 * - PAS de `export const runtime = "edge"` dans les routes qui appellent ceci.
 *   Le site est auto-hébergé derrière Docker avec `next start`, en runtime Node,
 *   où `ImageResponse` fonctionne sans edge.
 * - L'import vient de `@vercel/og` et NON de `next/og`. Next 14 embarque
 *   `@vercel/og` 0.6.3, dont le build Node lit ses ressources avec
 *   `path.join(import.meta.url, "../resvg.wasm")`. Sous Windows, `path.join`
 *   rend `.\file:\D:\...` : le schéma `file:` est perdu et le rendu casse avec
 *   « Invalid URL ». `next build` échouait donc sur les 25 images en local,
 *   alors que la même commande passe sous Linux. La version 1.0.1, dépendance
 *   directe du projet, utilise `new URL("./resvg.wasm", import.meta.url)` et
 *   fonctionne sur les deux systèmes. `next.config.js` la garde hors du bundle
 *   serveur, sans quoi webpack réécrirait `import.meta.url` et les `.wasm`
 *   seraient introuvables à l'exécution.
 * - Tailwind n'existe pas ici. Satori ne lit que des styles en ligne, d'où les
 *   valeurs hexadécimales écrites en clair. Elles sont reprises des jetons de
 *   `tailwind.config.ts` et rassemblées dans `COULEURS` pour qu'une dérive se
 *   voie à un seul endroit.
 * - La police est celle que `@vercel/og` embarque (Geist, graisse 400
 *   uniquement), pas Montserrat. Montserrat est chargée par
 *   `next/font/google` : ses fichiers n'existent qu'après le build, en woff2,
 *   format que Satori ne lit pas, et les télécharger au build ferait dépendre
 *   la construction du site d'un appel réseau. Conséquence assumée : la
 *   hiérarchie visuelle de ces images repose sur la TAILLE et la COULEUR,
 *   jamais sur le gras, qui ne serait pas rendu.
 */

import { ImageResponse } from "@vercel/og";
import { PIED_OG, TAILLE_OG, tailleTitre, type ContenuOG } from "@/lib/og";

/** Jetons de `tailwind.config.ts`, recopiés parce que Satori ignore Tailwind. */
const COULEURS = {
  cream: "#F7F4EF",
  ink: "#211C18",
  muted: "#726A61",
  line: "#E8E1D6",
  brand: "#C2502F",
};

/** Rend un contenu en image PNG 1200x630. */
export function imageOG(contenu: ContenuOG): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 76px",
          background: COULEURS.cream,
          color: COULEURS.ink,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 20,
              background: COULEURS.brand,
              color: COULEURS.cream,
              fontSize: 36,
            }}
          >
            W
          </div>
          <div style={{ marginLeft: 20, fontSize: 38, letterSpacing: -0.5 }}>Wapy</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: COULEURS.brand }}>
            {contenu.surtitre}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: tailleTitre(contenu.titre),
              lineHeight: 1.12,
              letterSpacing: -1,
            }}
          >
            {contenu.titre}
          </div>
          {contenu.accroche ? (
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, color: COULEURS.muted }}>
              {contenu.accroche}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 2, background: COULEURS.line }} />
          <div style={{ display: "flex", marginTop: 22, fontSize: 24, color: COULEURS.muted }}>
            {PIED_OG}
          </div>
        </div>
      </div>
    ),
    TAILLE_OG,
  );
}
