"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, clearToken } from "@/lib/api";

type Tab = "conversations" | "whatsapp" | "usage";

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversations");

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <main className="mx-auto max-w-5xl p-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Wapy</h1>
        <div className="flex items-center gap-2">
          <Link href="/onboarding" className="btn-ghost text-sm">Configuration</Link>
          <button className="btn-ghost text-sm" onClick={logout}>Déconnexion</button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {(["conversations", "whatsapp", "usage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-brand text-brand" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "whatsapp" ? "WhatsApp" : t === "usage" ? "Usage" : "Conversations"}
          </button>
        ))}
      </div>

      {tab === "conversations" && <Conversations />}
      {tab === "whatsapp" && <WhatsAppTab />}
      {tab === "usage" && <UsageTab />}
    </main>
  );
}

function Conversations() {
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await api.getConversations();
      setConvs(r.conversations);
    } catch {}
    setLoading(false);
  }
  async function openThread(cid: string) {
    setActive(cid);
    const t = await api.getThread(cid);
    setThread(t);
  }
  useEffect(() => {
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, []);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    await api.handoffReply(active, reply.trim());
    setReply("");
    openThread(active);
  }
  async function close() {
    if (!active) return;
    await api.handoffClose(active);
    openThread(active);
    load();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card md:col-span-1 max-h-[70vh] overflow-auto p-3">
        {loading ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : convs.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune conversation pour l&apos;instant.</p>
        ) : (
          convs.map((c) => (
            <button
              key={c.chat_id}
              onClick={() => openThread(c.chat_id)}
              className={`mb-1 block w-full rounded-lg p-2 text-left text-sm hover:bg-brand-light ${active === c.chat_id ? "bg-brand-light" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{c.chat_id.replace(/@.*/, "")}</span>
                {c.escalated && <span className="ml-2 rounded bg-orange-100 px-1.5 text-xs text-orange-700">🔔 humain</span>}
              </div>
              <div className="truncate text-xs text-gray-500">{c.last}</div>
            </button>
          ))
        )}
      </div>

      <div className="card md:col-span-2 flex max-h-[70vh] flex-col">
        {!thread ? (
          <p className="m-auto text-sm text-gray-400">Sélectionnez une conversation.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between border-b pb-2">
              <span className="font-medium">{thread.chat_id.replace(/@.*/, "")}</span>
              {thread.escalated && (
                <button className="btn-ghost text-xs" onClick={close}>Rendre au bot</button>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-auto py-2">
              {thread.messages.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-gray-100" : "bg-brand text-white"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 border-t pt-2">
              <input
                className="input flex-1"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Répondre au client…"
              />
              <button className="btn" onClick={sendReply}>Envoyer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WhatsAppTab() {
  const [status, setStatus] = useState("…");
  useEffect(() => {
    api.waStatus().then((s) => setStatus(s.status)).catch(() => setStatus("inconnu"));
  }, []);
  return (
    <div className="card max-w-md space-y-3">
      <h2 className="font-semibold">Connexion WhatsApp</h2>
      <p className="text-sm text-gray-600">
        Statut : <span className={`font-medium ${status === "WORKING" ? "text-green-600" : "text-orange-600"}`}>{status}</span>
      </p>
      <Link href="/onboarding" className="btn">Reconnecter / afficher le QR</Link>
    </div>
  );
}

function UsageTab() {
  const [u, setU] = useState<any | null>(null);
  useEffect(() => {
    api.getUsage().then(setU).catch(() => {});
  }, []);
  if (!u) return <p className="text-sm text-gray-400">Chargement…</p>;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card"><div className="text-3xl font-bold text-brand">{u.messages_in}</div><div className="text-sm text-gray-500">Messages reçus</div></div>
        <div className="card"><div className="text-3xl font-bold text-brand">{u.messages_out}</div><div className="text-sm text-gray-500">Messages envoyés</div></div>
      </div>
      {u.days?.length > 0 && (
        <div className="card">
          <h3 className="mb-2 font-semibold">Par jour</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th>Jour</th><th>Reçus</th><th>Envoyés</th></tr></thead>
            <tbody>
              {u.days.map((d: any) => (
                <tr key={d.day} className="border-t"><td className="py-1">{d.day}</td><td>{d.in}</td><td>{d.out}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
