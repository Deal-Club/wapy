"use client";
import { useEffect } from "react";

/**
 * Enregistre le service worker — en production seulement.
 *
 * `public/sw.js` sert les fichiers `/_next/` en « cache d'abord ». En production
 * leurs noms portent une empreinte : un déploiement produit de nouvelles URLs,
 * le cache ne peut donc pas rendre une version périmée. En développement ces
 * noms sont stables (`webpack.js`, `main-app.js`), et un cache « cache d'abord »
 * sur des noms stables peut rendre un fichier qui ne correspond plus au reste du
 * bundle. Le service worker n'a rien à apporter en développement, où il ne fait
 * que s'interposer dans le rechargement à chaud : on ne l'enregistre pas.
 *
 * On désinscrit aussi ceux déjà actifs et on vide leurs caches, pour les
 * navigateurs qui en ont enregistré un lors d'une session précédente.
 *
 * Limite connue : ce nettoyage s'exécute au montage React. Si le bundle ne se
 * charge pas, rien de tout ceci ne tourne — il faut alors vider les données du
 * site depuis les outils de développement du navigateur.
 */
export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((enregistres) => Promise.all(enregistres.map((r) => r.unregister())))
        .catch(() => {});
      if ("caches" in window) {
        caches.keys().then((cles) => Promise.all(cles.map((c) => caches.delete(c)))).catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
