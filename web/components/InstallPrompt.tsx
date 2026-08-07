"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      if (standalone || localStorage.getItem("wapy_install_dismissed")) return;
      const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
      window.addEventListener("beforeinstallprompt", onPrompt);
      window.addEventListener("appinstalled", () => setDeferred(null));
      const ua = navigator.userAgent || "";
      const isIOS = /iphone|ipad|ipod/i.test(ua) || (/(mac)/i.test(ua) && "ontouchend" in document);
      const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua);
      if (isIOS && isSafari) setIos(true);
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    } catch { /* noop */ }
  }, []);

  function close() {
    setDismissed(true);
    try { localStorage.setItem("wapy_install_dismissed", "1"); } catch {}
  }
  if (dismissed || (!deferred && !ios)) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand/30 bg-brand-soft/60 px-4 py-3 text-sm">
      {deferred ? (
        <>
          <span>📲 Installez <b>Wapy</b> sur votre téléphone pour un accès en un tap, plein écran.</span>
          <span className="flex items-center gap-2">
            <button className="btn text-xs" onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null); }}>
              Installer l'app
            </button>
            <button className="btn-ghost text-xs" onClick={close}>Plus tard</button>
          </span>
        </>
      ) : (
        <>
          <span>📲 Pour installer <b>Wapy</b> : appuyez sur <b>Partager</b> puis « <b>Sur l'écran d'accueil</b> ».</span>
          <button className="btn-ghost text-xs" onClick={close}>OK</button>
        </>
      )}
    </div>
  );
}
