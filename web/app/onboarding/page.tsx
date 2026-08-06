"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import ConfigEditor, { Config, emptyConfig } from "@/components/ConfigEditor";
import SectorPicker from "@/components/SectorPicker";
import WhatsAppConnect from "@/components/WhatsAppConnect";

const STEPS = ["Activité", "Configuration", "WhatsApp"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<Config>(emptyConfig());
  const [staff, setStaff] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/signup");
      return;
    }
    api.getConfig().then((c) => {
      setConfig({ ...emptyConfig(), ...c });
      setStaff(c.staff_numbers || "");
    }).catch(() => {});
  }, [router]);

  async function saveConfig() {
    setSaving(true);
    try {
      await api.putConfig({ ...config, staff_numbers: staff });
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center rise">
        <div className="mb-1 font-display text-3xl font-semibold text-brand">Wapy</div>
        <p className="text-muted">Mettons votre assistant en route</p>
      </header>

      <Stepper step={step} />

      <div className="mt-8 rise">
        {step === 0 && (
          <div className="card space-y-5">
            <h2 className="text-2xl">Parlez-nous de votre activité</h2>
            <div>
              <label className="label">Secteur d&apos;activité</label>
              <SectorPicker value={config.sector} onChange={(v) => setConfig({ ...config, sector: v })} />
            </div>
            <div>
              <label className="label">Décrivez votre établissement</label>
              <textarea
                className="input min-h-[110px]"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Ex : Maquis à Cotonou (Fidjrossè), cuisine béninoise, poulet & poisson braisés, ambiance conviviale, ouvert 11h-23h…"
              />
              <p className="mt-1 text-xs text-muted">Plus c&apos;est précis, mieux l&apos;IA remplira votre configuration.</p>
            </div>
            <div className="flex justify-end">
              <button className="btn" onClick={() => setStep(1)} disabled={!config.sector.trim()}>Continuer →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Votre configuration</h2>
              <button className="text-sm text-muted hover:text-brand" onClick={() => setStep(0)}>← retour</button>
            </div>
            <ConfigEditor value={config} onChange={setConfig} staff={staff} onStaffChange={setStaff} />
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button className="btn" onClick={saveConfig} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer et continuer →"}</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-center text-2xl">Connectez votre WhatsApp</h2>
            <WhatsAppConnect onConnected={() => setStep(3)} />
            <div className="flex justify-between">
              <button className="text-sm text-muted hover:text-brand" onClick={() => setStep(1)}>← configuration</button>
              <button className="text-sm text-muted hover:text-brand" onClick={() => router.push("/dashboard")}>Passer →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-4 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl">Votre assistant est en ligne</h2>
            <p className="text-muted">Envoyez un message au WhatsApp de l&apos;établissement depuis un autre téléphone pour voir Wapy répondre.</p>
            <div><button className="btn" onClick={() => router.push("/dashboard")}>Aller au tableau de bord</button></div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((l, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={l} className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${done ? "bg-emerald text-white" : active ? "bg-brand text-white shadow-lift" : "border border-line bg-surface text-muted"}`}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`hidden text-sm sm:inline ${active ? "font-semibold text-brand" : "text-muted"}`}>{l}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-line" />}
          </div>
        );
      })}
    </div>
  );
}
