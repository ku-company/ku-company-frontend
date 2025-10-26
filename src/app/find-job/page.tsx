"use client";

import { useEffect, useMemo, useState } from "react";
import ApplyModal from "@/components/ApplyModal";
import { useAuth } from "@/context/AuthContext";
import { useApplyCart } from "@/context/ApplyCartContext";
import { buildInit } from "@/api/base";

const GREEN = "#5b8f5b";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

  const canApply = useMemo(() => (user?.role || "").toLowerCase() === "student", [user]);

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

  useEffect(() => {
    async function fetchDropdowns() {
      const cat = await fetchJson(`${BASE_URL}/api/job-postings/category`);
      const type = await fetchJson(`${BASE_URL}/api/job-postings/job-type`);
      setCategories(["All", ...(cat?.data || cat)]);
      setJobTypes(["All", ...(type?.data || type)]);
    }
    fetchDropdowns();
  }, []);

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
      setJobs(list);
      if (list.length > 0) setSelectedId(list[0].id);
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

  return (
    <main className="min-h-screen bg-white py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#5b8f5b] mb-4">
            Find Your Dream Job
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input input-bordered input-sm rounded-full w-full sm:w-[240px] focus:border-[#5b8f5b]"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select select-bordered select-sm rounded-full focus:border-[#5b8f5b]"
            >
              {categories.map((c, i) => (
                <option key={i}>{c}</option>
              ))}
            </select>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="select select-bordered select-sm rounded-full focus:border-[#5b8f5b]"
            >
              {jobTypes.map((t, i) => (
                <option key={i}>{t}</option>
              ))}
            </select>
            <div className="ml-auto flex gap-2">
              <button
                onClick={fetchJobs}
                className="btn btn-sm bg-[#5b8f5b] text-white rounded-full hover:bg-emerald-700"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setKeyword("");
                  setCategory("All");
                  setJobType("All");
                  fetchJobs();
                }}
                className="btn btn-sm btn-outline rounded-full border-[#5b8f5b] text-[#5b8f5b] hover:bg-[#5b8f5b] hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[360px,1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-3">
            {loading ? (
              <div className="skeleton h-20 rounded-2xl"></div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-6 border border-emerald-100 rounded-2xl bg-emerald-50 text-[#5b8f5b]">
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
                  className={`card cursor-pointer transition-all duration-300 ${
                    job.id === selectedId
                      ? "border border-[#5b8f5b] bg-emerald-50"
                      : "border border-emerald-100 hover:border-[#5b8f5b]/40"
                  }`}
                >
                  <div className="card-body py-4">
                    <h3 className="font-medium text-[#5b8f5b]">{job.position}</h3>
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

          {/* Detail */}
          <section className="card border border-emerald-100 rounded-2xl bg-white shadow-sm">
            <div className="card-body">
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
                  <div className="divider before:bg-emerald-100 after:bg-emerald-100"></div>
                  <p className="text-xs text-gray-600">
                    <b>Job Type:</b> {selected.jobType} •{" "}
                    {selected.available_position} position(s)
                  </p>
                  {canApply && (
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        className="btn btn-sm bg-[#5b8f5b] text-white rounded-full px-6 hover:bg-emerald-700"
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
