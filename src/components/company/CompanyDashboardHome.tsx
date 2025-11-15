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
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function relativeTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.max(0, Math.round((Date.now() - d.getTime()) / 86_400_000));
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
  fulltime: "bg-gray-100 text-gray-800 border-gray-200",
  parttime: "bg-gray-100 text-gray-800 border-gray-200",
  internship: "bg-gray-100 text-gray-800 border-gray-200",
  contract: "bg-gray-100 text-gray-800 border-gray-200",
  hybrid: "bg-gray-100 text-gray-800 border-gray-200",
  onsite: "bg-gray-100 text-gray-800 border-gray-200",
  online: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusBuckets = [
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];
function normalizeStatus(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}
function bucketizeAnalytics(applicants: CompanyApplicant[], stats?: CompanyDashboardStats | null) {
  const base = {
    applied: stats?.total_applicants ?? applicants.length,
    interview: 0,
    offer: 0,
    hired: 0,
  };
  applicants.forEach((a) => {
    const s = normalizeStatus(a.status);
    if (s === "requested") base.interview += 1;
    else if (s === "confirmed") base.offer += 1;
    else if (s === "approved") base.hired += 1;
  });
  return statusBuckets.map((b) => ({ ...b, value: base[b.key as keyof typeof base] }));
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
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, p, a] = await Promise.all([
          fetchCompanyStats(controller.signal),
          fetchCompanyActivePostings(controller.signal),
          fetchCompanyApplicants(controller.signal),
        ]);
        if (cancelled) return;
        setStats(s);
        setPostings(p);
        setApplicants(a);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const analytics = useMemo(() => bucketizeAnalytics(applicants, stats), [applicants, stats]);
  const analyticsMax = useMemo(
    () => Math.max(1, ...analytics.map((b) => b.value || 0)),
    [analytics],
  );
  const recentApplicants = useMemo(() => applicants.slice(0, 4), [applicants]);

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-7 w-52 rounded bg-gray-100 animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
            <div className="h-64 rounded-[22px] border bg-white shadow-sm" />
            <div className="h-64 rounded-[22px] border bg-white shadow-sm" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="h-64 rounded-[22px] border bg-white shadow-sm" />
            <div className="h-64 rounded-[22px] border bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
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
    <main className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* === Row 1: Summary + Active Job Postings === */}
        <section className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          {/* Summary card with four metrics */}
          <div className="rounded-[22px] border border-gray-300 bg-white px-6 py-6 shadow-sm">
            <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Summary</h2>

            <div className="mt-5 grid overflow-hidden rounded-[18px] border border-gray-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="px-6 py-7">
                    <p className="text-[13px] font-semibold text-gray-800">{card.label}</p>
                    <p className="mt-1 text-[56px] leading-none font-extrabold text-[#1c3318]">
                      {formatNumber(card.value)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Latest Updated: {formatDate(card.updated)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Job Postings */}
          <div className="rounded-[22px] border border-gray-300 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">
                Active Job Postings
              </h2>
              <Link
                href="/company/jobpostings"
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {postings.length === 0 && (
                <p className="rounded-[18px] border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No active roles yet.
                </p>
              )}

              {postings.slice(0, 3).map((job) => (
                <article
                  key={job.id}
                  className="rounded-[18px] border border-gray-300 bg-white px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: title + tags + details */}
                    <div>
                      <h3 className="text-[15px] font-extrabold text-gray-900">
                        {job.job_title || job.position || "Untitled role"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                        {job.jobType && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                              pillClasses[job.jobType.toLowerCase()] ??
                              "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {job.jobType}
                          </span>
                        )}
                        {job.work_place && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                              pillClasses[job.work_place.toLowerCase()] ??
                              "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {job.work_place}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-[13px] text-gray-800 leading-5">
                        <span className="font-semibold">Positions:</span>{" "}
                        {job.available_position ?? "—"}
                        <br />
                        <span className="font-semibold">Expected Salary:</span>{" "}
                        {salaryRange(job.minimum_expected_salary, job.maximum_expected_salary)}
                      </p>
                    </div>

                    {/* Right: time + status pill */}
                    <div className="flex flex-col items-end text-right">
                      <p className="text-[11px] text-gray-500">
                        {relativeTime(job.created_at ?? undefined)}
                      </p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-semibold text-white">
                        {job.status ?? "Active"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* === Row 2: Recent Applicants + Analytics === */}
        <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          {/* Recent Applicants */}
          <div className="rounded-[22px] border border-gray-300 bg-white px-6 py-6 shadow-sm">
            <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">
              Recent Applicants
            </h2>

            <div className="mt-5 space-y-3">
              {recentApplicants.length === 0 && (
                <p className="rounded-[18px] border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No applicants yet.
                </p>
              )}

              {recentApplicants.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-gray-300 bg-white px-4 py-3"
                >
                  <p className="font-medium text-gray-900">
                    {a.name} <span className="text-gray-600">— {a.position}</span>
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">
                      {a.status}
                    </span>

                    {a.applicant_user_id ? (
                      <Link
                        href={`/profile/${a.applicant_user_id}`}
                        className="rounded-full border border-gray-300 bg-gray-100 px-4 py-1 text-[12px] font-semibold text-gray-800 hover:bg-gray-200"
                      >
                        View Profile
                      </Link>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-4 py-1 text-[12px] text-gray-400">
                        Profile unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Snapshot */}
          <div className="rounded-[22px] border border-gray-300 bg-white px-6 py-6 shadow-sm">
            <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">
              Analytics Snapshot
            </h2>

            <div className="mt-6 grid grid-cols-4 gap-6">
              {analytics.map((bucket) => {
                const heightPct = bucket.value ? (bucket.value / analyticsMax) * 100 : 0;
                return (
                  <div key={bucket.key} className="flex flex-col items-center gap-3">
                    <div className="flex h-48 w-full items-end justify-center rounded border border-gray-300 bg-white px-3">
                      <div
                        className="w-10 rounded-sm"
                        style={{
                          height: `${Math.max(12, heightPct)}%`,
                          backgroundColor: "#3C7A3D",
                        }}
                      />
                    </div>
                    <div className="text-center text-sm font-semibold text-gray-900">
                      {bucket.label}
                    </div>
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
