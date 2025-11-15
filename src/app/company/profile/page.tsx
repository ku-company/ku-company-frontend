"use client";

import Image from "next/image";
import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { buildInit, API_BASE } from "@/api/base";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800 shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function CornerIcon({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
        {icon}
      </span>
      <div>
        <div className="text-xs font-medium text-gray-500 tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

// --- TEMP DATA (replace with API later) ---
const MOCK = {
  company_name: "Agoda Travel Co.",
  description: "We provide amazing travel experiences around the world.",
  industry: "Travel & Tourism",
  tel: "021234567",
  location: "Bangkok, Thailand",
};

export default function CompanyProfile() {
  // brand color (midgreen)
  const GREEN = "#5D9252";
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const BASE_URL = API_BASE;
  const API_URL_GET_ALL = `${BASE_URL}/api/company/job-postings/all`;

  // TODO: when API is ready, fetch company profile and hydrate UI:
  // const { data, isLoading } = useQuery(["companyProfile"], fetchCompanyProfile)
  // const company = data ?? MOCK;

  const company = MOCK;

  // load company's jobs for the right panel and summary
  useEffect(() => {
    const load = async () => {
      try {
        const headers: HeadersInit = user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {};
        const res = await fetch(API_URL_GET_ALL, buildInit({ credentials: "include", method: "GET", headers }));
        const data = await res.json().catch(() => ([] as any));
        const list = data?.data || data || [];
        setJobs(Array.isArray(list) ? list : []);
      } catch {
        setJobs([]);
      }
    };
    load();
  }, [user?.access_token]);

  const totalJobCount = jobs.length;
  // Placeholder applicants count (no endpoint here yet)
  const totalApplicants = 0;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Company Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Company card */}
        <aside className="relative rounded-2xl border-2 bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <CornerIcon title="Edit company profile" />
          <div className="flex flex-col items-center">
            <div className={`relative h-28 w-28 overflow-hidden rounded-full ring-4`} style={{ boxShadow: `inset 0 0 0 0 rgba(0,0,0,0.04)`, outline: `4px solid ${GREEN}22`, outlineOffset: 0 }}>
              <Image
                src="/company-logo.png"
                alt={`${company.company_name} logo`}
                fill
                className="object-cover"
              />
            </div>

            <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>
              {company.company_name}
            </h2>
            <div className="text-sm text-gray-600">{company.industry}</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">Verified</span>
              <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700 border">Company</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow icon={<MapPinIcon className="h-4 w-4" />} label="Location" value={company.location} />
            <InfoRow icon={<PhoneIcon className="h-4 w-4" />} label="Telephone" value={company.tel} />
            {/* Placeholder inputs to match mock */}
            <div className="space-y-3 pt-2">
              <div className="h-8 rounded-md bg-gray-100" />
              <div className="h-8 rounded-md bg-gray-100" />
              <div className="h-8 rounded-md bg-gray-100" />
            </div>
          </div>
        </aside>

        {/* Overview card */}
        <section className="md:col-span-2 space-y-6">
          <div
            className="relative rounded-2xl border-2 bg-white p-6 shadow-sm"
            style={{ borderColor: GREEN }}
          >
            <CornerIcon title="Edit company description" />
            <PillHeading>Company Overview</PillHeading>
            <p className="mt-3 text-[15px] leading-7 text-gray-700">
              {company.description}
            </p>
          </div>
        </section>
      </div>

      {/* Summary + Active Jobs */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section className="space-y-4 md:col-span-1">
          <h2 className="text-xl sm:text-2xl font-semibold">Summary</h2>
          <div className="grid gap-4">
            <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: GREEN }}>
              <div className="text-sm text-gray-600">Total Applicants</div>
              <div className="mt-1 text-5xl md:text-6xl font-extrabold tracking-tight">{totalApplicants}</div>
              <div className="mt-2 text-xs text-gray-500">Latest Updated: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: GREEN }}>
              <div className="text-sm text-gray-600">Job Postings</div>
              <div className="mt-1 text-5xl md:text-6xl font-extrabold tracking-tight">{totalJobCount}</div>
              <div className="mt-2 text-xs text-gray-500">Latest Updated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </section>

        <section className="md:col-span-2">
          <h2 className="text-xl sm:text-2xl font-semibold">Active Job Postings</h2>
          <div className="mt-4 space-y-4">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border-2 bg-white p-6 text-gray-600 shadow-sm" style={{ borderColor: GREEN }}>
                No active job posts.
              </div>
            ) : (
              jobs.map((job, i) => (
                <div key={job.id || i} className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: GREEN }}>
                  <div className="flex items-start justify-between">
                    <div className="pr-6">
                      <div className="text-lg font-semibold leading-6">{job.job_title || job.position || "Untitled"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {job.jobType ? <span className="rounded-full border px-2 py-0.5 text-gray-700">{String(job.jobType)}</span> : null}
                        {job.work_place ? <span className="rounded-full border px-2 py-0.5 text-gray-700">{String(job.work_place)}</span> : null}
                      </div>
                      <div className="mt-2 text-sm text-gray-700">Positions: {job.available_position ?? 1}</div>
                      {(job.minimum_expected_salary || job.maximum_expected_salary) && (
                        <div className="text-sm text-gray-700">Expected Salary: {job.minimum_expected_salary ?? "-"} - {job.maximum_expected_salary ?? "-"}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {job.created_at ? (
                        <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                          {`${Math.max(0, Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000*60*60*24)))} day(s) ago`}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-300 self-end">Active</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
