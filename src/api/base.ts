import { getApiBaseUrl } from "@/lib/apiBase";

export const API_BASE = getApiBaseUrl();

// Helper to include authorization headers (if tokens exist)
export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Wrapper for fetch initialization
export function buildInit(init: RequestInit = {}): RequestInit {
  const method = (init.method || "GET").toString().toUpperCase();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(init.headers || {}),
  };
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    headers["X-KU-CSRF"] = "1";
  }

  return {
    // Always include cookies for auth-backed endpoints
    credentials: init.credentials ?? "include",
    headers,
    ...init,
  };
}

// Some APIs wrap data under a "data" field — this safely unwraps it
export function unwrap<T = any>(json: any): T {
  if (!json) return {} as T;
  return (json.data ?? json) as T;
}
