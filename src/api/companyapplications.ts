import { API_BASE, buildInit } from "./base";


export async function getAllApplications() {
  const res = await fetch(`${API_BASE}/api/company/job-applications`, buildInit());
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch job applications: ${res.status} ${res.statusText}`);
  }
  const json = await res.json().catch(() => ({}));
  console.log("Job Applications fetched:", json);
  // Transform backend data into Application format
  const formatted = (Array.isArray(json?.data) ? json.data : []).map((app: any) => {
    // Backend includes employee user id as user_id via transformJobApplication
    const applicantUserId = app?.user_id ?? app?.employee?.user?.id ?? null;
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      position: String(app.position || "").replace(/_/g, " "),
      appliedDate: app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
      resumeLink: app.resume_url ?? "",
      status: app.company_send_status,
      applicant_user_id: applicantUserId || undefined,
    };
  });

  return formatted;
}

export function updateApplicationStatus(id: number, status: "Approved" | "Rejected" | "Pending") {
  return fetch(
    `${API_BASE}/api/company/job-applications/${id}/status`,
    buildInit({
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  ).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Failed to update application status: ${res.status} ${res.statusText}`);
    }
    return res.json();
  });
}
