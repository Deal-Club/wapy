"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";

type MenuRow = { categorie: string; plat: string; prix: string };
type FaqRow = { question: string; reponse: string };

function Stepper({ step }: { step: number }) {
  const labels = ["Votre restaurant", "Connexion WhatsApp", "C'est prêt"];
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={l} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                done ? "bg-green-500 text-white" : active ? "bg-brand text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span className={`hidden text-sm sm:inline ${active ? "font-semibold text-brand" : "text-gray-500"}`}>{l}</span>
            {n < 3 && <div className="h-px w-6 bg-gray-300" />}
          </div>
        );
      })}
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!getToken()) router.replace("/signup");
  }, [router]);

  return (
    <main className="mx-auto max-w-2xl p-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-brand">Wapy</h1>
        <p className="text-gray-600">Configurons votre assistant en 3 étapes</p>
      </div>
      <Stepper step={step} />
      {step === 1 && <StepConfig onNext={() => setStep(2)} />}
      {step === 2 && <StepWhatsApp onNext={() => setStep(3)} />}
      {step === 3 && <StepDone onFinish={() => router.push("/dashboard")} />}
    </main>
  );
}

function StepConfig({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<"form" | "import">("form");
  const [horaires, setHoraires] = useState("");
  const [adresse, setAdresse] = useState("");
  const [repere, setRepere] = useState("");
  const [telephone, setTelephone] = useState("");
  const [paiement, setPaiement] = useState("");
  const [consigneResa, setConsigneResa] = useState("Transmettez la demande au responsable.");
  const [menu, setMenu] = useState<MenuRow[]>([{ categorie: "Plat", plat: "", prix: "" }]);
  const [faq, setFaq] = useState<FaqRow[]>([{ question: "", reponse: "" }]);
  const [staff, setStaff] = useState("");
  const [importInfo, setImportInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    try {
      const r = await api.importXlsx(file);
      setImportInfo(`Importé : ${r.counts.infos} infos, ${r.counts.menu} plats, ${r.counts.faq} questions.`);
    } catch (e: any) {
      setErr(e.message || "Import impossible");
    }
  }

  async function save() {
    setErr("");
    setSaving(true);
    try {
      if (mode === "form") {
        const infos = [
          { rubrique: "Horaires", contenu: horaires },
          { rubrique: "Adresse", contenu: adresse },
          { rubrique: "Repère / Accès", contenu: repere },
          { rubrique: "Téléphone / WhatsApp", contenu: telephone },
          { rubrique: "Moyens de paiement", contenu: paiement },
          { rubrique: "Consigne : réservations", contenu: consigneResa },
        ].filter((i) => i.contenu.trim());
        await api.putConfig({
          infos,
          menu: menu.filter((m) => m.plat.trim()),
          faq: faq.filter((f) => f.question.trim()),
          staff_numbers: staff.trim(),
        });
      } else {
        if (staff.trim()) await api.putSettings({ staff_numbers: staff.trim() });
      }
      onNext();
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-5">
      <div className="flex gap-2">
        <button className={mode === "form" ? "btn flex-1" : "btn-ghost flex-1"} onClick={() => setMode("form")}>
          Remplir un formulaire
        </button>
        <button className={mode === "import" ? "btn flex-1" : "btn-ghost flex-1"} onClick={() => setMode("import")}>
          Importer un Excel
        </button>
      </div>

      {mode === "form" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Horaires</label><input className="input" value={horaires} onChange={(e) => setHoraires(e.target.value)} placeholder="Tous les jours 11h-23h" /></div>
            <div><label className="label">Téléphone / WhatsApp</label><input className="input" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+229 ..." /></div>
            <div><label className="label">Adresse</label><input className="input" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Quartier, ville" /></div>
            <div><label className="label">Repère / Accès</label><input className="input" value={repere} onChange={(e) => setRepere(e.target.value)} placeholder="En face de ..." /></div>
            <div className="sm:col-span-2"><label className="label">Moyens de paiement</label><input className="input" value={paiement} onChange={(e) => setPaiement(e.target.value)} placeholder="Espèces, MTN MoMo, Moov Money, carte" /></div>
            <div className="sm:col-span-2"><label className="label">Consigne : réservations</label><input className="input" value={consigneResa} onChange={(e) => setConsigneResa(e.target.value)} /></div>
          </div>

          <div>
            <label className="label">Menu</label>
            <div className="space-y-2">
              {menu.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input w-32" value={m.categorie} onChange={(e) => setMenu(menu.map((x, j) => (j === i ? { ...x, categorie: e.target.value } : x)))} placeholder="Catégorie" />
                  <input className="input flex-1" value={m.plat} onChange={(e) => setMenu(menu.map((x, j) => (j === i ? { ...x, plat: e.target.value } : x)))} placeholder="Plat" />
                  <input className="input w-28" value={m.prix} onChange={(e) => setMenu(menu.map((x, j) => (j === i ? { ...x, prix: e.target.value } : x)))} placeholder="Prix" />
                  <button className="btn-ghost px-3" onClick={() => setMenu(menu.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
            <button className="mt-2 text-sm text-brand hover:underline" onClick={() => setMenu([...menu, { categorie: "Plat", plat: "", prix: "" }])}>+ Ajouter un plat</button>
          </div>

          <div>
            <label className="label">Questions fréquentes</label>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" value={f.question} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} placeholder="Question" />
                  <input className="input flex-1" value={f.reponse} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)))} placeholder="Réponse" />
                  <button className="btn-ghost px-3" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
            <button className="mt-2 text-sm text-brand hover:underline" onClick={() => setFaq([...faq, { question: "", reponse: "" }])}>+ Ajouter une question</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Téléchargez le modèle, remplissez-le, puis importez-le.</p>
          <a className="btn-ghost" href={api.templateUrl()}>⬇️ Télécharger le modèle Excel</a>
          <div>
            <label className="label">Importer le fichier rempli</label>
            <input type="file" accept=".xlsx" onChange={onImport} className="block w-full text-sm" />
          </div>
          {importInfo && <p className="text-sm text-green-700">{importInfo}</p>}
        </div>
      )}

      <div>
        <label className="label">Numéro WhatsApp du responsable (pour les escalades)</label>
        <input className="input" value={staff} onChange={(e) => setStaff(e.target.value)} placeholder="22961040461@c.us" />
        <p className="mt-1 text-xs text-gray-500">Format WhatsApp : indicatif + numéro + « @c.us »</p>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className="btn w-full" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Continuer"}</button>
    </div>
  );
}

