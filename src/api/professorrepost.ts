import { API_BASE, buildInit } from "./base";
import { assertOk } from "@/utils/httpError";

export type RepostPayload = {
  content?: string;
  is_connection?: boolean;
};

// List all reposts (professor scope)
export async function listAllReposts() {
  const res = await fetch(`${API_BASE}/api/professor/job-postings/all-reposts`, buildInit({
    method: "GET",
    credentials: "include",
  }));
  await assertOk(res);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
}

// Get a single repost by its announcement (repost) id
export async function getRepostById(id: number) {
  const res = await fetch(`${API_BASE}/api/professor/job-postings/repost/${id}`, buildInit({
    method: "GET",
    credentials: "include",
  }));
  await assertOk(res);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

// Repost a job posting by job posting id
export async function repostJobPosting(jobPostId: number, payload?: RepostPayload) {
  const res = await fetch(`${API_BASE}/api/professor/job-postings/repost/${jobPostId}`, buildInit({
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: "include",
  }));
  await assertOk(res);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: true }; }
}

// Edit a repost by announcement (repost) id
export async function editRepost(repostId: number, payload: RepostPayload) {
  const res = await fetch(`${API_BASE}/api/professor/job-postings/repost/${repostId}`, buildInit({
    method: "PATCH",
    body: JSON.stringify(payload),
    credentials: "include",
  }));
  await assertOk(res);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: true }; }
}

// Delete a repost by announcement (repost) id
export async function deleteRepost(repostId: number) {
  const res = await fetch(`${API_BASE}/api/professor/job-postings/repost/${repostId}`, buildInit({
    method: "DELETE",
    credentials: "include",
  }));
  await assertOk(res);
  return true;
}

