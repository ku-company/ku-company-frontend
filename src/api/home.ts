import { API_BASE } from "./base";

const BASE_URL = API_BASE.replace(/\/+$/, "");

export interface TopCompany {
  id: number;
  rank: number;
  user_id: number | null;
  company_name: string | null;
  description: string | null;
  location: string | null;
  country: string | null;
  job_post_count: number;
  profile_image_url: string | null;
}

export interface HomeJobPosting {
  id: number;
  job_title: string;
  position: string;
  description: string;
  jobType: string;
  available_position: number;
  created_at: string;
  work_place: string | null;
  minimum_expected_salary: number | null;
  maximum_expected_salary: number | null;
  expired_at: string | null;
  status: string;
  company_id: number;
  company_name: string | null;
  company_location: string | null;
  company_user_id?: number | null;
  company_profile_image: string | null;
  posted_ago: string;
}

let jobFeedPromise: Promise<HomeJobPosting[]> | null = null;

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Failed to parse home API response", text);
    throw err;
  }
}

async function fetchJobFeed(): Promise<HomeJobPosting[]> {
  if (!jobFeedPromise) {
    jobFeedPromise = (async () => {
      const res = await fetch(`${BASE_URL}/api/job-postings`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Failed to fetch job postings (${res.status})`);
      }
      const data = await parseJSON<{ job_postings?: HomeJobPosting[] }>(res);
      return data.job_postings ?? [];
    })();
  }
  return jobFeedPromise;
}

type FetchResult<T> = { data: T[]; fallback: boolean };

type FetchOptions = {
  limit?: number;
  cookieHeader?: string;
};

async function fetchOfficialHome<T>(endpoint: string, field: string, cookieHeader?: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/home/${endpoint}`, {
      next: { revalidate: 60 },
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[home] GET ${endpoint} failed:`, text || res.status);
      return null;
    }
    const data = await parseJSON<Record<string, unknown>>(res);
    const payload = (data as any)?.[field];
    return Array.isArray(payload) ? (payload as T[]) : null;
  } catch (err) {
    console.warn(`[home] GET ${endpoint} threw`, err);
    return null;
  }
}

async function fetchCompanyProfileUserId(companyProfileId: number): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/home/company-profile/${companyProfileId}`);
    if (!res.ok) {
      return null;
    }
    const json = await parseJSON<{ company_profile?: { user_id?: number } }>(res);
    const userId = json?.company_profile?.user_id;
    return typeof userId === "number" ? userId : null;
  } catch {
    return null;
  }
}

async function hydrateCompanyUserIds(companies: TopCompany[]) {
  const updated = await Promise.all(
    companies.map(async (company) => {
      if (company.user_id) return company;
      const userId = await fetchCompanyProfileUserId(company.id);
      return userId ? { ...company, user_id: userId } : company;
    })
  );
  return updated;
}

async function deriveTopCompanies(limit: number, cookieHeader?: string): Promise<TopCompany[]> {
  const jobs = await fetchJobFeed();
  const grouped = new Map<number, TopCompany>();

  jobs.forEach((job) => {
    if (!job.company_id && !job.company_user_id) return;
    if (!job.company_name) return;
    const key = job.company_id || job.company_user_id || job.id;
    const current = grouped.get(key) ?? {
      id: job.company_id || key,
      rank: 0,
      user_id: job.company_user_id ?? null,
      company_name: job.company_name,
      description: job.description ?? null,
      location: job.company_location ?? job.location ?? null,
      country: null,
      job_post_count: 0,
      profile_image_url: job.company_profile_image ?? null,
    };
    current.job_post_count += 1;
    if (!current.profile_image_url && job.company_profile_image) current.profile_image_url = job.company_profile_image;
    if (!current.location && (job.company_location || job.location)) current.location = job.company_location ?? job.location ?? null;
    if (!current.user_id && job.company_user_id) current.user_id = job.company_user_id;
    grouped.set(key, current);
  });

  let ranked = [...grouped.values()]
    .sort((a, b) => {
      if (b.job_post_count !== a.job_post_count) return b.job_post_count - a.job_post_count;
      return (b.company_name || "").localeCompare(a.company_name || "");
    })
    .map((company, index) => ({ ...company, rank: index + 1 }));

  ranked = ranked.slice(0, limit);
  if (ranked.some((c) => !c.user_id)) {
    ranked = await hydrateCompanyUserIds(ranked);
  }
  return ranked;
}

export async function fetchTopCompanies(options: FetchOptions = {}): Promise<FetchResult<TopCompany>> {
  const limit = options.limit ?? 3;
  const official = await fetchOfficialHome<TopCompany>("top-companies", "top_companies", options.cookieHeader);
  if (official?.length) {
    return { data: official.slice(0, limit), fallback: false };
  }
  const derived = await deriveTopCompanies(limit, options.cookieHeader);
  return { data: derived, fallback: true };
}

export async function fetchTopJobPostings(options: FetchOptions = {}): Promise<FetchResult<HomeJobPosting>> {
  const limit = options.limit ?? 6;
  const official = await fetchOfficialHome<HomeJobPosting>("top-job-postings", "top_job_postings", options.cookieHeader);
  if (official?.length) {
    return { data: official.slice(0, limit), fallback: false };
  }
  const jobs = await fetchJobFeed();
  return { data: jobs.slice(0, limit), fallback: true };
}
