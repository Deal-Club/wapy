"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Indicatifs courants (Bénin en tête). L'utilisateur peut chercher son pays.
const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "229", name: "Bénin", flag: "🇧🇯" },
  { code: "228", name: "Togo", flag: "🇹🇬" },
  { code: "225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "227", name: "Niger", flag: "🇳🇪" },
  { code: "223", name: "Mali", flag: "🇲🇱" },
  { code: "221", name: "Sénégal", flag: "🇸🇳" },
  { code: "233", name: "Ghana", flag: "🇬🇭" },
  { code: "234", name: "Nigeria", flag: "🇳🇬" },
  { code: "237", name: "Cameroun", flag: "🇨🇲" },
  { code: "241", name: "Gabon", flag: "🇬🇦" },
  { code: "242", name: "Congo", flag: "🇨🇬" },
  { code: "243", name: "RD Congo", flag: "🇨🇩" },
  { code: "212", name: "Maroc", flag: "🇲🇦" },
  { code: "216", name: "Tunisie", flag: "🇹🇳" },
  { code: "213", name: "Algérie", flag: "🇩🇿" },
  { code: "33", name: "France", flag: "🇫🇷" },
  { code: "32", name: "Belgique", flag: "🇧🇪" },
  { code: "41", name: "Suisse", flag: "🇨🇭" },
  { code: "1", name: "USA / Canada", flag: "🇺🇸" },
  { code: "44", name: "Royaume-Uni", flag: "🇬🇧" },
];

export default function StaffAlertVerify() {
  const [dialcode, setDialcode] = useState("229");
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [current, setCurrent] = useState("");
  const [masked, setMasked] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    api.getConfig().then((c) => setCurrent(c.staff_numbers || "")).catch(() => {});
  }, []);

  async function sendCode() {
    setBusy(true); setMsg(""); setOk("");
    try {
      const r = await api.staffVerifyStart(number, dialcode);
      setMasked(r.masked || "");
      setStep("code");
    } catch (e: any) {
      setMsg(e.message || "Échec de l'envoi du code.");
    } finally { setBusy(false); }
  }

  async function confirm() {
    setBusy(true); setMsg(""); setOk("");
    try {
      const r = await api.staffVerifyConfirm(code);
      setCurrent(r.staff_numbers || "");
      setOk("Numéro vérifié ! Le responsable recevra les alertes. ✅");
      setStep("idle"); setNumber(""); setCode("");
    } catch (e: any) {
      setMsg(e.message || "Code incorrect.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="label">Numéro d'alerte du responsable</div>
        <p className="text-xs text-muted">
          Le responsable reçoit une alerte WhatsApp quand un client a besoin d'un humain.
          On envoie un code pour confirmer que le numéro reçoit bien.
        </p>
      </div>

      {current && (
        <div className="rounded-xl border border-emerald/40 bg-emerald-soft/40 px-3 py-2 text-sm">
          ✅ Numéro vérifié actuel : <b>+{current.split(",")[0].replace(/@.*/, "")}</b>
        </div>
      )}

      {step === "idle" ? (
        <>
          <div className="flex gap-2">
            <select
              className="input max-w-[150px]"
              value={dialcode}
              onChange={(e) => setDialcode(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code + c.name} value={c.code}>
                  {c.flag} +{c.code}
                </option>
              ))}
            </select>
            <input
              className="input flex-1"
              inputMode="tel"
              placeholder="Numéro du responsable"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <button className="btn w-full" onClick={sendCode} disabled={busy || !number.trim()}>
            {busy ? "…" : current ? "Changer le numéro (recevoir un code)" : "Envoyer le code de vérification"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Un code à 4 chiffres a été envoyé sur WhatsApp au <b>{masked}</b>.
            Demandez-le au responsable et saisissez-le ici.
          </p>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-center text-lg tracking-[0.4em]"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <button className="btn" onClick={confirm} disabled={busy || code.length < 4}>
              {busy ? "…" : "Vérifier"}
            </button>
          </div>
          <button className="btn-ghost text-xs" onClick={() => { setStep("idle"); setMsg(""); }}>
            ← Modifier le numéro
          </button>
        </>
      )}

      {ok && <p className="text-sm text-emerald-dark">{ok}</p>}
      {msg && <p className="text-sm text-brand">{msg}</p>}
    </div>
  );
}
