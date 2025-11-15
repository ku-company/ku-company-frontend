import { buildInit } from "./base";

/* -------------------- Base URLs -------------------- */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const BASE_URL = RAW_BASE.replace(/\/$/, ""); // กัน double slash

const API_URL = `${BASE_URL}/api/professor/announcements/`;
// Public feed endpoint (read-only)
const API_URL_PUBLIC = `${BASE_URL}/api/announcements`;
const API_URL_POSTS = `${BASE_URL}/api/professor/posts/`;

/* -------------------- Helpers -------------------- */
function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;

  // Default headers + แนบ Bearer ถ้ามี
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ใช้ cookie session ได้ด้วย (ถ้ามี), ปิด cache กันข้อมูลค้าง
  return buildInit({
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
}

async function handleResponse<T>(res: Response, action: string): Promise<T> {
  const ctype = res.headers.get("content-type") || "";
  const isJson = ctype.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body?.message || body?.detail)) || (typeof body === "string" ? body : "");
    const suffix = message ? ` - ${message}` : "";
    throw new Error(`${action}: ${res.status} ${res.statusText}${suffix}`);
  }

  return (isJson ? body : ({} as any)) as T;
}

/* -----------------------------------------------------------
   🔹 Fetch all announcements
----------------------------------------------------------- */
export async function fetchProfessorAnnouncements(signal?: AbortSignal) {
  const url = API_URL_PUBLIC; // Use the public announcements feed so all roles can read
  const init = withAuthHeaders({ method: "GET", signal });
  const started = Date.now();

  // Best-effort client-side logging for visibility in the browser console
  try {
    const headersAny: any = init.headers || {};
    const sanitizedHeaders: Record<string, any> = { ...headersAny };
    const authKey = Object.keys(sanitizedHeaders).find((k) => k.toLowerCase() === "authorization");
    if (authKey) sanitizedHeaders[authKey] = "(redacted)";
    console.groupCollapsed(`[Announcements] GET ${url}`);
    console.log("request", {
      method: init.method || "GET",
      credentials: (init as any).credentials,
      headers: sanitizedHeaders,
    });
    console.groupEnd();
  } catch {}

  const res = await fetch(url, init);

  try {
    console.groupCollapsed(`[Announcements] Response ${url}`);
    console.log("response", { status: res.status, ok: res.ok });
    console.groupEnd();
  } catch {}

  // Response shape may be an array or an object with results/data
  const data = await handleResponse<any>(res, "Failed to fetch announcements");

  // Log the actual payload returned from the backend (collapsed to avoid noisy console by default)
  try {
    console.groupCollapsed(`[Announcements] Backend payload ${url}`);
    console.log(data);
    console.groupEnd();
  } catch {}

  try {
    const duration = Date.now() - started;
    const previewCount = Array.isArray(data)
      ? data.length
      : Array.isArray(data?.results ?? data?.data)
      ? (data?.results ?? data?.data).length
      : undefined;
    console.log("[Announcements] Loaded", {
      durationMs: duration,
      count: previewCount,
    });
  } catch {}

  return data;
}

/* -----------------------------------------------------------
   🔹 Create new announcement
----------------------------------------------------------- */
export async function createProfessorAnnouncement(data: {
  content: string;
  is_connection?: boolean;
}) {
  const res = await fetch(
    API_URL,
    withAuthHeaders({
      method: "POST",
      body: JSON.stringify(data),
    })
  );
  return handleResponse<any>(res, "Failed to create announcement");
}

/* -----------------------------------------------------------
   🔹 Delete announcement
----------------------------------------------------------- */
export async function deleteProfessorAnnouncement(id: number) {
  const res = await fetch(
    `${API_URL_POSTS}${id}/`,
    withAuthHeaders({ method: "DELETE" })
  );
  await handleResponse<{}>(res, "Failed to delete announcement");
  return true;
}
