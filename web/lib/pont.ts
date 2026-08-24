/**
 * Client de la console développeurs.
 *
 * Volontairement séparé de `lib/api.ts` : le pont est un autre service, avec sa
 * propre authentification. Le jeton de session vit sous une clé distincte de
 * celle des établissements — sans quoi ouvrir la console déconnecterait un
 * propriétaire d'établissement travaillant dans le même navigateur.
 *
 * La clé d'API, elle, n'est jamais stockée ici : elle est affichée une fois puis
 * oubliée. Elle est faite pour vivre sur un serveur, pas dans un navigateur.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || "";
const CLE_JETON = "wapy_pont_token";

export function jeton(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLE_JETON);
}
export function poserJeton(t: string) {
  localStorage.setItem(CLE_JETON, t);
}
export function oublierJeton() {
  localStorage.removeItem(CLE_JETON);
}

async function req(chemin: string, opts: RequestInit = {}): Promise<any> {
  const entetes: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  const t = jeton();
  if (t) entetes["Authorization"] = `Bearer ${t}`;
  const res = await fetch(BASE + chemin, { ...opts, headers: entetes });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res;
}

const json = (corps: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(corps),
});

export type Compte = {
  nom: string;
  email: string;
  statut: "en_attente" | "actif" | "suspendu";
  peut_emettre: boolean;
  blocage: string;
  conditions_acceptees: boolean;
  conditions_version: string;
  cle_prefixe: string;
  session: string;
  whatsapp: string;
};

export const pont = {
  inscription: (nom: string, email: string, mot_de_passe: string) =>
    req("/pont/auth/inscription", json({ nom, email, mot_de_passe })),
  connexion: (email: string, mot_de_passe: string) =>
    req("/pont/auth/connexion", json({ email, mot_de_passe })),
  compte: (): Promise<Compte> => req("/pont/v1/compte"),
  accepterConditions: (): Promise<Compte> => req("/pont/v1/conditions", { method: "POST" }),
  nouvelleCle: (): Promise<{ cle: string; prefixe: string; avertissement: string }> =>
    req("/pont/v1/cle", { method: "POST" }),
  connecterWhatsApp: () => req("/pont/v1/whatsapp/connexion", { method: "POST" }),
  /**
   * Récupère le QR et en fait une URL d'objet locale.
   *
   * Une balise `<img src="…">` ne peut pas porter d'en-tête `Authorization` :
   * le navigateur demanderait l'image sans jeton et recevrait un 401, ne
   * laissant que le texte alternatif. On récupère donc l'image par `fetch`,
   * authentifiée comme le reste, puis on l'affiche depuis la mémoire.
   */
  qrBlob: async (): Promise<string> => {
    const res: Response = await req("/pont/v1/whatsapp/qr");
    return URL.createObjectURL(await res.blob());
  },
};

/** Ce que le blocage veut dire, en français, pour la personne qui le lit. */
export const EXPLICATION_BLOCAGE: Record<string, string> = {
  "conditions-non-acceptees": "Acceptez les conditions d'utilisation pour continuer.",
  "compte-non-valide": "Votre compte attend notre validation. Vous pouvez déjà tout préparer.",
  "compte-suspendu": "Votre compte a été suspendu. Écrivez-nous pour en connaître la raison.",
  "aucune-cle": "Générez une clé d'API pour commencer à émettre.",
};
