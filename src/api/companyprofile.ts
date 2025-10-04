// src/api/companyprofile.ts
// Handles CRUD for company profile with backend authentication + envelope unwrapping

export interface CompanyProfile {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
}

type ApiEnvelope<T> = { message?: string; data?: T } | T;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function unwrap<T>(payload: ApiEnvelope<T> | null | undefined): T {
  if (payload && typeof payload === "object" && "data" in payload && (payload as any).data) {
    return (payload as any).data as T;
  }
  return payload as T;
}

// ---- Helper: make authorized requests ----
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  // Debug what you're sending
  console.log("[companyProfile] Request", {
    url: `${API_BASE}${path}`,
    method: options.method ?? "GET",
    authorization: headers.get("Authorization"),
    contentType: headers.get("Content-Type"),
  });

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed: ${res.status} ${res.statusText}`;
    console.error("[companyProfile] Error:", message, json);
    const err: any = new Error(message);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json as T;
}

// ---- API methods ----

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const raw = await request<ApiEnvelope<CompanyProfile>>("/api/company/profile", { method: "GET" });
    const data = unwrap<CompanyProfile>(raw);
    console.log("[companyProfile] GET ->", data);
    return data ?? null;
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function createCompanyProfile(
  profile: CompanyProfile
): Promise<CompanyProfile> {
  const raw = await request<ApiEnvelope<CompanyProfile>>("/api/company/profile", {
    method: "POST",
    body: JSON.stringify(profile),
  });
  const data = unwrap<CompanyProfile>(raw);
  console.log("[companyProfile] POST ->", data);
  return data;
}

export async function updateCompanyProfile(
  profile: Partial<CompanyProfile>
): Promise<CompanyProfile> {
  const raw = await request<ApiEnvelope<CompanyProfile>>("/api/company/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
  const data = unwrap<CompanyProfile>(raw);
  console.log("[companyProfile] PATCH ->", data);
  return data;
}
