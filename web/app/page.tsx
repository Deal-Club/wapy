"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? "/onboarding" : "/signup");
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Chargement…</p>
    </main>
  );
}
