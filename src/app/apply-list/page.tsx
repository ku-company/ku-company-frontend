"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApplyCart } from "@/context/ApplyCartContext";
import { listResumes } from "@/api/resume";
import { getMyStudentProfile } from "@/api/studentprofile";
import { applyJobsBulk } from "@/api/jobs";

type Resume = { id: string; name: string };

const GREEN = "#5b8f5b";

export default function ApplyListPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isStudent = useMemo(() => (user?.role || "").toLowerCase() === "student", [user]);
  const { items, remove, clear } = useApplyCart();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isReady) return;
    if (!isStudent) {
      router.replace("/");
    }
  }, [isReady, isStudent, router]);

  useEffect(() => {
    if (!isStudent) return;
    (async () => {
      try {
        // Fetch verification status
        try {
          const me = await getMyStudentProfile();
          setVerified(!!me.verified);
        } catch {
          setVerified(false);
        }
        const list = await listResumes();
        const mapped = (list || []).map((r: any) => ({ id: String(r.id), name: r.name || "Unnamed Resume" }));
        setResumes(mapped);
        setSelectedResumeId(mapped[0]?.id);
      } catch {}
    })();
  }, [isStudent]);

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const allIds = items.map((j) => j.id);
      const allSelected = prev.size === allIds.length && allIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }

  useEffect(() => {
    // prune selections if items change
    setSelectedIds((prev) => new Set(items.map((j) => j.id).filter((id) => prev.has(id))));
  }, [items]);

  async function handleApplySelected() {
    if (!selectedResumeId) {
      alert("Please choose a resume first.");
      return;
    }
    const ids = items.map((j) => j.id).filter((id) => selectedIds.has(id));
    if (ids.length === 0) {
      alert("Please select at least one job.");
      return;
    }
    setSubmitting(true);
    try {
      const resumeId = parseInt(selectedResumeId, 10);
      await applyJobsBulk(resumeId, ids);
      alert("Applied to selected jobs.");
      clear(); setSelectedIds(new Set());
      router.push("/find-job");
    } catch (err: any) {
      console.error("Apply all failed", err);
      alert(typeof err?.message === "string" ? err.message : "Failed to apply to some jobs.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold">Apply List</h1>
      <p className="text-sm text-gray-600">Select a resume, review jobs, then apply to all.</p>

      <section className="mt-4 rounded-2xl border bg-white p-4" style={{ borderColor: GREEN }}>
        <label className="text-sm font-medium">Resume</label>
        {verified === false ? (
          <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            You must be verified to use this function.
          </div>
        ) : resumes.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">No resume uploaded.</div>
        ) : (
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="mt-2 h-10 w-full rounded-lg border px-3 text-sm"
            disabled={verified === false}
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </section>

      <section className="mt-4 rounded-2xl border bg-white p-4" style={{ borderColor: GREEN }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Selected Jobs ({items.length})</h2>
            {items.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleAll} />
                Select All
              </label>
            )}
          </div>
          {items.length > 0 && (
            <button onClick={() => { clear(); setSelectedIds(new Set()); }} className="text-sm text-red-600 hover:underline">Clear all</button>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-gray-600">No jobs selected. Go to Find Job and add some.</div>
          ) : (
            items.map((job) => (
              <div key={job.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleOne(job.id)}
                    />
                    <div>
                      {(() => {
                        const title = (job as any).job_title || job.position || "Untitled";
                        const position = job.position || (job as any).position || "";
                        const companyName = (job as any).company_name || job.company?.company_name || "";
                        const companyLoc = (job as any).company_location || job.company?.location || "";
                        return (
                          <>
                            <div className="font-medium">{title}</div>
                            <div className="text-xs text-gray-600">{position}{companyName ? ` • ${companyName}` : ""}</div>
                            <div className="mt-1 text-xs text-gray-500">{companyLoc}</div>
                            <div className="mt-1 text-[11px] text-gray-500">{job.jobType}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button onClick={() => remove(job.id)} className="text-xs rounded-full border px-2 py-1 hover:bg-gray-50">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          disabled={submitting || items.length === 0 || !selectedResumeId || verified === false || selectedIds.size === 0}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: GREEN }}
          onClick={handleApplySelected}
        >
          {submitting ? "Applying..." : `Apply Selected (${selectedIds.size})`}
        </button>
      </div>
    </main>
  );
}
