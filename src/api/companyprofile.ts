// src/api/companyprofile.ts
// Handles CRUD for company profile with backend authentication

const API_BASE = "http://localhost:8000"; // change if needed

export interface CompanyProfile {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Get token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Debug log
  console.log("[companyProfile] Request", {
    url: `${API_BASE}${path}`,
    method: options.method ?? "GET",
    authorization: headers.get("Authorization"),
    contentType: headers.get("Content-Type"),
  });

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed: ${res.status} ${res.statusText}`;
    console.error("[companyProfile] Error:", message);
    const err: any = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

// ---- API methods ----

// GET /api/company/profile
export async function getCompanyProfile(): Promise<CompanyProfile> {
  return request<CompanyProfile>("/api/company/profile", { method: "GET" });
}

// POST /api/company/profile
export async function createCompanyProfile(
  profile: CompanyProfile
): Promise<CompanyProfile> {
  return request<CompanyProfile>("/api/company/profile", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

// PATCH /api/company/profile
export async function updateCompanyProfile(
  profile: Partial<CompanyProfile>
): Promise<CompanyProfile> {
  return request<CompanyProfile>("/api/company/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}
