// src/api/user.ts
import { API_BASE, buildInit, unwrap } from "@/api/base";

// Shape of /api/auth/me
export type AuthMe = {
  user_name?: string;
  email?: string;
  role?: string;
  roles?: string;
  company_name?: string;
};

/**
 * GET /api/auth/me
 * - Uses cookie session (OAuth) via credentials: "include"
 */
export async function getAuthMe(token?: string): Promise<AuthMe> {
  console.log("📡 [getAuthMe] Fetching user info...");
  const init = buildInit({
    method: "GET",
  });

  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    ...init,
    headers,
    credentials: "include",
  });

  console.log("✅ [getAuthMe] Response status:", res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ [getAuthMe] Failed:", text);
    throw new Error(text || `Failed to fetch /api/auth/me: ${res.status} ${res.statusText}`);
  }

  const json = await res.json().catch(() => ({}));
  console.log("🧩 [getAuthMe] Response JSON:", json);
  return unwrap<AuthMe>(json);
}

/**
 * PATCH /api/user/role
 * payload: { role: string }
 */
export async function patchUserRole(payload: { role: string }) {
  console.log("📡 [patchUserRole] Sending PATCH request to update role:", payload);

  const init = buildInit({
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  // Ensure credentials/cookies are sent
  const res = await fetch(`${API_BASE}/api/user/role`, {
    ...init,
    credentials: "include",
  });

  console.log("✅ [patchUserRole] Response status:", res.status);

  const text = await res.text().catch(() => "");
  console.log("🧾 [patchUserRole] Raw response:", text);

  if (!res.ok) {
    console.error("❌ [patchUserRole] Error updating role:", text);
    throw new Error(text || `Failed to update role: ${res.status} ${res.statusText}`);
  }

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    console.warn("⚠️ [patchUserRole] Could not parse JSON; using raw text.");
  }

  console.log("🧩 [patchUserRole] Parsed response JSON:", json);
  return unwrap(json);
}

/**
 * Convenience alias used by your page code.
 */
export async function updateUserRole(role: string) {
  console.log("🚀 [updateUserRole] Called with role:", role);
  const result = await patchUserRole({ role });
  console.log("🎯 [updateUserRole] Completed:", result);
  return result;
}
