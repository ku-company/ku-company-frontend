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
  const token = localStorage.getItem("access_token"); // ✅ เพิ่มการอ่าน token
  console.log("🔸 fetchAuthMe() called, token =", token ? "found" : "missing");

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  console.log("🔸 /auth/me response status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("⚠️ fetchAuthMe failed:", res.status, text);
    return null; // ✅ return null แทน throw error
  }

  const json = await res.json().catch(() => ({}));
  console.log("🟢 fetchAuthMe JSON:", json);
  return unwrap<{ user_name?: string; email?: string; role?: string; roles?: string }>(json);
}

export function normalizeRole(r?: string | null) {
  const raw = (r ?? "").trim().toLowerCase();
  if (raw.includes("company")) return "company";
  if (raw.includes("student")) return "student";
  if (raw.includes("professor")) return "professor";
  return raw;
}
