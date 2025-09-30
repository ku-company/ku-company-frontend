"use client";

import { useMemo, useState } from "react";
import ApplyModal from "@/components/ApplyModal"; // <-- NEW

// ----- Types -----
type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  postedDaysAgo: number;
  bullets: string[];
  tag?: string;
  brand?: { initials: string; color: string };
  category: string;
};

// ----- Mock data -----
const JOBS: Job[] = [
  {
    id: "scb-ml-eng",
    title: "Machine Learning Engineer",
    company: "Siam Commercial Bank Public Co., Ltd.",
    location: "Bangkok (Hybrid)",
    postedDaysAgo: 11,
    tag: "Machine Learning Engineer",
    bullets: [
      "Design & Deploy ML Systems: end-to-end design, training, testing, and deployment of ML models in production.",
      "MLOps Setup & Optimization: pipelines, scalable model deployment, monitoring systems, version control.",
      "Collaborate widely: data scientists, SWE, product teams, etc.",
      "Best Practices & Scalability: clean code, standards, documentation, and processes to support ML workflows.",
    ],
    brand: { initials: "SCB", color: "bg-violet-600" },
    category: "AI/ML",
  },
  {
    id: "30s-dev",
    title: "Full Stack Developer",
    company: "30 SECONDSTOFY (THAILAND) CO., LTD.",
    location: "Phra Khanong, Bangkok (Hybrid) ฿95,000 – 140,000",
    postedDaysAgo: 24,
    bullets: ["Hybrid working environment.", "Challenging tasks.", "Competitive salary & benefits."],
    brand: { initials: "30S", color: "bg-slate-700" },
    category: "Full-stack",
  },
  {
    id: "prime-solution-dev",
    title: "Full Stack Developer",
    company: "PRIME SELECTION (THAILAND)",
    location: "Hybrid Working Environment",
    postedDaysAgo: 18,
    bullets: ["Hybrid working environment", "Challenging tasks"],
    brand: { initials: "PS", color: "bg-cyan-600" },
    category: "Full-stack",
  },
];

// Mock uploaded resumes (you’ll replace with real data from your API/auth user)
const UPLOADED_RESUMES = [
  { id: "r1", name: "Ann-Montakarn-Resume.pdf", updatedAt: "Updated 2 days ago", size: "214 KB" },
  { id: "r2", name: "Ann-Data-Engineer-CV.pdf", updatedAt: "Updated 2 months ago", size: "198 KB" },
];

// Brand green
const GREEN = "#5b8f5b";

// Small UI helpers
function TinyIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-grid h-5 w-5 place-items-center rounded-full border text-[10px] text-gray-600">
      {children}
    </span>
  );
}

function RoundBrand({ initials, color }: { initials: string; color: string }) {
  return (
    <div className={`ml-auto grid h-10 w-10 place-items-center rounded-full text-[11px] font-semibold text-white ${color}`}>
      {initials}
    </div>
  );
}

// ----- Page -----
export default function FindJobPage() {
  // applied filters
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>("All");

  // draft inputs
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [draftCategory, setDraftCategory] = useState(category);

  const [selectedId, setSelectedId] = useState<string>(JOBS[0].id);

  // NEW: modal open/close
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const filtered = useMemo(() => {
    return JOBS.filter((j) => {
      const kw = keyword.toLowerCase().trim();
      const okKw =
        !kw ||
        j.title.toLowerCase().includes(kw) ||
        j.company.toLowerCase().includes(kw) ||
        j.location.toLowerCase().includes(kw);
      const okCat = category === "All" || j.category === category;
      return okKw && okCat;
    });
  }, [keyword, category]);

  const selected = filtered.find((j) => j.id === selectedId) ?? filtered[0];

  // handlers
  const applySearch = () => {
    setKeyword(draftKeyword);
    setCategory(draftCategory);
    if (selected && !filtered.some((j) => j.id === selected.id)) {
      setSelectedId(JOBS[0].id);
    }
  };

  const resetFilters = () => {
    setDraftKeyword("");
    setDraftCategory("All");
    setKeyword("");
    setCategory("All");
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.key === "Enter") applySearch();
  };

  // NEW: submit application handler
  const handleSubmitApplication = (payload: { mode: "existing" | "upload"; resumeId?: string; file?: File }) => {
    // TODO: integrate with your backend:
    // - If payload.mode === "existing": POST { jobId: selected.id, resumeId: payload.resumeId }
    // - If payload.mode === "upload": upload payload.file then submit application with returned resumeId
    console.log("Submit application", { jobId: selected?.id, ...payload });
    setIsApplyOpen(false);
    alert("Application submitted! (Check console for payload)");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Top filter bar */}
      <section className="rounded-2xl border bg-white p-3 sm:p-4 shadow-sm" style={{ borderColor: GREEN }}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={draftKeyword}
            onChange={(e) => setDraftKeyword(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Keyword"
            className="h-10 w-[200px] flex-1 rounded-full border px-4 text-sm focus:outline-none focus:ring"
          />
          <select
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="h-10 w-[200px] rounded-full border px-3 text-sm"
          >
            <option>All</option>
            <option>AI/ML</option>
            <option>Full-stack</option>
          </select>

          <div className="ml-auto flex gap-2">
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: GREEN }}
              onClick={applySearch}
            >
              Search
            </button>
            <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50" onClick={resetFilters}>
              All Positions
            </button>
            <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">New for You</button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px,1fr]">
        {/* Left: job list */}
        <aside className="space-y-3">
          {filtered.map((job) => {
            const active = job.id === (selected?.id ?? "");
            return (
              <button
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${active ? "ring-2" : ""}`}
                style={{ borderColor: GREEN, boxShadow: active ? `0 0 0 2px ${GREEN}` : undefined }}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-5">{job.title}</div>
                    <div className="mt-1 text-xs text-gray-600">
                      {job.company}
                      <br />
                      {job.location}
                    </div>
                    <ul className="mt-2 list-disc pl-4 text-xs text-gray-700 space-y-1">
                      {job.bullets.slice(0, 3).map((b, i) => (
                        <li key={i} className="line-clamp-1">
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-[11px] text-gray-500">{job.postedDaysAgo} days ago</div>
                  </div>
                  {job.brand && <RoundBrand initials={job.brand.initials} color={job.brand.color} />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border p-6 text-sm text-gray-600">No jobs match your filters.</div>
          )}
        </aside>

        {/* Right: detail panel */}
        <section className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TinyIcon>←</TinyIcon>
              <span className="hidden sm:inline">Select Job</span>
              <span className="sm:hidden">Back</span>
            </div>
            <div className="text-[11px] text-gray-500">{selected?.postedDaysAgo} days ago</div>
          </div>

          {selected && (
            <>
              <div className="mt-4">
                <div className="inline-block rounded-lg px-3 py-2 text-white text-xs font-semibold" style={{ backgroundColor: GREEN }}>
                  {selected.tag ?? selected.title}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {selected.company}, {selected.location}
                </div>
              </div>

              <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-2">
                {selected.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              <div className="mt-6 flex justify-end">
                <button
                  className="rounded-full px-6 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: GREEN }}
                  onClick={() => setIsApplyOpen(true)} // <-- OPEN MODAL
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
        onSubmit={handleSubmitApplication}
        resumes={UPLOADED_RESUMES}
        jobTitle={selected?.title}
        brandColor={GREEN}
      />
    </main>
  );
}
