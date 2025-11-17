"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuildingOfficeIcon, MapPinIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, MegaphoneIcon } from "@heroicons/react/24/outline";
// import ApplyModal from "@/components/ApplyModal"; // replaced by full apply page
import Markdown from "@/components/Markdown";
import { listResumes, uploadResume } from "@/api/resume";
import { applyToJob } from "@/api/jobs";
import { buildInit, API_BASE } from "@/api/base";
import { useAuth } from "@/context/AuthContext";
import { useApplyCart } from "@/context/ApplyCartContext";
import { listMyApplications } from "@/api/applications";
import { getAuthMe } from "@/api/user";
import { repostJobPosting } from "@/api/professorrepost";

type Job = {
  id: number;
  job_title: string;
  description: string;
  jobType: string;
  position: string;
  available_position: number;
  created_at: string | Date;
  company_id?: number;
  company_name: string | null;
  company_location: string | null;
  location?: string | null;
  company_profile_image?: string | null;
  work_place?: string | null;
  minimum_expected_salary?: number | null;
  maximum_expected_salary?: number | null;
  expired_at?: string | Date | null;
  company_user_id?: number;
};

type Resume = {
  id: string;
  name: string;
  updatedAt?: string;
  size?: string;
};

const GREEN = "#5b8f5b";
const NEW_FOR_YOU_WINDOW_DAYS = 7;
const APPLY_JOB_STORAGE_KEY = "ku-company/apply/selected-job";

