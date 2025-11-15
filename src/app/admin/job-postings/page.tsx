"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDeleteJobPosting,
  adminFilterJobPostingsByVerified,
  adminListAllJobPostings,
  adminUpdateJobPostingVerified,
  type AdminJobPosting,
} from "@/api/admin";
import { getCompanyProfileById } from "@/api/companyprofile";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_BRAND_COLOR } from "@/components/admin/AdminNavbar";

type VerificationTab = "all" | "verified" | "unverified";

type JobRow = {
  id: number;
  jobTitle: string;
  position: string;
  companyLabel: string;
  companyId?: number;
  location: string;
  jobType: string;
  verified: boolean;
  status: string;
  postedOn: string;
};

function mapJob(post: AdminJobPosting): JobRow {
  const raw: any = post as any;
  const createdAt = (post.created_at || raw.createdAt || raw.created_at || "") as string;
  const postedOn = createdAt ? new Date(createdAt).toLocaleDateString() : "—";
  const jobTitle = (post.job_title || raw.jobTitle || raw.title || "Untitled").toString();
  const position = (post.position || raw.position || jobTitle).toString();
  const jobType = (post.jobType || raw.jobType || raw.job_type || "Unspecified").toString();
  const workPlace = (post.work_place || raw.work_place || raw.workPlace || "").toString();
  const location = (
    post.location ||
    raw.location ||
    raw.job_location ||
    [workPlace, raw.country].filter(Boolean).join(" • ") ||
    "Unspecified"
  ).toString();
  const companyName =
    raw.company?.company_name ||
    raw.company_name ||
    raw.companyName ||
    raw.company_profile?.company_name ||
    raw.company?.name ||
    raw.company_profile?.name ||
    raw.company?.title ||
    "Unknown company";
  const verified =
    typeof post.verified === "boolean"
      ? post.verified
      : raw.verified === "true"
      ? true
      : Boolean(raw.verified);
  const status = (post.status || raw.status || (verified ? "Active" : "Draft")).toString();

  const companyId =
    typeof post.company_id === "number"
      ? post.company_id
      : raw.company_id != null
      ? Number(raw.company_id)
      : undefined;

  return {
    id: Number(post.id ?? raw.id ?? 0),
    jobTitle,
    position,
    companyLabel: companyName,
    companyId: Number.isFinite(companyId) ? companyId : undefined,
    location,
    jobType,
    verified,
    status,
    postedOn,
  };
}

