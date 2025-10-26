// src/api/professorprofile.ts
import { API_BASE, buildInit, unwrap } from "./base";
import { extractErrorMessage } from "@/utils/httpError";
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
    // Service returns 400 with message "Profile not found" when absent
    const text = await res.text().catch(() => "");
    if (res.status === 404 || /profile not found/i.test(text)) return null;
    throw new Error(text || (await extractErrorMessage(res)));
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorProfile>(json);
}

/**
 * POST /api/professor/my-profile
 * Optionally attaches an internal secret header if NEXT_PUBLIC_INTERNAL_SECRET is set.
 */
export async function createProfessorProfile(payload: ProfessorCreatePayload): Promise<ProfessorProfile> {
  await ensureAccessToken();
  const secret = process.env.NEXT_PUBLIC_INTERNAL_SECRET || process.env.NEXT_PUBLIC_PROFESSOR_SECRET;
  const headers: HeadersInit = secret ? { "x-internal-secret": secret } : {};

  const res = await fetch(`${API_BASE}/api/professor/my-profile`, buildInit({
    method: "POST",
    headers,
    body: JSON.stringify({
      department: payload.department,
      faculty: payload.faculty,
      position: payload.position ?? null,
      contactInfo: payload.contactInfo ?? null,
      summary: payload.summary ?? null,
    }),
  }));
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
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
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorProfile>(json);
}
