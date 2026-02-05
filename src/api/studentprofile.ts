// src/api/studentprofile.ts
import { API_BASE, buildInit } from "./base";
import { extractErrorMessage } from "@/utils/httpError";

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

function normalizeImageUrl(u: unknown): string | null {
  if (!u) return null;
  const str = String(u).trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;
  const base = API_BASE.replace(/\/+$/, "");
  const path = str.startsWith("/") ? str : `/${str}`;
  return `${base}${path}`;
}

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

  const avatarSource = data?.avatar_url ?? u?.profile_image ?? u?.avatar_url ?? "";
  const avatar_url = normalizeImageUrl(avatarSource) ?? "";

  return {
    id: data?.id ?? u?.id,
    user_name: u?.user_name ?? "",
    email: u?.email ?? "",
    verified,

    first_name,
    last_name,
    full_name,
    avatar_url,

    bio: data?.summary ?? data?.bio ?? null,
    birthday: data?.birthDate ?? data?.birthday ?? null,


    education: toText(data?.education),
    skills: toText(data?.skills),
    licenses: toText(data?.licenses),
    languages: toText(data?.languages),
    experience: toText(data?.experience),
    contactInfo: data?.contactInfo ?? null,
  };
}

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
  if (!res.ok) throw new Error(await extractErrorMessage(res));

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return flattenBackendProfile(json);
}

export type StudentProfileEditPayload = {
  education?: string;   
  birthDate?: string;   
  summary?: string;
  skills?: string;      
  contactInfo?: string; 
  languages?: string;   
};


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
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  
  try {
    
    const json = JSON.parse(raw);
    const flattened = flattenBackendProfile(json);
    
    if (!flattened.user_name && !flattened.full_name) {
      return await getMyStudentProfile();
    }
    return flattened;
  } catch {
    
    return await getMyStudentProfile();
  }
}
