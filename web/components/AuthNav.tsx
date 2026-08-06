"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/api";

// Landing = composant serveur : ce petit bloc client adapte les boutons selon
// l'état de connexion (token en localStorage), pour ne pas redemander de se
// connecter à quelqu'un déjà connecté.
export default function AuthNav() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => setAuthed(!!getToken()), []);

  if (authed === null) {
    // évite le flash : réserve la place le temps de lire le token
    return <div className="h-9 w-40" aria-hidden />;
  }
  if (authed) {
    return (
      <Link href="/dashboard" className="btn text-sm">
        Mon espace
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="btn-ghost text-sm">Se connecter</Link>
      <Link href="/signup" className="btn text-sm">Commencer</Link>
    </>
  );
}
