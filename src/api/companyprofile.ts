import { API_BASE, buildInit, unwrap } from "./base";
import { extractErrorMessage } from "@/utils/httpError";

export type CompanyProfile = {
  company_name: string;
  description: string;
  industry: string;
  tel: string;
  location: string;
  country: string;
};

export type PublicCompanyProfile = CompanyProfile & {
  id: number;
  user_id?: number;
};

export async function getCompanyProfile(signal?: AbortSignal): Promise<CompanyProfile | null> {
  const res = await fetch(`${API_BASE}/api/company/profile`, buildInit({ signal }));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
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
    throw new Error(await extractErrorMessage(res));
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<CompanyProfile>(json);
}

export async function createDefaultCompanyProfile(company_name: string) {
  try {
    const res = await fetch(
      `${API_BASE}/api/company/profile`,
      buildInit({
        method: "POST",
        body: JSON.stringify({
          company_name,
          description: "To be Added",
          industry: "",
          tel: "",
          location: "",
          country: "",
        }),
      }),
    );

    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
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
    throw new Error(await extractErrorMessage(res));
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<CompanyProfile>(json);
}

export async function getCompanyProfileById(
  companyId: number,
  signal?: AbortSignal,
): Promise<PublicCompanyProfile | null> {
  if (!Number.isFinite(companyId)) {
    return null;
  }
  const res = await fetch(
    `${API_BASE}/api/user/company-profile/${companyId}`,
    buildInit({ signal }),
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<PublicCompanyProfile>(json);
}
