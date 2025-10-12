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
  console.log("🔧 Fetch options:", {
    method: "GET",
    headers,
    credentials: "include",
  });

  const res = await fetch(`${API_BASE}/api/employee/my-profile`, {
    ...baseInit,
    headers,
    credentials: "include", // ✅ backend cookie token support
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
  console.log("✅ Parsed JSON:", json);
  return (json?.data ?? json) as StudentProfile;
}

/**
 * PATCH /api/employee/my-profile
 */
export async function updateMyStudentProfile(
  updates: Partial<StudentProfile>
): Promise<StudentProfile> {
  const token = localStorage.getItem("access_token") || "";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  console.log("📡 [studentprofile] PATCH /api/employee/my-profile");
  console.log("📝 Updates body:", updates);
  console.log("🔧 Fetch options:", {
    method: "PATCH",
    headers,
    credentials: "include",
  });

  const res = await fetch(`${API_BASE}/api/employee/my-profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates),
    credentials: "include", // ✅ ensures backend receives cookies
  });

  const raw = await res.text();
  console.log("🧾 [studentprofile] PATCH response raw:", raw);
  console.log("📦 Response status:", res.status, res.statusText);

  if (!res.ok) {
    console.error("❌ Backend returned error:", raw);
    throw new Error(raw || `Failed to update profile: ${res.statusText}`);
  }

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  console.log("✅ Parsed JSON after PATCH:", json);
  return (json?.data ?? json) as StudentProfile;
}
