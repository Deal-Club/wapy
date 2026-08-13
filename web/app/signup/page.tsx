"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, getToken } from "@/lib/api";
import WapyMarque from "@/components/WapyMarque";
import PanneauAuth from "@/components/gabarit/PanneauAuth";

export default function SignupPage() {
  const router = useRouter();
  const [resto, setResto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api.signup(email, password, resto);
      setToken(r.token);
      router.replace("/onboarding");
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="decor-points pointer-events-none absolute inset-0 hidden md:block"
      />

      <div className="relative mx-auto grid min-h-screen max-w-5xl items-center gap-16 px-4 py-10 lg:grid-cols-2">
        {/* Aucune durée annoncée : rien ne la mesure, et « prêt en 5 minutes »
            a été retiré du reste du site pour cette raison. */}
        <PanneauAuth
          titre="Votre assistant WhatsApp, sur le numéro que vous utilisez déjà"
          texte="Vous décrivez votre activité, vous relisez la fiche que l'IA propose, puis vous scannez un QR code. L'assistant répond ensuite sur votre numéro habituel."
        />

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 font-display text-2xl font-bold text-brand lg:hidden"
          >
            <WapyMarque className="h-7 w-7" />
            Wapy
          </Link>

          <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
            <h1 className="font-display text-2xl font-bold">Créer mon assistant</h1>
            {/* « votre restaurant » a été corrigé en « votre établissement » :
                le produit s'adresse à tous les métiers, et onze guides le
                disent sur le reste du site. */}
            <p className="mt-1.5 text-sm text-muted">
              Le compte de votre établissement, quel que soit votre métier.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Nom de l&apos;établissement</label>
                <input className="input" value={resto} onChange={(e) => setResto(e.target.value)} required placeholder="Le Maquis du Bonheur" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <p className="mt-1.5 text-xs text-muted">Six caractères au minimum.</p>
              </div>
              {err && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {err}
                </p>
              )}
              <button className="btn w-full" disabled={loading}>
                {loading ? "Création…" : "Créer mon compte"}
              </button>
            </form>

            <p className="mt-5 border-t border-line pt-5 text-center text-sm text-muted">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
