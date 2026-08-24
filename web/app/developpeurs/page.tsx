"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { pont, poserJeton } from "@/lib/pont";

/*
  Porte d'entrée du pont. Un service distinct de l'assistant : on n'y vend pas
  de réponses automatiques, et le développeur qui arrive ici ne cherche pas un
  chatbot. La page dit donc d'abord ce que le pont fait et ce qu'il ne fait pas,
  parce qu'un développeur qui découvre les limites en production revient fâché.
*/
const CE_QUE_CA_FAIT = [
  "Envoyer un message depuis VOTRE numéro WhatsApp, par un appel HTTP",
  "Confirmer un paiement, une inscription, une commande",
  "Envoyer un code de vérification à usage unique",
];

const CE_QUE_CA_NE_FAIT_PAS = [
  "Aucune réponse automatique : le pont n'est pas l'assistant Wapy",
  "Aucune diffusion : chaque destinataire doit avoir accepté d'être contacté",
  "Aucun message vers un destinataire qui a répondu « STOP »",
];

export default function PageDeveloppeurs() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("inscription");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setEnvoi(true);
    try {
      const r =
        mode === "inscription"
          ? await pont.inscription(nom, email, motDePasse)
          : await pont.connexion(email, motDePasse);
      poserJeton(r.token);
      router.push("/developpeurs/console");
    } catch (e: any) {
      setErr(e.message || "Impossible de continuer.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader lienSecondaire={{ href: "/tarifs", libelle: "Tarifs" }} />

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2 md:py-16">
        <section>
          <span className="pill bg-brand-soft text-brand">Pont WhatsApp</span>
          <h1 className="mt-4 font-display text-[2rem] font-bold leading-[1.15] md:text-[2.6rem]">
            Envoyez un message WhatsApp <span className="text-brand">depuis votre application</span>
          </h1>
          <p className="mt-4 text-muted">
            Un appel HTTP, et le message part de votre propre numéro. Reçu de paiement, code de
            vérification, confirmation d&apos;inscription. Gratuit, sur validation.
          </p>

          <div className="mt-8 rounded-xl2 border border-line bg-surface p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              Ce que fait le pont
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {CE_QUE_CA_FAIT.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true" className="text-emerald">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <h2 className="mt-5 font-display text-sm font-bold uppercase tracking-wide text-muted">
              Ce qu&apos;il ne fait pas
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {CE_QUE_CA_NE_FAIT_PAS.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-sm text-muted">
            Les règles complètes sont dans les{" "}
            <Link href="/developpeurs/conditions" className="text-brand underline">
              conditions d&apos;utilisation
            </Link>
            . Vous devrez les accepter avant d&apos;obtenir une clé.
          </p>
        </section>

        <section>
          <div className="rounded-xl2 border border-line bg-surface p-6 shadow-lift">
            <div className="flex gap-2">
              {(["inscription", "connexion"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setErr("");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    mode === m ? "bg-brand text-white" : "bg-cream text-muted hover:text-ink"
                  }`}
                >
                  {m === "inscription" ? "Créer un compte" : "Se connecter"}
                </button>
              ))}
            </div>

            <form onSubmit={soumettre} className="mt-5 space-y-3">
              {mode === "inscription" && (
                <label className="block text-sm">
                  <span className="text-muted">Nom de votre application</span>
                  <input
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2"
                    placeholder="Gestion scolaire Étoile"
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="text-muted">Adresse électronique</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2"
                  placeholder="dev@monapp.bj"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Mot de passe</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2"
                  placeholder="8 caractères au minimum"
                />
              </label>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <button type="submit" disabled={envoi} className="btn w-full">
                {envoi ? "Un instant…" : mode === "inscription" ? "Créer mon compte" : "Se connecter"}
              </button>
            </form>

            <p className="mt-4 text-xs text-muted">
              L&apos;inscription est libre. L&apos;émission de messages, elle, attend notre
              validation : vous pouvez préparer toute votre intégration entre-temps.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
