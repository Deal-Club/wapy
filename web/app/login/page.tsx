"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, getToken } from "@/lib/api";
import InstallPrompt from "@/components/InstallPrompt";

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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <InstallPrompt />
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-brand">Wapy</h1>
          <p className="mt-1 text-gray-600">Connexion</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn w-full" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          <p className="text-center text-sm text-gray-600">
            Pas de compte ? <Link href="/signup" className="text-brand hover:underline">Créer un compte</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
