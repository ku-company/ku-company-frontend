import { API_BASE, buildInit } from "./base";

export type ResumeItem = {
  id: number;
  employee_id?: number;
  file_url: string;
  name?: string;
  is_main?: boolean;
};

export const MAIN_RESUME_UPDATED_EVENT = "main-resume-updated";

function unwrap<T>(json: any): T {
  return (json?.data ?? json) as T;
}

function maskToken(t?: string) {
  if (!t) return "(none)";
  return t.length > 8 ? `${t.slice(0,4)}...${t.slice(-4)}` : t;
}
function extractFileName(url: string): string {
  try {
    const raw = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "");
    const dashIndex = raw.indexOf("-");
    if (raw.startsWith("resume_") && dashIndex > 0) {
      return raw.substring(dashIndex + 1);
    }
    return raw;
  } catch {
    return url;
  }
}

/** GET list of resumes */
export async function listResumes(): Promise<ResumeItem[]> {
  const token = localStorage.getItem("access_token") || "";

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] GET raw:", raw.slice(0, 500), "🔑", maskToken(token));

  if (!res.ok) {
    try {
      const j = JSON.parse(raw);
      if (j && (j.message === "Access Denied" || j.error === "Access Denied")) {
        console.warn("[resumes] Access Denied — returning empty list");
        return [];
      }
    } catch {}
    throw new Error(raw || `Failed to fetch resumes`);
  }

  let json: any = {};
  try {
    json = JSON.parse(raw);
  } catch {}

  const list: ResumeItem[] = Array.isArray(json?.resumes) ? json.resumes : [];
  return list.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    file_url: r.file_url,
    name: extractFileName(r.file_url),
    is_main: !!r.is_main,
  }));
}

/** GET the current main resume */
export async function getMainResume(): Promise<ResumeItem | null> {
  const token = localStorage.getItem("access_token") || "";

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes/main`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] GET main raw:", raw.slice(0, 400));

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(raw || `Failed to fetch main resume`);

  let json: any = {};
  try { json = JSON.parse(raw); } catch {}
  const item = unwrap<any>(json);
  if (!item) return null;
  return {
    id: item.id,
    employee_id: item.employee_id,
    file_url: item.file_url,
    name: extractFileName(item.file_url),
    is_main: true,
  } as ResumeItem;
}

/** PATCH set a specific resume as main */
export async function setMainResume(id: number): Promise<void> {
  const token = localStorage.getItem("access_token") || "";
  const res = await fetch(`${API_BASE}/api/employee/profile/resumes/${id}/set-main`, {
    method: "PATCH",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });
  const raw = await res.text();
  console.log(`⭐ [resumes] PATCH set-main ${id} raw:`, raw);
  if (!res.ok) throw new Error(raw || `Failed to set main resume`);
}

/** POST upload one resume (PDF only, <= 10MB) */
export async function uploadResume(file: File): Promise<ResumeItem> {
  const token = localStorage.getItem("access_token") || "";
  if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be ≤ 10MB.");

  const form = new FormData();
  form.append("resume", file);

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: form,
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] POST raw:", raw.slice(0, 500));

  if (!res.ok) throw new Error(raw || `Failed to upload resume`);

  let json: any = {};
  try {
    json = JSON.parse(raw);
  } catch {}
  return unwrap<ResumeItem>(json);
}

/** DELETE all resumes */
export async function deleteAllResumes(): Promise<void> {
  const token = localStorage.getItem("access_token") || "";

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes`, {
    method: "DELETE",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log("🧾 [resumes] DELETE ALL raw:", raw);

  if (!res.ok) throw new Error(raw || `Failed to delete resumes`);
}

/** DELETE single resume by ID */
export async function deleteResume(id: number): Promise<void> {
  const token = localStorage.getItem("access_token") || "";

  const res = await fetch(`${API_BASE}/api/employee/profile/resumes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  const raw = await res.text();
  console.log(`🗑️ [resumes] DELETE ${id} raw:`, raw);

  if (!res.ok) throw new Error(raw || `Failed to delete resume`);
}
