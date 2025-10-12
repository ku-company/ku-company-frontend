// src/api/resumes.ts
import { API_BASE, buildInit } from "./base";

export type ResumeItem = {
  id: string | number;
  name: string;
  url?: string;
  size?: number;       // bytes (optional)
  updatedAt?: string;  // ISO string (optional)
};

function unwrap<T>(json: any): T {
  return (json?.data ?? json) as T;
}

function maskToken(t?: string) {
  if (!t) return "(none)";
  return t.length > 8 ? `${t.slice(0,4)}...${t.slice(-4)}` : t;
}

/** GET list of resumes */
export async function listResumes(): Promise<ResumeItem[]> {
  const token = localStorage.getItem("access_token") || "";
  const baseInit = buildInit({ method: "GET" });

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    ...baseInit,
    headers: {
      ...(baseInit.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] GET raw:", raw, "🔑", maskToken(token));

  if (!res.ok) throw new Error(raw || `Failed to fetch resumes`);

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  const data = unwrap<any>(json);

  // Normalize to array
  if (Array.isArray(data)) return data as ResumeItem[];
  if (!data) return [];
  // Sometimes backend returns object keyed or single item; coerce
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

/** POST upload one resume (PDF only, <= 10MB) */
export async function uploadResume(file: File): Promise<ResumeItem> {
  const token = localStorage.getItem("access_token") || "";
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File must be 10MB or smaller.");
  }

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] POST raw:", raw);

  if (!res.ok) throw new Error(raw || `Failed to upload resume`);

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  return unwrap<ResumeItem>(json);
}

/** DELETE all resumes */
export async function deleteAllResumes(): Promise<void> {
  const token = localStorage.getItem("access_token") || "";
  const baseInit = buildInit({ method: "DELETE" });

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    ...baseInit,
    headers: {
      ...(baseInit.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] DELETE raw:", raw);

  if (!res.ok) throw new Error(raw || `Failed to delete resumes`);
}
