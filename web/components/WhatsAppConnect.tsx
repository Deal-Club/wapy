"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export default function WhatsAppConnect({ onConnected }: { onConnected?: () => void }) {
  const [status, setStatus] = useState("");
  const [qr, setQr] = useState("");
  const [phase, setPhase] = useState<"idle" | "connecting" | "connected">("idle");
  const [err, setErr] = useState("");
  const timer = useRef<any>(null);

  useEffect(() => {
    api.waStatus().then((s) => {
      setStatus(s.status);
      if (s.status === "WORKING") setPhase("connected");
    }).catch(() => {});
  }, []);

  async function connect() {
    setErr("");
    try {
      await api.waConnect();
      setPhase("connecting");
    } catch (e: any) {
      setErr(e.message || "Connexion impossible");
    }
  }
  async function disconnect() {
    await api.waLogout().catch(() => {});
    setPhase("idle");
    setStatus("STOPPED");
    setQr("");
  }

  useEffect(() => {
    if (phase !== "connecting") return;
    async function tick() {
      try {
        const s = await api.waStatus();
        setStatus(s.status);
        if (s.status === "WORKING") {
          clearInterval(timer.current);
          setPhase("connected");
          onConnected?.();
          return;
        }
        if (s.status === "SCAN_QR_CODE") setQr(await api.waQrBlobUrl());
      } catch {}
    }
    tick();
    timer.current = setInterval(tick, 4000);
    return () => clearInterval(timer.current);
  }, [phase, onConnected]);

  return (
    <div className="space-y-4 text-center">
      {phase === "connected" ? (
        <div className="rounded-xl2 border border-emerald/30 bg-emerald-soft p-6">
          <div className="text-4xl">✅</div>
          <p className="mt-2 font-display text-xl text-emerald-dark">WhatsApp connecté</p>
          <p className="mt-1 text-sm text-muted">Statut : {status}</p>
          <button className="btn-ghost mt-4 text-sm" onClick={disconnect}>Déconnecter ce numéro</button>
        </div>
      ) : phase === "connecting" ? (
        <>
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl2 border-4 border-brand/70 bg-white p-2">
            {qr ? <img src={qr} alt="QR WhatsApp" className="h-full w-full" /> : <span className="text-muted">Génération du QR…</span>}
          </div>
          <p className="text-sm text-muted">
            Sur le téléphone : WhatsApp → Réglages → Appareils liés → Lier un appareil. Statut : <b>{status || "démarrage"}</b>
          </p>
          <button className="btn-ghost text-sm" onClick={disconnect}>Annuler</button>
        </>
      ) : (
        <>
          <p className="text-muted">Connectez le WhatsApp de l&apos;établissement. Vous pourrez le changer à tout moment.</p>
          <button className="btn-emerald" onClick={connect}>Générer le QR code</button>
        </>
      )}
      {err && <p className="text-sm text-brand">{err}</p>}
    </div>
  );
}
