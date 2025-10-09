// src/api/user.ts
import { API_BASE } from "./base";

export type AuthMe = {
  id?: number;
  user_name?: string;
  email?: string;
  role?: string;
  roles?: string;
  verify?: boolean;
  access_token?: string;
  refresh_token?: string;
  company_name?: string;
};

function maskToken(t?: string) {
  if (!t) return "(none)";
  if (t.length <= 8) return t;
  return `${t.slice(0, 4)}...${t.slice(-4)}`;
}
export async function getAuthMe(token?: string): Promise<AuthMe> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;


  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(raw || `Failed /api/auth/me: ${res.status} ${res.statusText}`);
  }

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return json?.data || json;
}


export async function updateUserRole(role: string, tokenOverride?: string) {
  const token = tokenOverride || localStorage.getItem("access_token") || "";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/user/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role }),
    credentials: "include",
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(raw || `Failed to update role: ${res.status} ${res.statusText}`);
  }

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  const data = json?.data || json;
  return data as AuthMe; // contains access_token, refresh_token, role, etc.
}