function StepWhatsApp({ onNext }: { onNext: () => void }) {
  const [status, setStatus] = useState("");
  const [qr, setQr] = useState("");
  const [started, setStarted] = useState(false);
  const [err, setErr] = useState("");
  const timer = useRef<any>(null);

  async function connect() {
    setErr("");
    try {
      await api.waConnect();
      setStarted(true);
    } catch (e: any) {
      setErr(e.message || "Connexion impossible");
    }
  }

  useEffect(() => {
    if (!started) return;
    async function tick() {
      try {
        const s = await api.waStatus();
        setStatus(s.status);
        if (s.status === "WORKING") {
          clearInterval(timer.current);
          setTimeout(onNext, 800);
          return;
        }
        if (s.status === "SCAN_QR_CODE") {
          const url = await api.waQrBlobUrl();
          setQr(url);
        }
      } catch {}
    }
    tick();
    timer.current = setInterval(tick, 4000);
    return () => clearInterval(timer.current);
  }, [started, onNext]);

  return (
    <div className="card space-y-4 text-center">
      <h2 className="text-lg font-semibold">Connectez le WhatsApp du restaurant</h2>
      {!started ? (
        <>
          <p className="text-gray-600">Cliquez, puis scannez le QR avec le téléphone du restaurant (WhatsApp → Appareils liés → Lier un appareil).</p>
          <button className="btn" onClick={connect}>Générer le QR code</button>
        </>
      ) : status === "WORKING" ? (
        <p className="text-green-700">✅ Connecté ! Redirection…</p>
      ) : (
        <>
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border-8 border-brand bg-white">
            {qr ? <img src={qr} alt="QR WhatsApp" className="h-full w-full" /> : <span className="text-gray-400">Génération du QR…</span>}
          </div>
          <p className="text-sm text-gray-500">Statut : {status || "démarrage…"} — le QR se rafraîchit tout seul.</p>
        </>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="card space-y-4 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-semibold">Votre assistant est en ligne !</h2>
      <p className="text-gray-600">Envoyez un message au WhatsApp du restaurant depuis un autre téléphone pour voir Wapy répondre.</p>
      <button className="btn" onClick={onFinish}>Aller au tableau de bord</button>
    </div>
  );
}
