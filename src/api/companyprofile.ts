export type CompanyProfile = {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function buildInit(init: RequestInit = {}): RequestInit {
  const token = (typeof window !== "undefined")
    ? localStorage.getItem("access_token")
    : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  return {
    credentials: "include", // <<< important for cookie-based auth
    ...init,
    headers,
  };
}

function unwrap<T>(payload: any): T {
  return payload && typeof payload === "object" && "data" in payload && payload.data
    ? (payload.data as T)
    : (payload as T);
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const res = await fetch(`${API_BASE}/api/company/profile`, buildInit());
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch company profile: ${res.status} ${res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<CompanyProfile>(json);
}

export async function createCompanyProfile(payload: CompanyProfile): Promise<CompanyProfile> {
  const res = await fetch(`${API_BASE}/api/company/profile`, buildInit({
    method: "POST",
    body: JSON.stringify(payload),
  }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to create company profile: ${res.status} ${res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<CompanyProfile>(json);
}

export async function createDefaultCompanyProfile(company_name: string) {
  try {
    const res = await fetch(`${API_BASE}/api/company/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // use cookie-based auth
      body: JSON.stringify({
        company_name,
        description: "To be Added",
        industry: "",
        tel: "",
        location: "",
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Failed to create profile: ${msg}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("createDefaultCompanyProfile failed:", err);
    return null; // don't crash, continue normal flow
  }
}

export async function updateCompanyProfile(payload: CompanyProfile): Promise<CompanyProfile> {
  const res = await fetch(`${API_BASE}/api/company/profile`, buildInit({
    method: "PATCH",
    body: JSON.stringify(payload),
  }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to update company profile: ${res.status} ${res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<CompanyProfile>(json);
}
