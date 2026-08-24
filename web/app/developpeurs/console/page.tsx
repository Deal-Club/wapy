"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { pont, jeton, oublierJeton, EXPLICATION_BLOCAGE, type Compte } from "@/lib/pont";

/*
  Console du développeur. Trois verrous à lever, dans l'ordre : accepter les
  conditions, connecter un numéro, obtenir une clé. L'écran les présente dans cet
  ordre et n'ouvre l'étape suivante qu'une fois la précédente franchie — un
  développeur qui obtiendrait une clé avant d'avoir accepté les règles ne les
  lirait jamais.
*/
const ETATS_CONNECTE = ["WORKING"];

export default function ConsoleDeveloppeur() {
  const router = useRouter();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [cle, setCle] = useState("");
  const [qr, setQr] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState(false);

  async function rafraichir() {
    try {
      setCompte(await pont.compte());
    } catch {
      oublierJeton();
      router.push("/developpeurs");
    }
  }

  useEffect(() => {
    if (!jeton()) {
      router.push("/developpeurs");
      return;
    }
    rafraichir();
    // Le statut WhatsApp bouge pendant le scan du QR : on suit sans faire
    // recharger la page à la main.
    const t = setInterval(rafraichir, 5000);
    return () => clearInterval(t);
  }, []);

  async function agir(action: () => Promise<unknown>) {
    setErr("");
    setOccupe(true);
    try {
      await action();
      await rafraichir();
    } catch (e: any) {
      setErr(e.message || "Action impossible.");
    } finally {
      setOccupe(false);
    }
  }

  if (!compte) {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-muted">Chargement…</main>
      </div>
    );
  }

  const connecte = ETATS_CONNECTE.includes(compte.whatsapp);

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader lienSecondaire={{ href: "/developpeurs/conditions", libelle: "Conditions" }} />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">{compte.nom}</h1>
          <button
            onClick={() => {
              oublierJeton();
              router.push("/developpeurs");
            }}
            className="text-sm text-muted hover:text-ink"
          >
            Se déconnecter
          </button>
        </div>

        {/* État global, en premier : la question du développeur est « est-ce que
            ça marche », et la réponse doit être visible sans faire défiler. */}
        <div
          className={`mt-5 rounded-xl2 border p-4 ${
            compte.peut_emettre
              ? "border-emerald/40 bg-emerald/10"
              : "border-line bg-surface"
          }`}
        >
          <p className="font-display font-bold">
            {compte.peut_emettre ? "Votre pont est actif" : "Votre pont n'émet pas encore"}
          </p>
          {!compte.peut_emettre && (
            <p className="mt-1 text-sm text-muted">
              {EXPLICATION_BLOCAGE[compte.blocage] || compte.blocage}
            </p>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {/* 1. Conditions */}
        <section className="mt-6 rounded-xl2 border border-line bg-surface p-5">
          <h2 className="font-display font-bold">1. Conditions d&apos;utilisation</h2>
          {compte.conditions_acceptees ? (
            <p className="mt-2 text-sm text-muted">
              Acceptées, version {compte.conditions_version}.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                À lire avant tout le reste : elles décrivent ce que vous vous engagez à ne pas
                envoyer, et ce qui fait suspendre un compte.{" "}
                <Link href="/developpeurs/conditions" className="text-brand underline">
                  Lire les conditions
                </Link>
              </p>
              <button
                disabled={occupe}
                onClick={() => agir(pont.accepterConditions)}
                className="btn mt-4"
              >
                J&apos;accepte les conditions
              </button>
            </>
          )}
        </section>

        {/* 2. Numéro WhatsApp */}
        <section
          className={`mt-4 rounded-xl2 border border-line bg-surface p-5 ${
            compte.conditions_acceptees ? "" : "pointer-events-none opacity-50"
          }`}
        >
          <h2 className="font-display font-bold">2. Votre numéro WhatsApp</h2>
          <p className="mt-2 text-sm text-muted">
            Utilisez un numéro <strong>dédié aux notifications</strong>, différent de celui avec
            lequel vous discutez au quotidien. Les messages sortants exposent un numéro à des
            restrictions&nbsp;: mieux vaut que ce ne soit pas votre ligne principale.
          </p>
          <p className="mt-2 text-sm">
            État : <span className="font-semibold">{connecte ? "connecté" : compte.whatsapp}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              disabled={occupe}
              onClick={() =>
                agir(async () => {
                  await pont.connecterWhatsApp();
                  setQr(`${pont.qrUrl()}?t=${Date.now()}`);
                })
              }
              className="btn-ghost"
            >
              {connecte ? "Reconnecter un autre numéro" : "Connecter mon numéro"}
            </button>
          </div>
          {qr && !connecte && (
            <div className="mt-4">
              <p className="text-sm text-muted">
                Scannez ce code depuis WhatsApp → Appareils connectés.
              </p>
              {/* Image servie par l'API, pas par next/image : elle change à chaque
                  tentative et n'a pas à être optimisée ni mise en cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR de connexion WhatsApp" className="mt-3 h-56 w-56" />
            </div>
          )}
        </section>

        {/* 3. Clé d'API */}
        <section
          className={`mt-4 rounded-xl2 border border-line bg-surface p-5 ${
            compte.conditions_acceptees ? "" : "pointer-events-none opacity-50"
          }`}
        >
          <h2 className="font-display font-bold">3. Votre clé d&apos;API</h2>
          <p className="mt-2 text-sm text-muted">
            {compte.cle_prefixe
              ? `Clé active : ${compte.cle_prefixe}…`
              : "Aucune clé émise pour l'instant."}
          </p>
          <button
            disabled={occupe}
            onClick={() => agir(async () => setCle((await pont.nouvelleCle()).cle))}
            className="btn-ghost mt-4"
          >
            {compte.cle_prefixe ? "Remplacer la clé" : "Générer une clé"}
          </button>
          {cle && (
            <div className="mt-4 rounded-lg border border-brand/40 bg-brand-soft p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand">
                Notez-la maintenant : elle ne sera plus jamais affichée
              </p>
              <code className="mt-2 block break-all font-mono text-sm">{cle}</code>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            Nous n&apos;en gardons que l&apos;empreinte. Perdue, elle se remplace ; elle ne se
            retrouve pas. Remplacer une clé coupe immédiatement la précédente.
          </p>
        </section>

        <section className="mt-4 rounded-xl2 border border-line bg-surface p-5">
          <h2 className="font-display font-bold">Vos limites</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>Un intervalle minimal entre deux envois : les rafales sont refusées.</li>
            <li>Deux codes de vérification par heure et par destinataire.</li>
            <li>Un plafond horaire et journalier par compte.</li>
            <li>
              Un en-tête <code className="font-mono">Idempotency-Key</code> obligatoire : rejouer
              une requête ne renvoie jamais un second message.
            </li>
            <li>Un destinataire ayant répondu « STOP » n&apos;est plus joignable.</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            Le détail des points d&apos;entrée est dans les{" "}
            <Link href="/developpeurs/conditions" className="text-brand underline">
              conditions
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
