import { paysPublies, getPays } from "@/content/pays";
import { secteursPublies, getSecteur } from "@/content/secteurs";
import { villesPubliees, villesDuPays } from "@/content/villes";
import { COMPARATIFS_PUBLIES } from "@/content/comparatifs";

export type TypePage = "accueil" | "pays" | "ville" | "secteur" | "comparatif" | "entite";
export type PageRef = { url: string; titre: string; type: TypePage };
export type Lien = { href: string; ancre: string };

/** Hash stable, sans dépendance, pour choisir une ancre de façon reproductible. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ancre(variantes: string[], graine: string): string {
  return variantes[hash(graine) % variantes.length];
}

/** Pages entité de la vague 1. */
const PAGES_ENTITE: PageRef[] = [
  { url: "/a-propos", titre: "À propos de Wapy", type: "entite" },
  { url: "/tarifs", titre: "Tarifs", type: "entite" },
  { url: "/faq", titre: "Questions fréquentes", type: "entite" },
  { url: "/comment-ca-marche", titre: "Comment ça marche", type: "entite" },
];

export function pagesPubliees(): PageRef[] {
  return [
    { url: "/", titre: "Wapy, assistant WhatsApp intelligent", type: "accueil" },
    ...paysPublies().map<PageRef>((p) => ({
      url: `/chatbot-whatsapp/${p.slug}`,
      titre: `Chatbot WhatsApp ${p.nom}`,
      type: "pays",
    })),
    ...villesPubliees().map<PageRef>((v) => ({
      url: `/chatbot-whatsapp/${v.pays}/${v.slug}`,
      titre: `Chatbot WhatsApp ${v.nom}`,
      type: "ville",
    })),
    ...secteursPublies().map<PageRef>((s) => ({
      url: `/secteurs/${s.slug}`,
      titre: `Chatbot WhatsApp ${s.nomPluriel.toLowerCase()}`,
      type: "secteur",
    })),
    ...COMPARATIFS_PUBLIES.map<PageRef>((c) => ({
      url: `/comparatif/${c.slug}`,
      titre: c.titre,
      type: "comparatif",
    })),
    ...PAGES_ENTITE,
  ];
}

function urlsPubliees(): Set<string> {
  return new Set(pagesPubliees().map((p) => p.url));
}

/** Ne garde que les liens dont la cible est publiée et différente de la source. */
function filtrer(source: string, liens: Lien[]): Lien[] {
  const publiees = urlsPubliees();
  const vus = new Set<string>();
  return liens.filter((l) => {
    if (l.href === source || !publiees.has(l.href)) return false;
    if (vus.has(l.href)) return false;
    vus.add(l.href);
    return true;
  });
}

function liensSecteurs(slugs: string[], graine: string): Lien[] {
  return slugs.flatMap((slug) => {
    const s = getSecteur(slug);
    if (!s) return [];
    return [{
      href: `/secteurs/${s.slug}`,
      ancre: ancre(
        [s.motCle, `assistant WhatsApp ${s.nomPluriel.toLowerCase()}`, `Wapy pour ${s.nomPluriel.toLowerCase()}`],
        graine + slug,
      ),
    }];
  });
}

