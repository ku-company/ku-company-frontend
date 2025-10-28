import { API_BASE, buildInit, unwrap } from "./base";
import { extractErrorMessage } from "@/utils/httpError";
import { ensureAccessToken } from "./token";

export type ProfessorDegree = {
  id: number;
  title: string;
  institution?: string | null;
  graduation_date?: string | null; // ISO date string (YYYY-MM-DD)
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfessorDegreeCreate = {
  title: string;
  institution?: string | null;
  graduation_date?: string | null;
  description?: string | null;
};

export type ProfessorDegreeUpdate = Partial<ProfessorDegreeCreate>;

const BASE = `${API_BASE}/api/professor/degrees`;

export async function listProfessorDegrees(signal?: AbortSignal): Promise<ProfessorDegree[]> {
  await ensureAccessToken();
  const res = await fetch(BASE, buildInit({ method: "GET", signal }));
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorDegree[]>(json) ?? [];
}

export async function createProfessorDegree(payload: ProfessorDegreeCreate): Promise<ProfessorDegree> {
  await ensureAccessToken();
  const body = JSON.stringify(payload);
  const res = await fetch(BASE, buildInit({ method: "POST", body }));
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorDegree>(json);
}

export async function updateProfessorDegree(id: number, updates: ProfessorDegreeUpdate): Promise<ProfessorDegree> {
  await ensureAccessToken();
  const res = await fetch(`${BASE}/${id}`, buildInit({ method: "PATCH", body: JSON.stringify(updates) }));
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  const json = await res.json().catch(() => ({}));
  return unwrap<ProfessorDegree>(json);
}

export async function deleteProfessorDegree(id: number): Promise<void> {
  await ensureAccessToken();
  const res = await fetch(`${BASE}/${id}`, buildInit({ method: "DELETE" }));
  if (!res.ok) throw new Error(await extractErrorMessage(res));
}

