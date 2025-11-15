import { buildInit, API_BASE } from "./base";

/* -------------------- Base URLs -------------------- */
const BASE_URL = API_BASE.replace(/\/$/, ""); // prevent double slash

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
  // Use the public announcements feed so all roles can read
  const res = await fetch(API_URL_PUBLIC, withAuthHeaders({ method: "GET", signal }));
  // Response shape may be an array or an object with results/data
  return handleResponse<any>(res, "Failed to fetch announcements");
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
