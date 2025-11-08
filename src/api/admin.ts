import { API_BASE, buildInit } from "./base";
import { ensureAccessToken } from "./token";

export type AdminUser = {
  id?: number;
  user_name: string;
  role: string;
  email: string;
  verified?: boolean;
  status?: string; // Approved | Rejected | Pending
  created_at?: string;
};

async function parseJson(res: Response) {
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch {}
  return { json, text };
}

export async function adminListAllUsers(): Promise<AdminUser[]> {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/list-all-user`, buildInit({ method: "GET" }));
  const { json, text } = await parseJson(res);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  const data = json?.data ?? json;
  return Array.isArray(data) ? data : [];
}

export async function adminFilterUsersByStatus(status: "Approved" | "Rejected" | "Pending"): Promise<AdminUser[]> {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/filtering-user?status=${encodeURIComponent(status)}`, buildInit({ method: "GET" }));
  const { json, text } = await parseJson(res);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  const data = json?.data ?? json;
  return Array.isArray(data) ? data : [];
}

export async function adminVerifyUser(id: number) {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/verify-user/${id}`, buildInit({ method: "PATCH" }));
  const { json, text } = await parseJson(res);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}

export async function adminRejectUser(id: number) {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/reject-user/${id}`, buildInit({ method: "PATCH" }));
  const { json, text } = await parseJson(res);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}

export async function adminDeleteUser(id: number) {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/delete-user/${id}`, buildInit({ method: "DELETE" }));
  const { json, text } = await parseJson(res);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}

