import { API_BASE, buildInit } from "./base";
import { ensureAccessToken } from "./token";

export type CompanyComment = {
  id: number;
  company_id: number;
  user_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
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
export async function postCompanyComment(companyProfileId: number, comment: string) {
  await ensureAccessToken();
  const res = await fetch(`${API_BASE}/api/professor/comment/${companyProfileId}`, buildInit({
    method: "POST",
    body: JSON.stringify({ comment }),
  }));
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json?.data ?? json;
}
