import { API_BASE, buildInit } from "./base";

export type ApplicationStatus = "Approved" | "Rejected" | "Pending" | "Confirmed";

function normalizeStatus(value: string | null | undefined): ApplicationStatus {
  const lower = (value || "").toLowerCase();
  if (lower === "confirmed" || lower === "confirm") return "Confirmed";
  if (lower === "approved" || lower === "approve") return "Approved";
  if (lower === "rejected" || lower === "reject") return "Rejected";
  return "Pending";
}

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
    const normalizedStatus = normalizeStatus(app?.company_send_status ?? app?.status);
    return {
      id: app.id,
      name: app.name,
      email: app.email,
      position: String(app.position || "").replace(/_/g, " "),
      appliedDate: app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
      resumeLink: app.resume_url ?? "",
      status: normalizedStatus,
      applicant_user_id: applicantUserId || undefined,
    };
  });

  return formatted;
}

export function updateApplicationStatus(id: number, status: ApplicationStatus) {
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