const normalizeJobTypeValue = (input: string) => {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return "All";
  if (!/[\s_-]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
};

// Strip basic Markdown syntax for compact previews (left list)
function stripMarkdown(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);
  // Remove fenced code blocks
  s = s.replace(/```[\s\S]*?```/g, " ");
  // Inline code
  s = s.replace(/`([^`]+)`/g, "$1");
  // Images ![alt](url) → alt
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Headings ### Title → Title
  s = s.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  // Blockquotes > text → text
  s = s.replace(/^\s{0,3}>\s?/gm, "");
  // Lists -/+/* or numbered → text
  s = s.replace(/^\s*[-*+]\s+/gm, "");
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  // Emphasis **__*_ → remove markers
  s = s.replace(/\*\*|__|\*|_/g, "");
  // Horizontal rules and extra newlines
  s = s.replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, " ");
  s = s.replace(/\r?\n+/g, " ");
  return s.trim();
}
const BASE_URL = API_BASE;

export default function FindJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { add, contains } = useApplyCart();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [jobType, setJobType] = useState<string>("All");
  const [jobTypes, setJobTypes] = useState<any[]>(["All"]);
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [showNewForYou, setShowNewForYou] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false); // legacy: kept to reduce changes
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]); //  resume state
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [verifyRequired, setVerifyRequired] = useState(false);
  const [isProfVerified, setIsProfVerified] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteJob, setQuoteJob] = useState<Job | null>(null);
  const [quoteContent, setQuoteContent] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);
  const [quoteIsConnection, setQuoteIsConnection] = useState(false);

  const canApply = useMemo(() => (user?.role || "").toLowerCase() === "student", [user]);
  const isProfessor = useMemo(
    () => (user?.role || "").toLowerCase().includes("professor"),
    [user?.role]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isProfessor) {
          setIsProfVerified(false);
          return;
        }
        const me = await getAuthMe().catch(() => null as any);
        if (!cancelled) {
          const verified =
            Boolean(
              me?.verified ||
              me?.verify ||
              me?.verified_status ||
              me?.user?.verified
            );
          setIsProfVerified(verified);
        }
      } catch {
        if (!cancelled) setIsProfVerified(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isProfessor]);

  const handleApplyNavigation = useCallback(
    (job: Job) => {
      if (!job?.id) return;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            APPLY_JOB_STORAGE_KEY,
            JSON.stringify({ job, cachedAt: Date.now() })
          );
        } catch {
          // storage may be unavailable; continue navigation
        }
      }
      router.push(`/apply/${job.id}`);
    },
    [router]
  );

  const sortJobs = (list: Job[]) => {
    const sortKey = (sortBy || "Newest").toLowerCase();
    return [...list].sort((a, b) => {
      if (sortKey.includes("newest")) {
        return new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime();
      }
      if (sortKey.includes("oldest")) {
        return new Date(a.created_at as any).getTime() - new Date(b.created_at as any).getTime();
      }
      return 0;
    });
  };

  const filterNewForYou = (list: Job[], onlyNew: boolean) => {
    if (!onlyNew) return list;
    const cutoff = Date.now() - NEW_FOR_YOU_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return list.filter((job) => {
      const created = new Date(job.created_at as any).getTime();
      return Number.isFinite(created) ? created >= cutoff : false;
    });
  };

  const syncVisibleJobs = useCallback(
    (baseList: Job[]) => {
      const keywordTerm = keyword.trim().toLowerCase();
      let list = baseList;
      if (jobType !== "All") {
        list = list.filter(
          (job) =>
            normalizeJobTypeValue(job.jobType || "").toLowerCase() ===
            normalizeJobTypeValue(jobType).toLowerCase()
        );
      }
      if (keywordTerm) {
        list = list.filter((job) => {
          const haystack = [
            job.job_title,
            job.position,
            job.company_name,
            job.description,
            job.location,
            job.company_location,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(keywordTerm);
        });
      }
      const sorted = sortJobs(list);
      const visible = filterNewForYou(sorted, showNewForYou);
      setJobs(visible);
      setSelectedId((prev) => {
        if (!visible.length) return null;
        return prev && visible.some((job) => job.id === prev) ? prev : visible[0].id;
      });
    },
    [showNewForYou, sortBy, jobType, keyword]
  );

  useEffect(() => {
    syncVisibleJobs(allJobs);
  }, [allJobs, syncVisibleJobs]);
  function openQuote(job: Job, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setQuoteJob(job);
    setQuoteContent("");
    setQuoteOpen(true);
    setQuoteNotice(null);
    setQuoteIsConnection(false);
  }

  async function postQuote() {
    if (!quoteJob || !quoteContent.trim()) return;
    setQuoteSubmitting(true);
    try {
      // Use repost endpoint with job posting id
      await repostJobPosting(quoteJob.id, { content: quoteContent.trim(), is_connection: quoteIsConnection });
      setQuoteOpen(false);
      setQuoteJob(null);
      setQuoteContent("");
      setQuoteNotice("Reposted job successfully.");
      setTimeout(() => setQuoteNotice(null), 3000);
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to post announcement");
      setQuoteNotice(msg);
    } finally {
      setQuoteSubmitting(false);
    }
  }

  // Utility: fetch with token safely
  const authFetch = async (url: string) => {
    const res = await fetch(url, buildInit({ credentials: "include" }));
    return res;
  };

  const safeFetchJson = async (url: string) => {
    try {
      const res = await authFetch(url);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`[${url}] Not JSON:`, text.slice(0, 100));
        return [];
      }
    } catch (err) {
      console.error("safeFetchJson error", err);
      return [];
    }
  };

  // -------------------------------
  // Load job type dropdown
  // -------------------------------
  useEffect(() => {
    async function fetchJobTypes() {
      try {
        const typeData = await safeFetchJson(`${BASE_URL}/api/job-postings/job-type`);

        const extractArray = (data: any) => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.data)) return data.data;
          if (Array.isArray(data?.jobTypes)) return data.jobTypes;
          if (Array.isArray(data?.job_types)) return data.job_types;
          if (data && typeof data === "object") {
            const first = Object.values(data)[0];
            if (Array.isArray(first)) return first;
          }
          return [];
        };

        const typeArray = extractArray(typeData);
        setJobTypes(["All", ...typeArray]);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    }
    fetchJobTypes();
  }, []);

  // -------------------------------
  // Fetch job postings
  // -------------------------------
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const keywordToUse = keyword.trim();
      const jobTypeToUse = jobType;
      const params = new URLSearchParams();
      if (keywordToUse) params.append("keyword", keywordToUse);
      if (jobTypeToUse !== "All") params.append("jobType", normalizeJobTypeValue(jobTypeToUse));

      const url = `${BASE_URL}/api/job-postings/?${params.toString()}`;
      console.log("Fetching:", url);

      const res = await fetch(url, buildInit({ credentials: "include" }));

      if (!res.ok) {
        const text = await res.text();
        // If backend requires verification, show friendly message instead of list
        if (/please\s+verify\s+your\s+account/i.test(text)) {
          setVerifyRequired(true);
          setAllJobs([]);
          setJobs([]);
          setSelectedId(null);
          return;
        }
        console.error("Server error detail:", text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      const jobList = (data.job_postings || data.data || data) as Job[];
      const now = Date.now();
      const filtered = (jobList || []).filter((j) => {
        if (!j?.expired_at) return true;
        const exp = new Date(j.expired_at as any).getTime();
        return isFinite(exp) ? exp >= now : true;
      });
      setAllJobs(filtered);
      setVerifyRequired(false);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      setAllJobs([]);
      setJobs([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Fetch resumes from backend
  // -------------------------------
  const fetchResumes = async () => {
    try {
      const resumeList = await listResumes();
      const mapped = (resumeList || []).map((r: any) => ({
        id: String(r.id),
        name: r.name || "Unnamed Resume",
      }));
      setResumes(mapped);
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (canApply) {
      fetchResumes();
      (async () => {
        try {
          const apps = await listMyApplications();
          const ids = new Set<number>();
          (apps || []).forEach((a: any) => {
            if (typeof a?.job_id === "number") ids.add(a.job_id);
            else if (typeof a?.job_post?.id === "number") ids.add(a.job_post.id);
          });
          setAppliedIds(ids);
        } catch {
          // ignore access issues
        }
      })();
    } else {
      setResumes([]);
      setAppliedIds(new Set());
    }
  }, [canApply]);

  // -------------------------------
  // Selected job
  // -------------------------------
  const selected = jobs.find((j) => j.id === selectedId) ?? null;
  const postedDays = useMemo(() => {
    if (!selected?.created_at) return null;
    const created = new Date(selected.created_at as any).getTime();
    const days = Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
    return days;
  }, [selected?.created_at]);

  // -------------------------------
  // Apply handler (legacy for modal, no longer used from UI)
  // -------------------------------
  const handleApply = async (payload: {
    mode: "existing" | "upload";
    resumeId?: string;
    file?: File;
  }) => {
    try {
      if (!selected?.id) {
        alert("Please select a job first.");
        return;
      }

      let resumeIdToUse: number | null = null;

      if (payload.mode === "existing") {
        if (!payload.resumeId) {
          alert("Please select a resume.");
          return;
        }
        resumeIdToUse = parseInt(payload.resumeId, 10);
      } else if (payload.mode === "upload") {
        if (!payload.file) {
          alert("Please choose a file to upload.");
          return;
        }
        const uploaded = await uploadResume(payload.file);
        resumeIdToUse = (uploaded as any)?.id as number;
      }

      if (!resumeIdToUse) {
        alert("Unable to determine resume to use.");
        return;
      }

      await applyToJob(selected.id, resumeIdToUse);
      setAppliedIds((prev) => new Set<number>([...Array.from(prev), selected.id!]));
      setIsApplyOpen(false);
      alert("Application submitted successfully.");
    } catch (err: any) {
      console.error("Apply failed", err);
      alert(typeof err?.message === "string" ? err.message : "Failed to submit application.");
    }
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Bar */}
      <section
        className="rounded-2xl border bg-white p-3 sm:p-4 shadow-sm"
        style={{ borderColor: GREEN }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Left controls: keyword + dropdowns */}
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword"
            className="h-11 min-w-[220px] max-w-[360px] flex-shrink rounded-full border px-4 text-sm bg-gray-50 focus:outline-none"
          />

          <select
            value={jobType}
            aria-label="Job type"
            onChange={(e) => setJobType(e.target.value)}
            className="h-11 w-[160px] rounded-full border px-3 text-sm bg-gray-50"
          >
            {jobTypes.map((t, i) => {
              const label =
                typeof t === "object"
                  ? t.label || t.name || t.title || t.value || "Unnamed"
                  : String(t);
              const rawValue =
                typeof t === "object"
                  ? t.value || t.name || t.title || label
                  : String(t);
              const value =
                rawValue.toLowerCase() === "all"
                  ? "All"
                  : normalizeJobTypeValue(rawValue);
              return (
                <option key={`${i}-${value}`} value={value}>
                  {label}
                </option>
              );
            })}
          </select>

          {/* Search icon button */}
          <button
            aria-label="Search"
            onClick={fetchJobs}
            className="grid h-11 w-11 place-items-center rounded-full text-white"
            style={{ backgroundColor: GREEN }}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {/* Right controls: filter chips */}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
              onClick={() => { setJobType("All"); fetchJobs(); }}
            >
              All Positions
            </button>
            <button
              className={`rounded-full border px-5 py-2 text-sm ${showNewForYou ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              onClick={() => setShowNewForYou((prev) => !prev)}
              aria-pressed={showNewForYou}
            >
              New for You
            </button>
            <button
              className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                setKeyword('');
                setJobType("All");
                setSortBy('Newest');
                fetchJobs();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Job list + detail panel */}
      {verifyRequired ? (
        <div className="py-24 text-center text-lg text-gray-700">You have to verify to use this</div>
      ) : (
      <div className="mt-6 grid gap-6 lg:grid-cols-[420px,1fr]">
        <aside className="space-y-3">
          {loading ? (
            <div className="text-gray-600 text-sm">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border p-6 text-sm text-gray-600">
              No jobs match your filters.
            </div>
          ) : (
            jobs.map((job) => {
              const active = job.id === selectedId;
              return (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(job.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(job.id); }}
                  className={`relative w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    active ? "ring-2" : ""
                  }`}
                  style={{
                    borderColor: GREEN,
                    boxShadow: active ? `0 0 0 2px ${GREEN}` : undefined,
                  }}
                >
                  {isProfessor && isProfVerified && (
                    <button
                      type="button"
                      onClick={(e) => openQuote(job, e)}
                      className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-md border bg-white text-emerald-700 hover:bg-emerald-50"
                      title="Repost this job"
                    >
                      <MegaphoneIcon className="h-4 w-4" />
                    </button>
                  )}
                  <div className="absolute right-6 top-2 h-14 w-14 overflow-hidden rounded-full border bg-white shadow-sm">
                    {job.company_profile_image ? (
                      // Company profile image from backend
                      <img
                        src={job.company_profile_image}
                        alt={(job.company_name || 'Company') + ' logo'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-emerald-50 text-emerald-700">
                        <span className="text-sm font-semibold">{(job.company_name || "?").slice(0,1).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pr-14">
                    <div className="font-semibold leading-5 break-words line-clamp-3 text-[15px]">{job.job_title || job.position}</div>
                    <div className="mt-1 text-sm text-gray-600 break-words">
                      {job.company_user_id ? (
                        <Link className="hover:underline cursor-pointer" href={`/profile/${job.company_user_id}`} target="_blank" rel="noopener noreferrer">
                          {job.company_name}
                        </Link>
                      ) : (
                        job.company_name
                      )}
                    </div>
                    <div className="text-xs text-gray-500 break-words">{job.location ?? job.company_location}</div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 line-clamp-3 break-words">
                    {stripMarkdown(job.description)}
                  </p>
                  <div className="mt-2 text-[11px] text-gray-500">
                    {job.available_position} position(s) | {job.jobType}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right panel */}
        <section
          className="relative rounded-2xl border bg-white p-5 sm:p-6 shadow-sm sticky top-20 max-h-[72vh] overflow-y-auto break-words"
          style={{ borderColor: GREEN }}
        >
          {!selected ? (
            <div className="text-gray-600 text-sm">
              Select a job from the left panel.
            </div>
          ) : (
            <>
              {/* Header with logo + title */}
              <div className="pr-20">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full border bg-white shadow-sm flex-shrink-0">
                    {selected.company_profile_image ? (
                      <img src={selected.company_profile_image} alt={(selected.company_name || 'Company') + ' logo'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-emerald-50 text-emerald-700">
                        <span className="text-sm font-semibold">{(selected.company_name || "?").slice(0,1).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-semibold">{selected.job_title || selected.position}</h2>
                      {selected?.id && (
                        <Link href={`/job/${selected.id}`} className="inline-flex items-center justify-center rounded-full border p-1 text-gray-600 hover:bg-gray-50" title="Open job details">
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {isProfessor && isProfVerified && (
                        <button
                          type="button"
                          onClick={(e) => openQuote(selected, e)}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          <MegaphoneIcon className="h-4 w-4" />
                          Repost
                        </button>
                      )}
                      {/* Small chips next to title */}
                      <span className="ml-2 inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs">
                        {selected.jobType || '-'}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs">
                        {selected.work_place || '-'}
                      </span>
                    </div>
                    <div className="text-base text-gray-600 break-words flex items-center gap-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      {selected.company_user_id ? (
                        <Link className="hover:underline cursor-pointer" href={`/profile/${selected.company_user_id}`} target="_blank" rel="noopener noreferrer">
                          {selected.company_name}
                        </Link>
                      ) : (
                        selected.company_name
                      )}
                    </div>
                    <div className="text-sm text-gray-500 break-words flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {selected.location ?? selected.company_location}
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        {postedDays !== null ? `Posted ${postedDays} day(s) ago` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                {canApply && (
                  <div className="mt-3 flex items-center gap-2">
                    {(() => {
                      const isApplied = !!selected && appliedIds.has(selected.id);
                      const isInCart = !!selected && contains(selected.id);
                      return (
                        <>
                        <button
                          disabled={isApplied}
                          className={`h-9 rounded-full px-5 text-xs font-semibold text-white ${isApplied ? 'opacity-60 cursor-not-allowed' : ''}`}
                          style={{ backgroundColor: GREEN }}
                          onClick={!isApplied ? () => selected && handleApplyNavigation(selected) : undefined}
                        >
                          {isApplied ? 'APPLIED' : 'Apply'}
                        </button>
                          <button
                            disabled={isApplied || isInCart}
                            className={`h-9 rounded-full border px-4 text-xs ${isApplied || isInCart ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                            onClick={() => selected && add(selected)}
                          >
                            {isInCart ? 'Added to list' : 'Add to list'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-gray-600">
                <div>Available Positions: {selected.available_position}</div>
                <div>
                  Expected Salary: {
                    typeof selected.minimum_expected_salary === 'number' && typeof selected.maximum_expected_salary === 'number'
                      ? `${selected.minimum_expected_salary.toLocaleString()} - ${selected.maximum_expected_salary.toLocaleString()}`
                      : '-'
                  }
                </div>
              </div>
              <Markdown className="mt-4 text-base text-gray-700" content={selected.description} />

              {/* Keep actions near top per new layout; no duplicate bottom buttons */}
            </>
          )}
        </section>
      </div>
      )}

      {isProfessor && isProfVerified && quoteOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onClick={() => !quoteSubmitting && setQuoteOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-lg"
            style={{ borderColor: GREEN }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="h-5 w-5 text-emerald-700" />
              <div className="font-semibold">Repost job</div>
            </div>
            {quoteJob?.id && (
              <div className="mt-2 text-sm">
                <Link
                  className="text-emerald-700 font-medium hover:underline"
                  href={`/job/${quoteJob.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {quoteJob.job_title || quoteJob.position}
                </Link>
                {quoteJob.company_name ? (
                  <span className="text-gray-600"> · {quoteJob.company_name}</span>
                ) : null}
              </div>
            )}
            <textarea
              className="mt-3 w-full h-36 resize-none border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={quoteIsConnection}
                onChange={(e) => setQuoteIsConnection(e.target.checked)}
              />
              I have a connection with this job post
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setQuoteOpen(false)}
                disabled={quoteSubmitting}
              >
                Cancel
              </button>
              <button
                className="rounded-md px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: GREEN }}
                onClick={postQuote}
                disabled={quoteSubmitting || !quoteContent.trim()}
              >
                {quoteSubmitting ? "Reposting…" : "Repost"}
              </button>
            </div>
          </div>
        </div>
      )}

      {quoteNotice && (
        <div
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-md border bg-white px-4 py-2 text-sm shadow"
          style={{ borderColor: GREEN }}
        >
          {quoteNotice}
        </div>
      )}
    </main>
  );
}

