#!/usr/bin/env node
/**
 * Signale les pages du site à IndexNow après un déploiement.
 *
 * Pourquoi : Google découvre un domaine neuf en jours voire en semaines. IndexNow
 * est un simple ping HTTP que Bing, Yandex, Seznam et Naver acceptent, et qui fait
 * crawler en heures. Bing compte doublement ici : son index alimente ChatGPT, donc
 * c'est le chemin le plus court vers une citation par une IA, qui est tout l'objet
 * des pages pays / secteurs / comparatifs.
 *
 * Google n'implémente PAS IndexNow. Pour lui, le sitemap dans la Search Console
 * reste le canal, et il n'y a rien à automatiser.
 *
 * L'authentification, c'est la clé publiée à la racine du site : le moteur va lire
 * `keyLocation` et vérifie qu'elle contient bien la même valeur. Ce n'est donc pas
 * un secret, et elle a sa place dans le dépôt (`web/public/<clé>.txt`). Un test
 * verrouille l'égalité entre ce fichier et la constante ci-dessous.
 *
 *   node scripts/indexnow.mjs            # lit le sitemap en ligne, signale tout
 *   node scripts/indexnow.mjs /tarifs /faq   # ne signale que ces chemins
 */

export const CLE = "479c4065c6f4ce868149f7e72661bf58";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://wapy.pro";
const POINT_DE_SERVICE = "https://api.indexnow.org/indexnow";

/** Extrait les <loc> du sitemap publié. */
async function urlsDuSitemap() {
  const reponse = await fetch(`${SITE}/sitemap.xml`);
  if (!reponse.ok) {
    throw new Error(`sitemap illisible : HTTP ${reponse.status}`);
  }
  const xml = await reponse.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error("sitemap vide : rien à signaler");
  return urls;
}

async function main() {
  const chemins = process.argv.slice(2);
  const urls = chemins.length
    ? chemins.map((c) => new URL(c, SITE).toString())
    : await urlsDuSitemap();

  const hote = new URL(SITE).host;
  const reponse = await fetch(POINT_DE_SERVICE, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: hote,
      key: CLE,
      keyLocation: `${SITE}/${CLE}.txt`,
      urlList: urls,
    }),
  });

  // 200 = pris en compte, 202 = clé en cours de validation (normal au premier envoi).
  if (reponse.status !== 200 && reponse.status !== 202) {
    const corps = await reponse.text();
    throw new Error(`IndexNow a refusé : HTTP ${reponse.status} ${corps}`.trim());
  }
  const suite = reponse.status === 202 ? " (clé en cours de validation)" : "";
  console.log(`${urls.length} URL signalées à IndexNow pour ${hote}${suite}`);
}

// Exécuté directement, pas quand le test importe CLE.
if (process.argv[1] && process.argv[1].endsWith("indexnow.mjs")) {
  main().catch((erreur) => {
    console.error(`IndexNow : ${erreur.message}`);
    process.exit(1);
  });
}
