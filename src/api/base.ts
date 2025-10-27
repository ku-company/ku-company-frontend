export const API_BASE = "http://localhost:8000";

// Helper to include authorization headers (if tokens exist)
export function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Wrapper for fetch initialization
export function buildInit(init: RequestInit = {}): RequestInit {
  return {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init.headers || {}),
    },
    ...init,
  };
}

// Some APIs wrap data under a "data" field — this safely unwraps it
export function unwrap<T = any>(json: any): T {
  if (!json) return {} as T;
  return (json.data ?? json) as T;
}
