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

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Failed to parse home API response", text);
    throw err;
  }
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

export async function fetchTopCompanies(options: FetchOptions = {}): Promise<FetchResult<TopCompany>> {
  const limit = options.limit ?? 3;
  const official = await fetchOfficialHome<TopCompany>("top-companies", "top_companies", options.cookieHeader);
  if (official?.length) {
    return { data: official.slice(0, limit), fallback: false };
  }
  return { data: [], fallback: true };
}

export async function fetchTopJobPostings(options: FetchOptions = {}): Promise<FetchResult<HomeJobPosting>> {
  const limit = options.limit ?? 6;
  const official = await fetchOfficialHome<HomeJobPosting>("top-job-postings", "top_job_postings", options.cookieHeader);
  if (official?.length) {
    return { data: official.slice(0, limit), fallback: false };
  }
  return { data: [], fallback: true };
}
