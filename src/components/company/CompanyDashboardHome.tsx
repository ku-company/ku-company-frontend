"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchCompanyActivePostings,
  fetchCompanyApplicants,
  fetchCompanyStats,
  type CompanyApplicant,
  type CompanyDashboardStats,
  type CompanyJobPosting,
} from "@/api/companydashboard";

function formatNumber(value?: number | null) {
  if (value == null) return "0";
  return new Intl.NumberFormat().format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function relativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const days = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function salaryRange(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "—";
  const nf = new Intl.NumberFormat();
  if (min != null && max != null) return `${nf.format(min)} – ${nf.format(max)}`;
  return nf.format((min ?? max) as number);
}

const pillClasses: Record<string, string> = {
  fulltime: "bg-emerald-50 text-emerald-700 border-emerald-100",
  parttime: "bg-sky-50 text-sky-700 border-sky-100",
  internship: "bg-amber-50 text-amber-700 border-amber-100",
  contract: "bg-violet-50 text-violet-700 border-violet-100",
  hybrid: "bg-lime-50 text-lime-700 border-lime-100",
  onsite: "bg-orange-50 text-orange-700 border-orange-100",
  online: "bg-blue-50 text-blue-700 border-blue-100",
};

const statusBuckets = [
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

function normalizeStatus(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function bucketizeAnalytics(applicants: CompanyApplicant[], stats?: CompanyDashboardStats | null) {
  const base = {
    applied: stats?.total_applicants ?? applicants.length,
    interview: 0,
    offer: 0,
    hired: 0,
  };

  applicants.forEach((app) => {
    const status = normalizeStatus(app.status);
    if (status === "requested") base.interview += 1;
    else if (status === "confirmed") base.offer += 1;
    else if (status === "approved") base.hired += 1;
  });

  return statusBuckets.map((bucket) => ({
    ...bucket,
    value: base[bucket.key as keyof typeof base],
  }));
}

export default function CompanyDashboardHome() {
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [postings, setPostings] = useState<CompanyJobPosting[]>([]);
  const [applicants, setApplicants] = useState<CompanyApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      const [statsRes, postingsRes, applicantsRes] = await Promise.all([
        fetchCompanyStats(controller.signal),
        fetchCompanyActivePostings(controller.signal),
        fetchCompanyApplicants(controller.signal),
      ]);
      if (cancelled) return;
      setStats(statsRes);
      setPostings(postingsRes);
      setApplicants(applicantsRes);
      setLoading(false);
    }
    load().catch((err) => {
      if (cancelled) return;
      console.error("Failed to load company dashboard", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      setLoading(false);
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const analytics = useMemo(() => bucketizeAnalytics(applicants, stats), [applicants, stats]);
  const analyticsMax = useMemo(
    () => Math.max(1, ...analytics.map((bucket) => bucket.value || 0)),
    [analytics],
  );
  const recentApplicants = useMemo(() => applicants.slice(0, 4), [applicants]);

  if (loading) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="space-y-4">
          <div className="h-6 w-44 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border bg-white px-4 py-6 shadow-sm">
                <div className="h-10 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-rose-700">
          {error}
        </div>
      </main>
    );
  }

  const summaryCards = [
    {
      label: "Total Applicants",
      value: stats?.total_applicants ?? applicants.length,
      updated: stats?.last_updated_total_applicants,
    },
    {
      label: "Job Postings",
      value: stats?.total_job_postings ?? postings.length,
      updated: stats?.last_updated_total_job_postings,
    },
    {
      label: "New Applicants",
      value: stats?.new_applicants ?? 0,
      updated: stats?.last_updated_total_applicants,
    },
    {
      label: "Shortlisted",
      value: stats?.confirmed_applications ?? 0,
      updated: stats?.last_updated_confirmed_applications,
    },
  ];

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-[28px] border-2 border-gray-900/20 bg-white px-8 py-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-900">Summary</h2>
            <div className="mt-6 grid divide-x divide-y divide-gray-200 text-gray-900 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <div key={card.label} className="flex flex-col gap-2 px-6 py-8">
                  <p className="text-base font-semibold text-gray-800">{card.label}</p>
                  <p className="text-5xl font-semibold text-[#1C3318]">{formatNumber(card.value)}</p>
                  <p className="text-xs text-gray-500">Latest Updated: {formatDate(card.updated)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border-2 border-gray-900/20 bg-white px-8 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Active Job Postings</h2>
              <Link href="/company/jobpostings" className="text-sm font-semibold text-emerald-700 hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {postings.length === 0 && (
                <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No active roles yet.
                </p>
              )}
              {postings.slice(0, 3).map((job) => (
                <article
                  key={job.id}
                  className="rounded-[28px] border-2 border-gray-900/20 px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.job_title || job.position || "Untitled role"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                        {job.jobType && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${pillClasses[job.jobType.toLowerCase()] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
                            {job.jobType}
                          </span>
                        )}
                        {job.work_place && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${pillClasses[job.work_place.toLowerCase()] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
                            {job.work_place}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-gray-700">
                        Positions: <span className="font-semibold">{job.available_position ?? "—"}</span>
                        <br />
                        Expected Salary:{" "}
                        <span className="font-semibold">
                          {salaryRange(job.minimum_expected_salary, job.maximum_expected_salary)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <p className="text-xs text-gray-500">{relativeTime(job.created_at ?? undefined)}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                        {job.status ?? "Active"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[28px] border-2 border-gray-900/20 bg-white px-8 py-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Applicants</h2>
            <div className="mt-5 space-y-3">
              {recentApplicants.length === 0 && (
                <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No applicants yet.
                </p>
              )}
              {recentApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border-2 border-gray-900/20 px-4 py-3"
                >
                  <p className="font-medium text-gray-900">
                    {applicant.name} <span className="text-gray-600">— {applicant.position}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {applicant.status}
                    </span>
                    {applicant.applicant_user_id ? (
                      <Link
                        href={`/profile/${applicant.applicant_user_id}`}
                        className="rounded-full bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        View Profile
                      </Link>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-4 py-1 text-xs text-gray-400">Profile unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border-2 border-gray-900/20 bg-white px-8 py-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Analytics Snapshot</h2>
            <div className="mt-8 grid grid-cols-4 gap-6">
              {analytics.map((bucket) => {
                const height = bucket.value ? (bucket.value / analyticsMax) * 100 : 0;
                return (
                  <div key={bucket.key} className="flex flex-col items-center gap-3">
                    <div className="flex h-48 w-full items-end justify-center border border-gray-300 bg-gradient-to-b from-gray-50 to-white px-3">
                      <div
                        className="w-10 bg-[#3C7A3D]"
                        style={{ height: `${Math.max(12, height)}%` }}
                      />
                    </div>
                    <div className="text-center text-sm font-semibold text-gray-900">{bucket.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
