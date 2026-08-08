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
  me: () => req("/api/me"),
  changePassword: (new_password: string) =>
    req("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password }),
    }),
  getTeam: () => req("/api/team"),
  inviteMember: (email: string, phone: string, dialcode: string) =>
    req("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, dialcode }),
    }),
  removeMember: (id: number) => req(`/api/team/${id}`, { method: "DELETE" }),
  adminTenants: () => req("/api/admin/tenants"),
  adminUpdateTenant: (id: number, patch: any) =>
    req(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  adminTenantConversations: (id: number) => req(`/api/admin/tenants/${id}/conversations`),
  adminIncidents: () => req("/api/admin/incidents"),
  waHealth: () => req("/api/wa/health"),
  getSectors: () => req("/api/sectors"),
  aiGenerate: (sector: string, description: string) =>
    req("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector, description }),
    }),
  waLogout: () => req("/api/wa/logout", { method: "POST" }),
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
  getKnowledge: () => req("/api/knowledge"),
  addKnowledge: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req("/api/knowledge", { method: "POST", body: fd });
  },
  removeKnowledge: (index: number) => req(`/api/knowledge/${index}`, { method: "DELETE" }),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req("/api/upload", { method: "POST", body: fd });
  },
  mediaUrl: (p: string) => (!p ? "" : p.startsWith("http") ? p : BASE + p),
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
  getRecords: () => req("/api/records"),
  getBookings: () => req("/api/bookings"),
  cancelBooking: (id: number) => req(`/api/bookings/${id}/cancel`, { method: "POST" }),
  getBilling: () => req("/api/billing"),
  subscribe: (plan: string, addons: string[]) =>
    req("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, addons }),
    }),
  upgradePlan: (plan: string) =>
    req("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }),
  addAddon: (addon: string) =>
    req("/api/billing/addon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addon }),
    }),
  staffVerifyStart: (number: string, dialcode: string) =>
    req("/api/staff/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, dialcode }),
    }),
  staffVerifyConfirm: (code: string) =>
    req("/api/staff/verify/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),
  staffExclude: (chat_id: string) =>
    req("/api/staff/exclude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id }),
    }),
  staffUnexclude: (chat_id: string) =>
    req("/api/staff/exclude/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id }),
    }),
  aiLearn: () => req("/api/ai/learn", { method: "POST" }),
  getSuggestions: () => req("/api/suggestions"),
  acceptSuggestion: (id: number) => req(`/api/suggestions/${id}/accept`, { method: "POST" }),
  rejectSuggestion: (id: number) => req(`/api/suggestions/${id}/reject`, { method: "POST" }),
  waConnect: () => req("/api/wa/connect", { method: "POST" }),
  waStatus: () => req("/api/wa/status"),
  waQrBlobUrl: async () => {
    const res: Response = await req("/api/wa/qr");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
