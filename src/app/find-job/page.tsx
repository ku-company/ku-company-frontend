"use client";

import { useEffect, useMemo, useState } from "react";
import ApplyModal from "@/components/ApplyModal";
import { useAuth } from "@/context/AuthContext";
import { useApplyCart } from "@/context/ApplyCartContext";
import { buildInit } from "@/api/base";

const GREEN = "#5b8f5b";
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function FindJobPage() {
  const { user } = useAuth();
  const { add } = useApplyCart();
  const [jobs, setJobs] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [jobType, setJobType] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [jobTypes, setJobTypes] = useState(["All"]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canApply = useMemo(
    () => (user?.role || "").toLowerCase() === "student",
    [user]
  );

  const fetchJson = async (url: string) => {
    try {
      const res = await fetch(url, buildInit({ credentials: "include" }));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ────────────────────────────── Fetch dropdown data ──────────────────────────────
  useEffect(() => {
    async function fetchDropdowns() {
      const cat = await fetchJson(`${BASE_URL}/api/job-postings/category`);
      const type = await fetchJson(`${BASE_URL}/api/job-postings/job-type`);

      setCategories([
        "All",
        ...(Array.isArray(cat?.data || cat) ? cat?.data || cat : []),
      ]);
      setJobTypes([
        "All",
        ...(Array.isArray(type?.data || type) ? type?.data || type : []),
      ]);
    }
    fetchDropdowns();
  }, []);

  // ────────────────────────────── Fetch jobs ──────────────────────────────
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (category !== "All") params.append("category", category);
      if (jobType !== "All") params.append("jobType", jobType);
      const url = `${BASE_URL}/api/job-postings/?${params.toString()}`;
      const res = await fetch(url, buildInit({ credentials: "include" }));
      const data = await res.json();
      const list = data.job_postings || data.data || data;
      setJobs(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) setSelectedId(list[0].id);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const selected = jobs.find((j) => j.id === selectedId);

  // ────────────────────────────── UI ──────────────────────────────
  return (
    <main className="min-h-screen bg-[#f7f9f7] py-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* ─────────────── Header Filter Section ─────────────── */}
        <div className="bg-white/80 backdrop-blur border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#5b8f5b] mb-5 tracking-tight">
            Find Your Dream Job
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input input-bordered input-sm rounded-full w-full sm:w-[240px] border-gray-200 focus:border-[#5b8f5b]"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select select-bordered select-sm rounded-full border-gray-200 focus:border-[#5b8f5b]"
            >
              {categories.map((c, i) => (
                <option key={i}>{c}</option>
              ))}
            </select>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="select select-bordered select-sm rounded-full border-gray-200 focus:border-[#5b8f5b]"
            >
              {jobTypes.map((t, i) => (
                <option key={i}>{t}</option>
              ))}
            </select>

            <div className="ml-auto flex gap-2">
              <button
                onClick={fetchJobs}
                className="btn btn-sm bg-[#5b8f5b] text-white rounded-full hover:bg-[#4a7a4a]"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setKeyword("");
                  setCategory("All");
                  setJobType("All");
                  setTimeout(fetchJobs, 0);
                }}
                className="btn btn-sm btn-outline rounded-full border-[#5b8f5b] text-[#5b8f5b] hover:bg-[#5b8f5b] hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────── Job List & Detail ─────────────── */}
        <div className="grid lg:grid-cols-[340px,1fr] gap-8">
          {/* Sidebar List */}
          <aside className="space-y-3">
            {loading ? (
              <div className="skeleton h-20 rounded-2xl"></div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-6 border border-gray-100 rounded-2xl bg-white/60 text-[#5b8f5b]">
                <p className="font-medium">No jobs found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters above.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={`cursor-pointer transition-all duration-300 rounded-2xl border ${
                    job.id === selectedId
                      ? "border-[#5b8f5b] bg-[#e8f3ea]"
                      : "border-gray-100 hover:border-[#5b8f5b]/50 hover:bg-[#f4faf5]"
                  }`}
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-[#5b8f5b]">
                      {job.position}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {job.company?.company_name} • {job.jobType}
                    </p>
                    <p className="text-xs text-gray-400">
                      {job.company?.location}
                    </p>
                  </div>
                </div>
              ))
            )}
          </aside>

          {/* Detail Section */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-6">
              {!selected ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                  <h3 className="text-lg font-medium text-[#5b8f5b] mb-1">
                    Select a Job
                  </h3>
                  <p className="text-sm">Click on a job from the left panel.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#5b8f5b]">
                    {selected.position}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selected.company?.company_name}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    {selected.company?.location}
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.description}
                  </p>

                  {/* ✅ ใช้ <hr> แทน divider เพื่อเลี่ยง bug */}
                  {selected && (
                    <hr className="my-5 border-t border-[#dcebdc]" />
                  )}

                  <p className="text-xs text-gray-600">
                    <b>Job Type:</b> {selected.jobType} •{" "}
                    {selected.available_position} position(s)
                  </p>

                  {canApply && (
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        className="btn btn-sm bg-[#5b8f5b] text-white rounded-full px-6 hover:bg-[#4a7a4a]"
                        onClick={() => setIsApplyOpen(true)}
                      >
                        Apply Now
                      </button>
                      <button
                        className="btn btn-sm btn-outline rounded-full border-[#5b8f5b] text-[#5b8f5b] hover:bg-[#5b8f5b] hover:text-white"
                        onClick={() => add(selected)}
                      >
                        Add to List
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─────────────── Apply Modal ─────────────── */}
      {canApply && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSubmit={() => {}}
          jobTitle={selected?.position}
          brandColor={GREEN}
          resumes={[]}
        />
      )}
    </main>
  );
}
