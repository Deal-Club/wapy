"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, clearToken } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [status, setStatus] = useState("…");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api.waStatus().then((s) => setStatus(s.status)).catch(() => setStatus("inconnu"));
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Wapy — Tableau de bord</h1>
        <button className="btn-ghost" onClick={logout}>Déconnexion</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold">WhatsApp</h2>
          <p className="text-sm text-gray-600">Statut : <span className="font-medium">{status}</span></p>
          <Link href="/onboarding" className="mt-3 inline-block text-sm text-brand hover:underline">Reconnecter / reconfigurer</Link>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Configuration</h2>
          <p className="text-sm text-gray-600">Éditez la fiche (infos, menu, FAQ, consignes).</p>
          <Link href="/onboarding" className="mt-3 inline-block text-sm text-brand hover:underline">Modifier la fiche</Link>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-400">Conversations, handoff web et usage arrivent bientôt (Phase 3).</p>
    </main>
  );
}
