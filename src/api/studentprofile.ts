// src/api/studentprofile.ts
import { API_BASE, buildInit } from "./base";

export type StudentProfile = {
  id?: number;
  user_name?: string;
  email?: string;
  verified?: boolean;          // <-- canonical boolean
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  birthday?: string;
  phone?: string;
  location?: string;
  education?: string[] | null;
  skills?: string[] | null;
  licenses?: string[] | null;
  languages?: string[] | null;
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

  return {
    id: data?.id ?? u?.id,
    user_name: u?.user_name ?? "",
    email: u?.email ?? "",
    verified,

    first_name,
    last_name,
    full_name,
    avatar_url: u?.profile_image || "",

    bio: data?.summary ?? null,
    birthday: data?.birthDate ?? null,

    // If your backend later structures contactInfo, map as needed:
    // For now we only keep the raw block inside bio/summary section.
    // phone: data?.contactInfo?.phone ?? null,
    // location: data?.contactInfo?.location ?? null,

    education: data?.education ?? null,
    skills: data?.skills ?? null,
    licenses: data?.licenses ?? null,
    languages: data?.languages ?? null,
  };
}

/**
 * GET /api/employee/my-profile
 * Auth: via cookie or Bearer header
 */
export async function getMyStudentProfile(): Promise<StudentProfile> {
  const token = localStorage.getItem("access_token") || "";
  const baseInit = buildInit({ method: "GET" });

  const headers: Record<string, string> = {
    ...(baseInit.headers || {}),
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

/** ====================== NEW: PATCH (edit) ====================== **/

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

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return flattenBackendProfile(json);
}
