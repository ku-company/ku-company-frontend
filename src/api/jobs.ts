import { API_BASE, buildInit } from "./base";

export async function applyToJob(jobPostId: number, resumeId: number): Promise<any> {
  const res = await fetch(
    `${API_BASE}/api/employee/apply-job/${jobPostId}`,
    buildInit({
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
      credentials: "include",
    })
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to apply to job ${jobPostId}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}

export async function applyJobsBulk(resumeId: number, jobIds: number[]): Promise<any> {
  const res = await fetch(
    `${API_BASE}/api/employee/checkout/apply-jobs`,
    buildInit({
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId, job_id: jobIds }),
      credentials: "include",
    })
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Failed to apply to jobs`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}