export default function ManageJobPostingsPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();

  const [rows, setRows] = useState<JobRow[]>([]);
  const [tab, setTab] = useState<VerificationTab>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("All");
  const [companyNames, setCompanyNames] = useState<Record<number, string>>({});
  const pageSize = 6;

  const loadForTab = useCallback(async (target: VerificationTab) => {
    try {
      setLoading(true);
      setErr(null);
      let list: AdminJobPosting[];
      if (target === "verified") {
        list = await adminFilterJobPostingsByVerified(true);
      } else if (target === "unverified") {
        list = await adminFilterJobPostingsByVerified(false);
      } else {
        list = await adminListAllJobPostings();
      }
      setRows(list.map(mapJob));
    } catch (error: any) {
      setErr(error?.message || "Failed to load job postings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!user || (user.role || "").toLowerCase() !== "admin") {
      router.replace("/admin/login");
      return;
    }
    loadForTab(tab);
  }, [isReady, user, tab, router, loadForTab]);

  useEffect(() => {
    const idsToFetch = Array.from(
      new Set(
        rows
          .map((row) => row.companyId)
          .filter((id): id is number => typeof id === "number" && id > 0 && !companyNames[id]),
      ),
    );
    if (idsToFetch.length === 0) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        idsToFetch.map(async (companyId) => {
          try {
            const profile = await getCompanyProfileById(companyId, controller.signal);
            const label = profile?.company_name?.trim() || `Company #${companyId}`;
            return [companyId, label] as const;
          } catch (error) {
            if (controller.signal.aborted) return null;
            console.warn("[ManageJobPostings] Failed to fetch company profile", companyId, error);
            return [companyId, `Company #${companyId}`] as const;
          }
        }),
      );

      if (cancelled) return;
      setCompanyNames((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const entry of entries) {
          if (!entry) continue;
          const [companyId, label] = entry;
          if (next[companyId] !== label) {
            next[companyId] = label;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [rows, companyNames]);

  const handleVerifiedChange = async (id: number, next: boolean) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, verified: next } : row)));
    try {
      await adminUpdateJobPostingVerified(id, next);
      await loadForTab(tab);
    } catch (error: any) {
      setErr(error?.message || "Failed to update verification status");
      await loadForTab(tab);
    }
  };

  const handleDelete = async (id: number, label: string) => {
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(`Delete job posting "${label}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await adminDeleteJobPosting(id);
      await loadForTab(tab);
    } catch (error: any) {
      setErr(error?.message || "Failed to delete job posting");
    }
  };

  const jobTypes = useMemo(() => {
    const unique = Array.from(new Set(rows.map((row) => row.jobType).filter(Boolean)));
    return ["All", ...unique];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.jobTitle.toLowerCase().includes(q) ||
        row.position.toLowerCase().includes(q) ||
        row.companyLabel.toLowerCase().includes(q);
      const matchesType = typeFilter === "All" ? true : row.jobType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [rows, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const table = (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold">Manage Job Postings</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search job / company"
            className="h-10 w-56 rounded-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-full border px-3 text-sm"
          >
            {jobTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-3">
        {(
          [
            { id: "all", label: "All Postings" },
            { id: "verified", label: "Verified" },
            { id: "unverified", label: "Awaiting Review" },
          ] as { id: VerificationTab; label: string }[]
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm border ${
                active ? "text-white" : "hover:bg-gray-50"
              }`}
              style={{
                backgroundColor: active ? ADMIN_BRAND_COLOR : "white",
                borderColor: active ? ADMIN_BRAND_COLOR : "#e5e7eb",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: ADMIN_BRAND_COLOR }} className="text-white">
            <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
              <th className="w-64">Job Title</th>
              <th className="w-44">Position</th>
              <th className="w-40">Company</th>
              <th className="w-40">Location</th>
              <th className="w-32">Type</th>
              <th className="w-28">Verified</th>
              <th className="w-32">Status</th>
              <th className="w-32">Posted</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-gray-50">
            {current.map((row) => (
              <tr key={row.id} className="[&>td]:px-3 [&>td]:py-3">
                <td className="font-medium text-gray-900">
                  <Link
                    href={`/job/${row.id}`}
                    className="text-gray-900 underline-offset-2 hover:text-emerald-700 hover:underline"
                  >
                    {row.jobTitle}
                  </Link>
                </td>
                <td className="text-gray-700">{row.position}</td>
                <td className="text-gray-700">
                  {row.companyId ? (
                    <Link
                      href={`/company/${row.companyId}`}
                      className="text-gray-900 underline-offset-2 hover:text-emerald-700 hover:underline"
                    >
                      {companyNames[row.companyId] || row.companyLabel}
                    </Link>
                  ) : (
                    row.companyLabel
                  )}
                </td>
                <td className="text-gray-600">{row.location}</td>
                <td>
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {row.jobType}
                  </span>
                </td>
                <td>
                  <select
                    value={row.verified ? "true" : "false"}
                    onChange={(e) => handleVerifiedChange(row.id, e.target.value === "true")}
                    className="rounded-md border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </td>
                <td>{row.status}</td>
                <td>{row.postedOn}</td>
                <td>
                  <button
                    className="rounded-md border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(row.id, row.jobTitle)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {current.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                  No job postings match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-sm">
        <button
          className="rounded-md px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`rounded-md px-2 py-1 ${
              page === n ? "font-semibold underline" : "hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          className="rounded-md px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </main>
  );

  if (loading || !isReady) {
    return <div className="p-6">Loading…</div>;
  }

  if (err) {
    return <div className="p-6 text-red-600">{err}</div>;
  }

  return table;
}
