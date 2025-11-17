"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE, buildInit } from "@/api/base";
import { useAuth } from "@/context/AuthContext";

type SummaryResponse = {
  total_job_postings?: number;
  last_updated_total_job_postings?: string | null;
  total_applicants?: number;
  last_updated_total_applicants?: string | null;
  new_applicants?: number;
  last_updated_new_applicants?: string | null;
  confirmed_applications?: number;
  last_updated_confirmed_applications?: string | null;
};

type JobPosting = {
  id: number;
  job_title: string;
  jobType?: string;
  work_place?: string;
  available_position?: number;
  minimum_expected_salary?: number | null;
  maximum_expected_salary?: number | null;
  created_at?: string;
};

type Applicant = {
  id: number;
  name?: string;
  position?: string;
  job_post?: { position?: string; job_title?: string };
  employee?: { first_name?: string; last_name?: string };
};

const SUMMARY_URL = `${API_BASE}/api/company/dashboard/overall`;
const ACTIVE_URL = `${API_BASE}/api/company/dashboard/active-postings`;
const APPLICANTS_URL = `${API_BASE}/api/company/job-applications`;

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isCompany = useMemo(() => (user?.role || "").toLowerCase().includes("company"), [user?.role]);
  const [summary, setSummary] = useState<SummaryResponse>({});
  const [activeJobs, setActiveJobs] = useState<JobPosting[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!isCompany) {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [summaryRes, activeRes, applicantsRes] = await Promise.all([
          fetch(SUMMARY_URL, buildInit({ credentials: "include" })),
          fetch(ACTIVE_URL, buildInit({ credentials: "include" })),
          fetch(APPLICANTS_URL, buildInit({ credentials: "include" })),
        ]);

        if (summaryRes.ok) {
          const json = await summaryRes.json().catch(() => ({}));
          setSummary(json?.data || json || {});
        }
        if (activeRes.ok) {
          const json = await activeRes.json().catch(() => []);
          setActiveJobs(Array.isArray(json?.data) ? json.data : json || []);
        }
        if (applicantsRes.ok) {
          const json = await applicantsRes.json().catch(() => []);
          const list = Array.isArray(json?.data) ? json.data : json || [];
          setRecentApplicants(list.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isReady, isCompany, router]);

  const analyticsBars = [
    { label: "Applied", value: summary.total_applicants ?? 0 },
    { label: "Interview", value: summary.new_applicants ?? 0 },
    { label: "Offer", value: summary.confirmed_applications ?? 0 },
    {
      label: "Hired",
      value: summary.confirmed_applications ?? 0,
    },
  ];
  const maxAnalyticsValue = Math.max(
    ...analyticsBars.map((bar) => bar.value ?? 0),
    1
  );

  if (!isReady) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!isCompany) return <div className="p-8 text-gray-500">Only company accounts can access this page.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Company Dashboard</h1>
          <p className="text-sm text-gray-500">Keep track of applicants and job postings</p>
        </div>
        <Link
          href="/company/jobpostings"
          className="rounded-full border border-midgreen-500 px-4 py-2 text-sm font-semibold text-midgreen-700 hover:bg-midgreen-50"
        >
          Manage Job Postings
        </Link>
      </header>

      {/* Summary + Active jobs */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Summary</h2>
          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              {[
                {
                  label: "Total Applicants",
                  value: summary.total_applicants ?? 0,
                  updatedAt: summary.last_updated_total_applicants,
                },
                {
                  label: "Job Postings",
                  value: summary.total_job_postings ?? 0,
                  updatedAt: summary.last_updated_total_job_postings,
                },
                {
                  label: "New Applicants",
                  value: summary.new_applicants ?? 0,
                  updatedAt: summary.last_updated_total_applicants ?? summary.last_updated_new_applicants,
                },
                {
                  label: "Confirmed",
                  value: summary.confirmed_applications ?? 0,
                  updatedAt: summary.last_updated_confirmed_applications,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 p-4">
                  <div className="text-4xl font-bold text-gray-900">{item.value}</div>
                  <div className="mt-2 text-sm text-gray-600">{item.label}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    Updated:{" "}
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Active Job Postings</h2>
          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Loading…</p>
          ) : activeJobs.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No active postings.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {job.job_title}
                      </p>
                      <div className="mt-1 text-sm text-gray-600">
                        Positions: {job.available_position ?? 1}
                      </div>
                      {(job.minimum_expected_salary || job.maximum_expected_salary) && (
                        <div className="text-sm text-gray-500">
                          Expected Salary: {job.minimum_expected_salary ?? "-"} –{" "}
                          {job.maximum_expected_salary ?? "-"}
                        </div>
                      )}
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    {job.jobType && (
                      <span className="rounded-full border border-gray-200 px-2 py-0.5">
                        {job.jobType}
                      </span>
                    )}
                    {job.work_place && (
                      <span className="rounded-full border border-gray-200 px-2 py-0.5">
                        {job.work_place}
                      </span>
                    )}
                    {job.created_at && (
                      <span className="text-gray-400">
                        Posted {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                          Math.round((new Date(job.created_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                          "day"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent applicants + Analytics */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Recent Applicants</h2>
          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Loading…</p>
          ) : recentApplicants.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No recent applicants.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {recentApplicants.map((app) => {
                const applicantName =
                  app.employee
                    ? `${app.employee.first_name ?? ""} ${app.employee.last_name ?? ""}`.trim()
                    : app.name ?? "Applicant";
                const role =
                  app.job_post?.position || app.job_post?.job_title || app.position || "—";
                return (
                  <li key={app.id} className="flex items-center justify-between py-3 text-sm text-gray-800">
                    <div>
                      <p className="font-medium">{applicantName || "Applicant"}</p>
                      <p className="text-gray-500">{role}</p>
                    </div>
                    <button className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                      View Profile
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Analytics Snapshot</h2>
          <div className="mt-4 grid h-48 grid-cols-4 items-end gap-4">
            {analyticsBars.map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-2">
                <div className="flex h-40 w-10 items-end">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-midgreen-200 to-midgreen-600 shadow-sm"
                    style={{
                      height: `${Math.max(
                        (bar.value / maxAnalyticsValue) * 100,
                        bar.value > 0 ? 8 : 2
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-sm font-semibold text-gray-700">{bar.value}</div>
                <span className="text-xs text-gray-500">{bar.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
