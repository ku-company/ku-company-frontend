

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";


function buildInit(init: RequestInit = {}): RequestInit {
  const token = (typeof window !== "undefined")
    ? localStorage.getItem("access_token")
    : null;


  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  return {
    credentials: "include", // <<< important for cookie-based auth
    ...init,
    headers,
  };
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
  const formatted = json.data.map((app: any) => ({
    id: app.id,
    name: app.name,
    email: app.email,
    position: app.position.replace(/_/g, " "), // make it readable
    appliedDate: new Date(app.applied_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    resumeLink: app.resume_url ?? "",
    status: app.company_send_status
  }));

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
