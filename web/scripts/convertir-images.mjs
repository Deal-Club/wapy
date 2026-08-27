/**
 * Convertit les illustrations livrées en PNG vers du WebP dimensionné.
 *
 *   node scripts/convertir-images.mjs
 *
 * Les PNG d'origine font ~1,7 Mo pièce : servis tels quels, les quatre visuels
 * pèseraient plus lourd que tout le reste de la page réunie. Ils sont
 * redimensionnés à la taille réellement affichée (fois deux pour les écrans à
 * forte densité) puis encodés en WebP.
 *
 * `sharp` est déjà une dépendance du projet, tirée par `@vercel/og`.
 *
 * Sortie dans `images/scenes/`, surtout pas dans `images/illustrations/` : ce
 * dernier est réservé aux schémas du catalogue `content/illustrations.ts`, dont
 * le texte de remplacement est écrit une seule fois et l'affichage passe
 * obligatoirement par `<Figure>` (cf. tests/illustrations.test.ts). Ces
 * visuels-ci sont des scènes intégrées au dessin des sections, pas des schémas
 * légendés : ils relèvent d'une autre famille et d'un autre dossier.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const RACINE = path.join(import.meta.dirname, "..");
const SORTIE = path.join(RACINE, "public/images/scenes");

// Les trois cartes d'étapes s'affichent sur ~360 px de large en trois colonnes,
// la scène du terrain sur ~550 px dans sa demi-grille.
const TRAVAUX = [
  { source: "image copy 2.png", cible: "etape-decrire.webp", largeur: 900 },
  { source: "image copy 3.png", cible: "etape-ajuster.webp", largeur: 900 },
  { source: "image copy 4.png", cible: "etape-scanner.webp", largeur: 900 },
  { source: "image copy 5.png", cible: "terrain-assistant.webp", largeur: 1200 },
];

await mkdir(SORTIE, { recursive: true });

for (const { source, cible, largeur } of TRAVAUX) {
  const entree = path.join(RACINE, "public", source);
  const destination = path.join(SORTIE, cible);
  const info = await sharp(entree)
    .resize({ width: largeur, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destination);
  console.log(
    `${cible.padEnd(26)} ${info.width}x${info.height}  ${Math.round(info.size / 1024)} Ko`
  );
}
