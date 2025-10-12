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

function mask(t?: string) {
  if (!t) return "(none)";
  return t.length > 8 ? `${t.slice(0, 4)}...${t.slice(-4)}` : t;
}

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
  // raw backend payloads
  const data = json?.data ?? json ?? {};
  const u = data?.user ?? {};

  // logs to verify what we received
  console.log("🔍 [studentprofile] backend data.user:", u);

  const verified =
    toBool(u?.verified) ||
    toBool(u?.verify) ||
    toBool(u?.verified_status);

  // map common fields
  const first_name = u?.first_name ?? "";
  const last_name = u?.last_name ?? "";
  const full_name =
    [first_name, last_name].filter(Boolean).join(" ").trim() ||
    u?.user_name ||
    "";

  // optional fields (your backend uses different names)
  const profile: StudentProfile = {
    id: data?.id ?? u?.id,
    user_name: u?.user_name ?? "",
    email: u?.email ?? "",
    verified,

    first_name,
    last_name,
    full_name,
    avatar_url: u?.profile_image || "",

    // map backend fields if present
    bio: data?.summary ?? null,
    birthday: data?.birthDate ?? null,
    // place-holder extractions if you later structure contact info:
    phone: data?.contactInfo?.phone ?? null,
    location: data?.contactInfo?.location ?? null,

    education: data?.education ?? null,
    skills: data?.skills ?? null,
    licenses: data?.licenses ?? null,
    languages: data?.languages ?? null,
  };

  console.log("✅ [studentprofile] flattened/normalized profile:", profile);
  return profile;
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

  console.log("📡 [studentprofile] GET /api/employee/my-profile");
  console.log("🔑 Token header present?", !!token);
  console.log("🔧 Fetch options:", { method: "GET", headers, credentials: "include" });

  const res = await fetch(`${API_BASE}/api/employee/my-profile`, {
    ...baseInit,
    headers,
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [studentprofile] RAW response text:", raw);
  console.log("📦 Response status:", res.status, res.statusText);

  if (!res.ok) {
    console.error("❌ Backend returned error:", raw);
    throw new Error(raw || `Failed to fetch student profile: ${res.status} ${res.statusText}`);
  }

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}

  // 🔁 Normalize from nested shape → flat StudentProfile
  return flattenBackendProfile(json);
}
