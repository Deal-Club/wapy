const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wapy_token");
}
export function setToken(t: string) {
  localStorage.setItem("wapy_token", t);
}
export function clearToken() {
  localStorage.removeItem("wapy_token");
}

async function req(path: string, opts: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  const tok = getToken();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res;
}

export const api = {
  signup: (email: string, password: string, resto_nom: string) =>
    req("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, resto_nom }),
    }),
  login: (email: string, password: string) =>
    req("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  getConfig: () => req("/api/config"),
  putConfig: (cfg: any) =>
    req("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    }),
  putSettings: (s: any) =>
    req("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }),
  importXlsx: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req("/api/import", { method: "POST", body: fd });
  },
  templateUrl: () => BASE + "/api/template.xlsx",
  getConversations: () => req("/api/conversations"),
  getThread: (chatId: string) => req(`/api/conversations/${encodeURIComponent(chatId)}`),
  handoffReply: (chat_id: string, text: string) =>
    req("/api/handoff/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text }),
    }),
  handoffClose: (chat_id: string) =>
    req("/api/handoff/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id }),
    }),
  getUsage: () => req("/api/usage"),
  waConnect: () => req("/api/wa/connect", { method: "POST" }),
  waStatus: () => req("/api/wa/status"),
  waQrBlobUrl: async () => {
    const res: Response = await req("/api/wa/qr");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
