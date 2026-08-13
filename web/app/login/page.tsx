"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, getToken } from "@/lib/api";
import InstallPrompt from "@/components/InstallPrompt";
import WapyMarque from "@/components/WapyMarque";
import PanneauAuth from "@/components/gabarit/PanneauAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Déjà connecté (ex. retour arrière) -> on renvoie au tableau de bord.
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api.login(email, password);
      setToken(r.token);
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Même trame que le haut des pages publiques : on reste sur le site,
          pas dans une application détachée. */}
      <div
        aria-hidden="true"
        className="decor-points pointer-events-none absolute inset-0 hidden md:block"
      />

      <div className="relative mx-auto grid min-h-screen max-w-5xl items-center gap-16 px-4 py-10 lg:grid-cols-2">
        <PanneauAuth
          titre="Le tableau de bord de votre assistant"
          texte="Vos conversations, votre fiche et votre carnet de demandes, au même endroit que la connexion WhatsApp."
        />

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <InstallPrompt />

          {/* La marque n'est visible qu'ici sous `lg`, le panneau de gauche
              étant masqué : sans elle, la page de connexion ne porterait aucun
              retour vers le site. */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 font-display text-2xl font-bold text-brand lg:hidden"
          >
            <WapyMarque className="h-7 w-7" />
            Wapy
          </Link>

          <div className="rounded-xl2 border border-line bg-surface p-7 shadow-lift">
            <h1 className="font-display text-2xl font-bold">Connexion</h1>
            <p className="mt-1.5 text-sm text-muted">Accédez au tableau de bord de votre assistant.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {err && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {err}
                </p>
              )}
              <button className="btn w-full" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>

            <p className="mt-5 border-t border-line pt-5 text-center text-sm text-muted">
              Pas de compte ?{" "}
              <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
