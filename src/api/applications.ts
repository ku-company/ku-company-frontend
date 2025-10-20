import { API_BASE, buildInit } from "./base";

export type ApplicationItem = {
  id: number;
  job_id?: number;
  resume_id?: number | null;
  job_post?: { id: number } & Record<string, any>;
} & Record<string, any>;

export async function listMyApplications(): Promise<ApplicationItem[]> {
  const res = await fetch(
    `${API_BASE}/api/employee/my-applications`,
    buildInit({ method: "GET", credentials: "include" })
  );
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text);
      if (j && (j.message === "Access Denied" || j.error === "Access Denied")) {
        return [];
      }
    } catch {}
    throw new Error(text || "Failed to fetch applications");
  }
  try {
    const json = JSON.parse(text);
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

