"use client";

import { useEffect, useState } from "react";
import ApplyModal from "@/components/ApplyModal";
import { listResumes, uploadResume } from "@/api/resume";
import { applyToJob } from "@/api/jobs";

type Job = {
  id: number;
  description: string;
  jobType: string;
  position: string;
  available_position: number;
  created_at: string;
  company: {
    id: number;
    company_name: string;
    location: string;
  };
};

type Resume = {
  id: string;
  name: string;
  updatedAt?: string;
  size?: string;
};

const GREEN = "#5b8f5b";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function FindJobPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [jobType, setJobType] = useState<string>("All");
  const [categories, setCategories] = useState<any[]>(["All"]);
  const [jobTypes, setJobTypes] = useState<any[]>(["All"]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]); // ✅ resume state

  // -------------------------------
  // Utility: fetch with token safely
  // -------------------------------
  const authFetch = async (url: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
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
  // Load dropdowns (category + jobType)
  // -------------------------------
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [catData, typeData] = await Promise.all([
          safeFetchJson(`${BASE_URL}/api/job-postings/category/`),
          safeFetchJson(`${BASE_URL}/api/job-postings/job-type/`),
        ]);

        const extractArray = (data: any) => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.data)) return data.data;
          if (Array.isArray(data?.categories)) return data.categories;
          if (Array.isArray(data?.job_types)) return data.job_types;
          if (Array.isArray(Object.values(data)[0])) return Object.values(data)[0];
          return [];
        };

        const catArray = extractArray(catData);
        const typeArray = extractArray(typeData);

        setCategories(["All", ...catArray]);
        setJobTypes(["All", ...typeArray]);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    }
    fetchDropdowns();
  }, []);

  // -------------------------------
  // Fetch job postings
  // -------------------------------
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (category !== "All") params.append("category", category);
      if (jobType !== "All") params.append("jobType", jobType);

      const token = localStorage.getItem("access_token");
      const url = `${BASE_URL}/api/job-postings/?${params.toString()}`;
      console.log("Fetching:", url);

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error detail:", text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      const jobList = data.job_postings || data.data || data;
      setJobs(jobList);
      if (jobList.length > 0) setSelectedId(jobList[0].id);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      setJobs([]);
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
    fetchResumes();
  }, []);

  // -------------------------------
  // Selected job
  // -------------------------------
  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  // -------------------------------
  // Apply handler
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
          alert("Please select a résumé.");
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
        alert("Unable to determine résumé to use.");
        return;
      }

      await applyToJob(selected.id, resumeIdToUse);
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
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword"
            className="h-10 w-[200px] flex-1 rounded-full border px-4 text-sm focus:outline-none focus:ring"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-[180px] rounded-full border px-3 text-sm"
          >
            {categories.map((c, i) => {
              const label =
                typeof c === "object"
                  ? c.label || c.name || c.title || c.value || "Unnamed"
                  : String(c);
              const value =
                typeof c === "object"
                  ? c.value || c.name || c.title || label
                  : String(c);
              return (
                <option key={`${i}-${value}`} value={value}>
                  {label}
                </option>
              );
            })}
          </select>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="h-10 w-[180px] rounded-full border px-3 text-sm"
          >
            {jobTypes.map((t, i) => {
              const label =
                typeof t === "object"
                  ? t.label || t.name || t.title || t.value || "Unnamed"
                  : String(t);
              const value =
                typeof t === "object"
                  ? t.value || t.name || t.title || label
                  : String(t);
              return (
                <option key={`${i}-${value}`} value={value}>
                  {label}
                </option>
              );
            })}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: GREEN }}
              onClick={fetchJobs}
            >
              Search
            </button>
            <button
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                setKeyword("");
                setCategory("All");
                setJobType("All");
                fetchJobs();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Job list + detail panel */}
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
                <button
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    active ? "ring-2" : ""
                  }`}
                  style={{
                    borderColor: GREEN,
                    boxShadow: active ? `0 0 0 2px ${GREEN}` : undefined,
                  }}
                >
                  <div className="font-semibold leading-5">{job.position}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {job.company?.company_name}
                    <br />
                    {job.company?.location}
                  </div>
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="mt-2 text-[11px] text-gray-500">
                    {job.available_position} position(s) • {job.jobType}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* Right panel */}
        <section
          className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm"
          style={{ borderColor: GREEN }}
        >
          {!selected ? (
            <div className="text-gray-600 text-sm">
              Select a job from the left panel.
            </div>
          ) : (
            <>
              <div
                className="inline-block rounded-lg px-3 py-2 text-white text-xs font-semibold"
                style={{ backgroundColor: GREEN }}
              >
                {selected.position}
              </div>
              <div className="mt-2 text-sm font-semibold">
                {selected.company?.company_name}, {selected.company?.location}
              </div>
              <p className="mt-4 text-sm text-gray-700">{selected.description}</p>
              <p className="mt-2 text-xs text-gray-500">
                Job Type: {selected.jobType}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Available Positions: {selected.available_position}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  className="rounded-full px-6 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: GREEN }}
                  onClick={() => setIsApplyOpen(true)}
                >
                  APPLY
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSubmit={handleApply}
        resumes={resumes} // ✅ connected to backend
        jobTitle={selected?.position}
        brandColor={GREEN}
      />
    </main>
  );
}
