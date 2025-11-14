// src/api/user.ts
import { API_BASE } from "./base";
import { extractErrorMessage } from "@/utils/httpError";

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
  first_name?: string;
  last_name?: string;
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

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }

  const raw = await res.text();
  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return json?.data || json;
}


export type UpdateRoleOptions = {
  tokenOverride?: string;
  studentId?: string;
  consent?: boolean;
};

export async function updateUserRole(role: string, options?: UpdateRoleOptions) {
  const token = options?.tokenOverride || localStorage.getItem("access_token") || "";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body: Record<string, any> = { role };
  const trimmedStudentId = options?.studentId?.trim();
  if (trimmedStudentId) body.stdId = trimmedStudentId;
  if (options?.consent !== undefined) body.pdpa_consent = options.consent;

  const res = await fetch(`${API_BASE}/api/user/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });

  const clone = res.clone();
  if (!res.ok) {
    throw new Error(await extractErrorMessage(clone));
  }

  const raw = await res.text();
  console.log(`updateUserRole response (role=${role}):`, maskToken(token), res.status, raw);

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  const data = json?.data || json;
  return data as AuthMe; // contains access_token, refresh_token, role, etc.
}