export function liensSortants(url: string): Lien[] {
  const pays = paysPublies().find((p) => `/chatbot-whatsapp/${p.slug}` === url);
  if (pays) {
    const villes = villesDuPays(pays.slug).filter((v) => v.publie);
    return filtrer(url, [
      ...villes.map((v) => ({
        href: `/chatbot-whatsapp/${v.pays}/${v.slug}`,
        ancre: ancre(
          [`chatbot WhatsApp ${v.nom}`, `assistant WhatsApp à ${v.nom}`, `Wapy à ${v.nom}`],
          pays.slug + v.slug,
        ),
      })),
      ...liensSecteurs(pays.secteursPhares, pays.slug),
      { href: "/comment-ca-marche", ancre: "comment fonctionne Wapy" },
      { href: "/tarifs", ancre: "tarifs de Wapy" },
    ]);
  }

  const ville = villesPubliees().find((v) => `/chatbot-whatsapp/${v.pays}/${v.slug}` === url);
  if (ville) {
    const p = getPays(ville.pays);
    // Rotation par index plutôt que `slice` en tête : chaque ville du groupe
    // pointe vers les `k` suivantes (modulo la taille du groupe), ce qui rend
    // chaque ville du groupe destinataire d'exactement `k` liens venus des
    // autres villes (graphe circulant, entrée = sortie par construction). Un
    // `slice(0, 3)` en tête privait systématiquement la dernière ville du
    // groupe de tout lien entrant venu de ses voisines.
    const groupe = villesDuPays(ville.pays).filter((v) => v.publie);
    const indexVille = groupe.findIndex((v) => v.slug === ville.slug);
    const k = Math.min(3, groupe.length - 1);
    const voisines = Array.from({ length: Math.max(k, 0) }, (_, i) => groupe[(indexVille + 1 + i) % groupe.length]);
    return filtrer(url, [
      ...(p
        ? [{
            href: `/chatbot-whatsapp/${p.slug}`,
            ancre: ancre(
              [`chatbot WhatsApp ${p.nom}`, `assistant WhatsApp au ${p.nom}`, `Wapy ${p.nom}`],
              ville.slug,
            ),
          }]
        : []),
      ...voisines.map((v) => ({
        href: `/chatbot-whatsapp/${v.pays}/${v.slug}`,
        ancre: ancre([`chatbot WhatsApp ${v.nom}`, `assistant WhatsApp à ${v.nom}`], ville.slug + v.slug),
      })),
      ...liensSecteurs(ville.secteursDominants, ville.slug),
    ]);
  }

  const secteur = secteursPublies().find((s) => `/secteurs/${s.slug}` === url);
  if (secteur) {
    // Une ville par pays, choisie de façon déterministe mais différente pour
    // chaque secteur (graine = secteur + pays), pour ne jamais concentrer les
    // liens sortants des pages secteur sur un seul pays ni sur les mêmes
    // villes d'un secteur à l'autre. Un `villesPubliees().slice(0, 5)` global
    // prenait toujours les 5 premières villes du tableau, toutes du même pays.
    const villesCibles = paysPublies().flatMap((p) => {
      const groupe = villesDuPays(p.slug).filter((v) => v.publie);
      if (groupe.length === 0) return [];
      return [groupe[hash(secteur.slug + p.slug) % groupe.length]];
    });
    return filtrer(url, [
      ...villesCibles.map((v) => ({
        href: `/chatbot-whatsapp/${v.pays}/${v.slug}`,
        ancre: ancre([`chatbot WhatsApp ${v.nom}`, `assistant WhatsApp à ${v.nom}`], secteur.slug + v.slug),
      })),
      ...paysPublies().slice(0, 3).map((p) => ({
        href: `/chatbot-whatsapp/${p.slug}`,
        ancre: ancre([`chatbot WhatsApp ${p.nom}`, `Wapy au ${p.nom}`], secteur.slug + p.slug),
      })),
      { href: "/tarifs", ancre: "tarifs de Wapy" },
      { href: "/comment-ca-marche", ancre: "comment fonctionne Wapy" },
    ]);
  }

  const comparatif = COMPARATIFS_PUBLIES.find((c) => `/comparatif/${c.slug}` === url);
  if (comparatif) {
    return filtrer(url, [
      ...paysPublies().map((p) => ({
        href: `/chatbot-whatsapp/${p.slug}`,
        ancre: ancre([`chatbot WhatsApp ${p.nom}`, `Wapy au ${p.nom}`], comparatif.slug + p.slug),
      })),
      ...liensSecteurs(comparatif.secteursLies, comparatif.slug),
      { href: "/tarifs", ancre: "tarifs de Wapy" },
      { href: "/a-propos", ancre: "qui est derrière Wapy" },
    ]);
  }

  if (url === "/") {
    return filtrer(url, [
      ...paysPublies().map((p) => ({
        href: `/chatbot-whatsapp/${p.slug}`,
        ancre: `chatbot WhatsApp ${p.nom}`,
      })),
      // Les 11 secteurs, pas un sous-ensemble : l'accueil est la page la plus
      // forte du site, en priver certains secteurs de son lien fragiliserait
      // leur plancher de 3 entrants au moindre resserrement ailleurs (cf.
      // ronde de correction 1, point 3).
      ...secteursPublies().map((s) => ({
        href: `/secteurs/${s.slug}`,
        ancre: s.motCle,
      })),
      ...COMPARATIFS_PUBLIES.slice(0, 3).map((c) => ({ href: `/comparatif/${c.slug}`, ancre: c.ancre })),
      { href: "/comment-ca-marche", ancre: "comment fonctionne Wapy" },
      { href: "/tarifs", ancre: "tarifs de Wapy" },
      { href: "/faq", ancre: "questions fréquentes" },
      { href: "/a-propos", ancre: "qui est derrière Wapy" },
    ]);
  }

  // Pages entité : elles renvoient vers les piliers pour ne pas être des culs-de-sac.
  if (PAGES_ENTITE.some((p) => p.url === url)) {
    return filtrer(url, [
      ...paysPublies().slice(0, 3).map((p) => ({
        href: `/chatbot-whatsapp/${p.slug}`,
        ancre: ancre([`chatbot WhatsApp ${p.nom}`, `Wapy au ${p.nom}`], url + p.slug),
      })),
      ...secteursPublies().slice(0, 3).map((s) => ({ href: `/secteurs/${s.slug}`, ancre: s.motCle })),
      ...PAGES_ENTITE.filter((p) => p.url !== url).map((p) => ({ href: p.url, ancre: p.titre.toLowerCase() })),
      ...COMPARATIFS_PUBLIES.map((c) => ({ href: `/comparatif/${c.slug}`, ancre: c.ancre })),
    ]);
  }

  return [];
}

export function liensEntrants(url: string): Lien[] {
  return pagesPubliees().flatMap((page) => {
    const lien = liensSortants(page.url).find((l) => l.href === url);
    return lien ? [{ href: page.url, ancre: lien.ancre }] : [];
  });
}

/**
 * G2 : rend les pages publiées recevant moins de 3 liens entrants contextuels.
 * L'accueil est exclu : il est atteint depuis le logo présent sur chaque page,
 * ce qui est un lien de navigation et non un lien contextuel.
 */
export function auditMaillage(): { url: string; entrants: number }[] {
  return pagesPubliees()
    .filter((p) => p.type !== "accueil")
    .map((p) => ({ url: p.url, entrants: liensEntrants(p.url).length }))
    .filter((r) => r.entrants < 3);
}
