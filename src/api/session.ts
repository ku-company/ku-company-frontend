const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

// Unwraps { message, data } or returns raw
function unwrap<T>(p: any): T {
  return (p && typeof p === "object" && "data" in p && p.data) ? p.data as T : (p as T);
}

export async function fetchAuthMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include", // IMPORTANT: send cookies
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed /api/auth/me: ${res.status} ${res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<{ user_name?: string; email?: string; role?: string; roles?: string }>(json);
}

export function normalizeRole(r?: string | null) {
  const raw = (r ?? "").toLowerCase();
  if (raw.includes("company")) return "Company";
  if (raw.includes("student")) return "Student";
  return r ?? "";
}
