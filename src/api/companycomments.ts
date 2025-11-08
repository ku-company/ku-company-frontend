import { API_BASE, buildInit } from "./base";
import { ensureAccessToken } from "./token";

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

export async function fetchCompanyProfileWithCommentsByUserId(userId: number | string) {
  const res = await fetch(`${API_BASE}/api/user/profile/${userId}`, buildInit({ method: "GET", credentials: "include" }));
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
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
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
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
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}

export async function deleteCompanyComment(
  commentId: number,
  actor: 'employee' | 'professor' = 'employee'
) {
  await ensureAccessToken();
  const base = actor === 'professor' ? 'professor' : 'employee';
  const res = await fetch(`${API_BASE}/api/${base}/comment/${commentId}/delete`, buildInit({ method: "DELETE" }));
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}
