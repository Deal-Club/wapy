/**
 * Génère les illustrations du site, en WebP, dans `public/images/illustrations/`.
 *
 *   node scripts/illustrations.mjs
 *
 * Ce sont des SCHÉMAS, pas des captures du produit. Règle absolue, héritée du
 * travail de correction des affirmations produit : une illustration
 * n'imite JAMAIS l'interface de Wapy et ne porte aucun chiffre. Elle explique
 * une mécanique avec des mots déjà écrits et vérifiés ailleurs sur le site.
 * Les vraies captures, quand elles existeront, iront dans
 * `public/images/produit/` et seront les seules à pouvoir être présentées
 * comme telles.
 *
 * Elles n'énumèrent rien non plus : ni la liste des pays, ni celle des
 * secteurs. Ces listes vivent dans `content/`, sont rendues en HTML et
 * surveillées par les tests ; gravées dans un pixel, elles mentiraient au
 * premier ajout sans que rien ne le signale.
 *
 * Le SVG est écrit à la main puis rastérisé par sharp (déjà présent, tiré par
 * `@vercel/og`). Les fichiers WebP produits sont commités : cette commande ne
 * sert qu'à les régénérer. Le rendu du texte passe par les polices du système,
 * donc une régénération sur une autre machine peut décaler légèrement les
 * lettres. C'est sans conséquence : le fichier commité fait foi.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = path.join(RACINE, "public", "images", "illustrations");

/** Jetons de `tailwind.config.ts`. */
const C = {
  cream: "#F7F4EF",
  surface: "#FFFFFF",
  ink: "#211C18",
  muted: "#726A61",
  line: "#E8E1D6",
  brand: "#C2502F",
};

const POLICE = "Segoe UI, Helvetica, Arial, sans-serif";

/** Échappe les caractères que XML ne laisse pas passer dans un nœud texte. */
function txt(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/* Parcours d'un message                                               */
/* ------------------------------------------------------------------ */

/**
 * Les quatre temps d'un message, dans l'ordre. Chaque ligne reprend une
 * affirmation déjà publiée sur `/comment-ca-marche`, elle-même adossée au code
 * du produit (brain/brain.py).
 */
const PARCOURS = [
  {
    titre: "Le client écrit",
    detail: "Sur le numéro WhatsApp que vous utilisez déjà.",
  },
  {
    titre: "L'assistant lit votre fiche",
    detail: "Vos horaires, votre adresse, votre catalogue, vos consignes.",
  },
  {
    titre: "Il mène la demande jusqu'au bout",
    detail: "Il pose les questions qui manquent, puis confirme au client.",
  },
  {
    titre: "Vous recevez le récapitulatif",
    detail: "Et l'alerte, dans les cas rares où un humain est indispensable.",
  },
];

function svgParcours() {
  const L = 1600;
  const hauteurCarte = 200;
  const pas = 270;
  const H = 20 + PARCOURS.length * pas - (pas - hauteurCarte) + 20;

  const y = (i) => 20 + i * pas;
  const centre = (i) => y(i) + hauteurCarte / 2;

  const cartes = PARCOURS.map((e, i) => {
    const haut = y(i);
    return `
    <rect x="120" y="${haut}" width="1440" height="${hauteurCarte}" rx="28"
          fill="${C.surface}" stroke="${C.line}" stroke-width="3"/>
    <text x="184" y="${haut + 88}" font-family="${POLICE}" font-size="40" fill="${C.ink}">${txt(e.titre)}</text>
    <text x="184" y="${haut + 146}" font-family="${POLICE}" font-size="30" fill="${C.muted}">${txt(e.detail)}</text>`;
  }).join("");

  const pastilles = PARCOURS.map(
    (_, i) => `<circle cx="60" cy="${centre(i)}" r="18" fill="${C.brand}"/>`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
  <rect width="${L}" height="${H}" fill="${C.cream}"/>
  <line x1="60" y1="${centre(0)}" x2="60" y2="${centre(PARCOURS.length - 1)}"
        stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
  ${pastilles}
  ${cartes}
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Silos du site                                                       */
/* ------------------------------------------------------------------ */

/**
 * Les trois familles de pages. Aucune ne cite d'entrée précise : la donnée
 * change, l'image non.
 */
const SILOS = [
  { titre: "Pays", detail: "Là où vous travaillez" },
  { titre: "Secteurs", detail: "Ce que vous vendez" },
  { titre: "Comparatifs", detail: "Ce qui existe ailleurs" },
];

function svgSilos() {
  const L = 1600;
  const H = 760;
  const largeur = 440;
  const ecart = 60;
  const depart = (L - (SILOS.length * largeur + (SILOS.length - 1) * ecart)) / 2;
  const hautColonnes = 380;
  const hauteurColonne = 300;
  const basRacine = 240;

  const colonnes = SILOS.map((s, i) => {
    const x = depart + i * (largeur + ecart);
    const cx = x + largeur / 2;
    return `
    <path d="M ${L / 2} ${basRacine} V ${hautColonnes - 60} H ${cx} V ${hautColonnes}"
          fill="none" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
    <rect x="${x}" y="${hautColonnes}" width="${largeur}" height="${hauteurColonne}" rx="28"
          fill="${C.surface}" stroke="${C.line}" stroke-width="3"/>
    <circle cx="${cx}" cy="${hautColonnes + 92}" r="18" fill="${C.brand}"/>
    <text x="${cx}" y="${hautColonnes + 176}" text-anchor="middle" font-family="${POLICE}"
          font-size="44" fill="${C.ink}">${txt(s.titre)}</text>
    <text x="${cx}" y="${hautColonnes + 230}" text-anchor="middle" font-family="${POLICE}"
          font-size="28" fill="${C.muted}">${txt(s.detail)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
  <rect width="${L}" height="${H}" fill="${C.cream}"/>
  <rect x="${L / 2 - 220}" y="80" width="440" height="160" rx="32" fill="${C.brand}"/>
  <text x="${L / 2}" y="185" text-anchor="middle" font-family="${POLICE}" font-size="60"
        fill="${C.cream}">Wapy</text>
  ${colonnes}
</svg>`;
}

/* ------------------------------------------------------------------ */

const ILLUSTRATIONS = [
  { nom: "parcours-message", svg: svgParcours() },
  { nom: "silos-du-site", svg: svgSilos() },
];

await mkdir(SORTIE, { recursive: true });

for (const { nom, svg } of ILLUSTRATIONS) {
  const octets = await sharp(Buffer.from(svg)).webp({ lossless: true }).toBuffer();
  const metadonnees = await sharp(octets).metadata();
  await writeFile(path.join(SORTIE, `${nom}.webp`), octets);
  console.log(
    `${nom}.webp  ${metadonnees.width}x${metadonnees.height}  ${Math.round(octets.length / 1024)} ko`,
  );
}
