"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken, getToken } from "@/lib/api";
import WapyMarque from "@/components/WapyMarque";

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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-brand">
            <WapyMarque className="h-8 w-8" />
            Wapy
          </h1>
          <p className="mt-1 text-gray-600">Créez le compte de votre restaurant</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
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
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn w-full" disabled={loading}>
            {loading ? "Création…" : "Créer mon compte"}
          </button>
          <p className="text-center text-sm text-gray-600">
            Déjà un compte ? <Link href="/login" className="text-brand hover:underline">Se connecter</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
