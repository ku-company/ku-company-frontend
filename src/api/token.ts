// src/api/token.ts
import { API_BASE } from "./base";

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/user/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const raw = await res.text();
    if (!res.ok) {
      console.warn("refreshAccessToken failed:", res.status, raw);
      return null;
    }
    let json: any = {};
    try { json = JSON.parse(raw); } catch {}
    const data = json?.data || json;
    const token = data?.access_token as string | undefined;
    if (token) {
      localStorage.setItem("access_token", token);
      return token;
    }
    return null;
  } catch (e) {
    console.warn("refreshAccessToken error:", e);
    return null;
  }
}

export async function ensureAccessToken(): Promise<string | null> {
  const existing = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (existing && existing.length > 0) return existing;
  return await refreshAccessToken();
}

