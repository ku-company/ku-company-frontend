import { API_BASE, buildInit, unwrap } from "./base";

export type CompanyDashboardStats = {
  total_job_postings: number;
  last_updated_total_job_postings: string | null;
  total_applicants: number;
  last_updated_total_applicants: string | null;
  new_applicants: number;
  confirmed_applications: number;
  last_updated_confirmed_applications: string | null;
};

export type CompanyJobPosting = {
  id: number;
  job_title: string | null;
  position: string | null;
  jobType?: string | null;
  work_place?: string | null;
  minimum_expected_salary?: number | null;
  maximum_expected_salary?: number | null;
  available_position?: number | null;
  created_at?: string | null;
  status?: string | null;
};

export type CompanyApplicant = {
  id: number;
  name: string;
  position: string;
  applied_at: string | null;
  status: string;
  applicant_user_id?: number | null;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, buildInit({ method: "GET", ...init }));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Failed to fetch ${path}: ${res.status}`);
  }
  const json = await res.json().catch(() => ({}));
  return unwrap<T>(json);
}

export async function fetchCompanyStats(signal?: AbortSignal): Promise<CompanyDashboardStats | null> {
  try {
    return await fetchJson<CompanyDashboardStats>("/api/company/dashboard/overall", { signal });
  } catch (error) {
    console.warn("Failed to load company stats", error);
    return null;
  }
}

export async function fetchCompanyActivePostings(signal?: AbortSignal): Promise<CompanyJobPosting[]> {
  try {
    return await fetchJson<CompanyJobPosting[]>("/api/company/dashboard/active-postings", { signal });
  } catch (error) {
    console.warn("Failed to load active postings", error);
    return [];
  }
}

type LooseRecord = Record<string, unknown>;

export async function fetchCompanyApplicants(signal?: AbortSignal): Promise<CompanyApplicant[]> {
  try {
    const list = await fetchJson<unknown[]>("/api/company/job-applications", { signal });
    return list
      .filter((raw): raw is LooseRecord => Boolean(raw) && typeof raw === "object")
      .map((app) => {
        const employee = (app.employee as LooseRecord | undefined) ?? {};
        const jobPost = (app.job_post as LooseRecord | undefined) ?? {};
        const employeeUser = (employee.user as LooseRecord | undefined) ?? {};
        const applicantUserId =
          (app.user_id as number | undefined) ??
          (employee.user_id as number | undefined) ??
          (employeeUser.id as number | undefined) ??
          null;
        const position =
          (app.position as string | undefined) ??
          (jobPost.position as string | undefined) ??
          (jobPost.job_title as string | undefined) ??
          "—";
        return {
          id: Number(app.id ?? 0),
          name: String(
            (app.name as string | undefined) ??
              (employeeUser.user_name as string | undefined) ??
              "Unknown applicant",
          ),
          position: String(position).replace(/_/g, " "),
          applied_at: (app.applied_at as string | undefined) ?? null,
          status: String((app.company_send_status as string | undefined) ?? "Pending"),
          applicant_user_id: applicantUserId,
        } as CompanyApplicant;
      });
  } catch (error) {
    console.warn("Failed to load applicants", error);
    return [];
  }
}
