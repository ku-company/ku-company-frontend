// src/api/studentprofile.ts
import { API_BASE, buildInit } from "./base";

export type StudentProfile = {
  id?: number;
  user_name?: string;
  email?: string;
  verified?: boolean;

  // Optional fields depending on backend
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  birthday?: string;
  phone?: string;
  location?: string;

  // Optional structured fields
  education?: string[];
  skills?: string[];
  licenses?: string[];
  languages?: string[];
};

function mask(t?: string) {
  if (!t) return "(none)";
  return t.length > 8 ? `${t.slice(0, 4)}...${t.slice(-4)}` : t;
}

/**
 * GET /api/employee/my-profile
 * Auth: Bearer access_token
 * Returns { message, data: StudentProfile }
 */
export async function getMyStudentProfile(tokenOverride?: string): Promise<StudentProfile> {
  const token = tokenOverride || localStorage.getItem("access_token") || "";
  const baseInit = buildInit({ method: "GET" });

  const headers: HeadersInit = {
    ...(baseInit.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Optional debugging (safe to keep while integrating)
  console.log("📡 [studentprofile] GET /api/employee/my-profile with",
    token ? `Bearer ${mask(token)}` : "(missing token)"
  );

  const res = await fetch(`${API_BASE}/api/employee/my-profile`, {
    ...baseInit,
    headers,
    credentials: "include",
  });

  const raw = await res.text();
  // Peek at raw backend response during integration
  console.log("🧾 [studentprofile] RAW /my-profile:", raw);

  if (!res.ok) {
    throw new Error(raw || `Failed to fetch student profile: ${res.status} ${res.statusText}`);
  }

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return (json?.data ?? json) as StudentProfile;
}
