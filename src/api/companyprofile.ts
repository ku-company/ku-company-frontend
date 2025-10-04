export type CompanyProfilePayload = {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
};

export type CompanyProfile = CompanyProfilePayload;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    console.log("Using token:", token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  console.log(`headers:`, res.headers);

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed: ${res.status} ${res.statusText}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    return await request<CompanyProfile>("/api/company/profile", { method: "GET" });
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createCompanyProfile(
  payload: CompanyProfilePayload
): Promise<CompanyProfile> {
  return request<CompanyProfile>("/api/company/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCompanyProfile(
  payload: CompanyProfilePayload
): Promise<CompanyProfile> {
  return request<CompanyProfile>("/api/company/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
