// src/api/professorprofile.ts
import { API_BASE, buildInit, unwrap } from "./base";
import { assertOk, HttpError } from "@/utils/httpError";
import { ensureAccessToken } from "./token";

export type ProfessorProfile = {
  id?: number;
  user_id?: number;
  department: string;
  faculty: string;
  position: string | null;
  contactInfo: string | null;
  summary: string | null;
  // Decorated by backend service
  profile_image_url?: string | null;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    verified?: boolean;
  };
};

export type ProfessorCreatePayload = {
  department: string;
  faculty: string;
  position?: string | null;
  contactInfo?: string | null;
  summary?: string | null;
};

export type ProfessorEditPayload = {
  first_name?: string; // required by backend if user has none
  last_name?: string;  // required by backend if user has none
  department?: string | null;
  faculty?: string | null;
  position?: string | null;
  contactInfo?: string | null;
  summary?: string | null;
};

/**
 * GET /api/professor/my-profile
 */
export async function getMyProfessorProfile(signal?: AbortSignal): Promise<ProfessorProfile | null> {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/professor/my-profile`, buildInit({ signal }));
  if (!res.ok) {
    const text = await res.clone().text().catch(() => "");
    if (res.status === 404 || /profile not found/i.test(text)) return null;
  }
  await assertOk(res);
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorProfile>(json);
}

/**
 * POST /api/professor/my-profile
 * Optionally attaches an internal secret header if NEXT_PUBLIC_INTERNAL_SECRET is set.
 */
export async function createProfessorProfile(payload?: ProfessorCreatePayload): Promise<ProfessorProfile> {
  await ensureAccessToken();
  console.log("[createProfessorProfile] Payload:", payload);
  const secret = process.env.NEXT_PUBLIC_INTERNAL_SECRET || process.env.NEXT_PUBLIC_PROFESSOR_SECRET;
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") ?? "" : "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(secret ? { "x-internal-secret": secret } : {}),
  };

  const src: any = payload ?? {};
  const dept = typeof src.department === "string" ? src.department.trim() : String(src.department ?? "").trim();
  const fac = typeof src.faculty === "string" ? src.faculty.trim() : String(src.faculty ?? "").trim();
  // Build the exact JSON body the server expects
  const bodyJson = JSON.stringify({ department: dept, faculty: fac });

  // Debug log for troubleshooting payload issues (show actual JSON string)
  try {
    console.log("[createProfessorProfile][DEBUG] URL:", `${API_BASE}/api/professor/my-profile`);
    console.log("[createProfessorProfile][DEBUG] Method:", "POST");
    console.log("[createProfessorProfile][DEBUG] Headers:", headers);
    console.log("[createProfessorProfile][DEBUG] Body:", bodyJson);
    // Expose on window for inspection if console logs are not visible
    if (typeof window !== "undefined") {
      (window as any).__profPostDebug = {
        url: `${API_BASE}/api/professor/my-profile`,
        method: "POST",
        headers,
        token,
        body: bodyJson,
      };
    }
  } catch {}

  if (!dept || !fac) {
    try { console.warn("[createProfessorProfile] Missing required fields:", { department: dept, faculty: fac }); } catch {}
  }

  const res = await fetch(`${API_BASE}/api/professor/my-profile`, buildInit({
    method: "POST",
    headers,
    body: bodyJson,
  }));
  // Log raw response for debugging
  try {
    const preview = await res.clone().text();
    console.log("[createProfessorProfile][DEBUG] Response status:", res.status);
    console.log("[createProfessorProfile][DEBUG] Response text:", preview);
    if (typeof window !== "undefined") {
      (window as any).__profPostRespDebug = {
        status: res.status,
        text: preview,
      };
    }
  } catch {}

  try {
    await assertOk(res);
  } catch (err) {
    const asHttpError = err as HttpError;
    const bodyText = asHttpError?.body || asHttpError?.message || "";
    try { console.warn("[createProfessorProfile] Server error:", asHttpError?.status ?? res.status, bodyText); } catch {}
    if (asHttpError instanceof HttpError && asHttpError.status === 400 && /already exists/i.test(bodyText)) {
      try {
        const existing = await getMyProfessorProfile();
        if (existing) return existing;
      } catch {}
    }
    throw err;
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorProfile>(json);
}

/**
 * PATCH /api/professor/my-profile
 */
export async function patchProfessorProfile(updates: ProfessorEditPayload): Promise<ProfessorProfile> {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/professor/my-profile`, buildInit({
    method: "PATCH",
    body: JSON.stringify(updates),
  }));
  await assertOk(res);
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorProfile>(json);
}
