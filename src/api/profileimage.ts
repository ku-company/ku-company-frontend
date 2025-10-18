// src/api/profileimage.ts
import { API_BASE, getAuthHeaders } from "./base";

async function fetchJSON(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, credentials: "include" });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
  if (!res.ok) {
    const msg = json?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return json;
}

function normalizeImageUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  // Already absolute
  if (/^https?:\/\//i.test(u)) return u;
  // Ensure single slash join with API_BASE
  const base = API_BASE.replace(/\/+$/, "");
  const path = String(u).startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

function buildFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("profile_image", file);
  return fd;
}

// Employee (Student/Alumni)
export async function getEmployeeProfileImage(): Promise<string | null> {
  const json = await fetchJSON(`${API_BASE}/api/employee/profile/image`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });
  return normalizeImageUrl(json?.profile_image as string | null);
}

export async function uploadEmployeeProfileImage(file: File): Promise<string> {
  const fd = buildFormData(file);
  const json = await fetchJSON(`${API_BASE}/api/employee/profile/image`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      // DO NOT set Content-Type for FormData; browser sets boundary
    },
    body: fd,
  });
  return normalizeImageUrl(json?.imageUrl as string | null) ?? "";
}

export async function patchEmployeeProfileImage(file: File): Promise<string> {
  const fd = buildFormData(file);
  const json = await fetchJSON(`${API_BASE}/api/employee/profile/image`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: fd,
  });
  return normalizeImageUrl(json?.imageUrl as string | null) ?? "";
}

export async function deleteEmployeeProfileImage(): Promise<void> {
  await fetchJSON(`${API_BASE}/api/employee/profile/image`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
}

// Company
export async function getCompanyProfileImage(): Promise<string | null> {
  const json = await fetchJSON(`${API_BASE}/api/company/profile/image`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });
  return normalizeImageUrl(json?.profile_image as string | null);
}

export async function uploadCompanyProfileImage(file: File): Promise<string> {
  const fd = buildFormData(file);
  const json = await fetchJSON(`${API_BASE}/api/company/profile/image`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: fd,
  });
  return normalizeImageUrl(json?.imageUrl as string | null) ?? "";
}

export async function patchCompanyProfileImage(file: File): Promise<string> {
  const fd = buildFormData(file);
  const json = await fetchJSON(`${API_BASE}/api/company/profile/image`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: fd,
  });
  return normalizeImageUrl(json?.imageUrl as string | null) ?? "";
}

export async function deleteCompanyProfileImage(): Promise<void> {
  await fetchJSON(`${API_BASE}/api/company/profile/image`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
}

export const PROFILE_IMAGE_UPDATED_EVENT = "profile-image-updated";

