const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

// Unwraps { message, data } or returns raw
function unwrap<T>(p: any): T {
  return p && typeof p === "object" && "data" in p && p.data
    ? (p.data as T)
    : (p as T);
}

export async function fetchAuthMe() {
  try {
    const token = localStorage.getItem("access_token");
    console.log(
      "🔸 fetchAuthMe() called, token =",
      token ? "found" : "missing"
    );

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    console.log("🔸 /auth/me response status:", res.status);

    // Gracefully handle unauthenticated states (401/403) or any non-OK
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Keep this a warn to avoid noisy errors when logged out
      console.warn("⚠️ fetchAuthMe failed:", res.status, text || "(no body)");
      return null;
    }

    const json = await res.json().catch(() => ({}));
    console.log("🟢 fetchAuthMe JSON:", json);
    return unwrap<{ user_name?: string; email?: string; role?: string; roles?: string }>(json);
  } catch (err) {
    // Network errors, CORS issues, or fetch being unavailable
    console.warn("⚠️ fetchAuthMe error (treated as logged out):", err);
    return null;
  }
}

export function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (raw.includes("company")) return "company";
  if (raw.includes("student")) return "student";
  if (raw.includes("professor")) return "professor";
  return raw;
}
