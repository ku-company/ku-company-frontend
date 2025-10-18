// src/api/studentprofile.ts
import { API_BASE, buildInit } from "./base";

export type StudentProfile = {
  id?: number;
  user_name?: string;
  email?: string;
  verified?: boolean;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  birthday?: string;
  phone?: string;
  location?: string;
  education?: string | null;
  skills?: string | null;
  licenses?: string | null;
  languages?: string | null;
  experience?: string | null;
  contactInfo?: string | null;
};

function toBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === 1) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

/** Flattens your backend shape to our StudentProfile model. */
function flattenBackendProfile(json: any): StudentProfile {
  const data = json?.data ?? json ?? {};
  const u = data?.user ?? {};

  const verified =
    toBool(u?.verified) ||
    toBool(u?.verify) ||
    toBool(u?.verified_status);

  const first_name = u?.first_name ?? "";
  const last_name = u?.last_name ?? "";
  const full_name =
    [first_name, last_name].filter(Boolean).join(" ").trim() ||
    u?.user_name ||
    "";

  const toText = (v: unknown): string | null => {
    if (v == null) return null;
    if (Array.isArray(v)) return v.filter(Boolean).map(String).join("\n");
    if (typeof v === "string") return v;
    try { return String(v); } catch { return null; }
  };

  return {
    id: data?.id ?? u?.id,
    user_name: u?.user_name ?? "",
    email: u?.email ?? "",
    verified,

    first_name,
    last_name,
    full_name,
    avatar_url: u?.profile_image || "",

    bio: data?.summary ?? data?.bio ?? null,
    birthday: data?.birthDate ?? data?.birthday ?? null,

    // If your backend later structures contactInfo, map as needed:
    // For now we only keep the raw block inside bio/summary section.
    // phone: data?.contactInfo?.phone ?? null,
    // location: data?.contactInfo?.location ?? null,

    education: toText(data?.education),
    skills: toText(data?.skills),
    licenses: toText(data?.licenses),
    languages: toText(data?.languages),
    experience: toText(data?.experience),
    contactInfo: data?.contactInfo ?? null,
  };
}

/**
 * GET /api/employee/my-profile
 * Auth: via cookie or Bearer header
 */
export async function getMyStudentProfile(): Promise<StudentProfile> {
  const token = localStorage.getItem("access_token") || "";
  const baseInit = buildInit({ method: "GET" });

  const headers = new Headers(baseInit.headers as HeadersInit);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}/api/employee/my-profile`, {
    ...baseInit,
    headers,
    credentials: "include",
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(raw || `Failed to fetch student profile: ${res.status} ${res.statusText}`);

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return flattenBackendProfile(json);
}

export type StudentProfileEditPayload = {
  education?: string;   // comma/newline separated text
  birthDate?: string;   // YYYY-MM-DD
  summary?: string;
  skills?: string;      // comma/newline separated text
  experience?: string;
  contactInfo?: string; // free text
  languages?: string;   // comma/newline separated text
};

/**
 * PATCH /api/employee/my-profile/edit
 * Body: {
 *  education, birthDate, summary, skills, experience, contactInfo, languages
 * }
 */
export async function patchMyStudentProfile(
  updates: StudentProfileEditPayload
): Promise<StudentProfile> {
  const token = localStorage.getItem("access_token") || "";

  const res = await fetch(`${API_BASE}/api/employee/my-profile/edit`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
    credentials: "include",
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(raw || `Failed to update profile: ${res.status} ${res.statusText}`);
  // Some endpoints return the updated profile without nested user; ensure we refetch
  try {
    // Try to parse in case it's already the full shape; if not, ignore
    const json = JSON.parse(raw);
    const flattened = flattenBackendProfile(json);
    // If critical user fields are missing, fall back to full refetch
    if (!flattened.user_name && !flattened.full_name) {
      return await getMyStudentProfile();
    }
    return flattened;
  } catch {
    // On any parse/shape mismatch, refetch a consistent profile shape
    return await getMyStudentProfile();
  }
}
