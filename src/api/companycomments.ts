import { API_BASE, buildInit } from "./base";
import { ensureAccessToken } from "./token";
import { assertOk } from "@/utils/httpError";

export type CompanyCommentUser = {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  user_name?: string | null;
  role?: string | null;
};

export type CompanyComment = {
  id: number;
  company_id: number;
  user_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
  user?: CompanyCommentUser; // backend now provides commenter details
};

async function parseData(res: Response) {
  await assertOk(res);
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch {}
  return json?.data ?? json;
}

export async function fetchCompanyProfileWithCommentsByUserId(userId: number | string) {
  const res = await fetch(`${API_BASE}/api/user/profile/${userId}`, buildInit({ method: "GET", credentials: "include" }));
  return await parseData(res);
}

// NOTE: Backend currently exposes comment creation under professor routes.
// We provide a thin wrapper. If backend later adds a student endpoint, swap here.
export async function postCompanyComment(
  companyProfileId: number,
  comment: string,
  actor: 'employee' | 'professor' = 'employee'
) {
  await ensureAccessToken();
  const base = actor === 'professor' ? 'professor' : 'employee';
  const res = await fetch(`${API_BASE}/api/${base}/comment/${companyProfileId}`, buildInit({
    method: "POST",
    body: JSON.stringify({ comment }),
  }));
  return await parseData(res);
}

export async function editCompanyComment(
  commentId: number,
  comment: string,
  actor: 'employee' | 'professor' = 'employee'
) {
  await ensureAccessToken();
  const base = actor === 'professor' ? 'professor' : 'employee';
  const res = await fetch(`${API_BASE}/api/${base}/comment/${commentId}/edit`, buildInit({
    method: "PATCH",
    body: JSON.stringify({ comment }),
  }));
  return await parseData(res);
}

export async function deleteCompanyComment(
  commentId: number,
  actor: 'employee' | 'professor' = 'employee'
) {
  await ensureAccessToken();
  const base = actor === 'professor' ? 'professor' : 'employee';
  const res = await fetch(`${API_BASE}/api/${base}/comment/${commentId}/delete`, buildInit({ method: "DELETE" }));
  return await parseData(res);
}
