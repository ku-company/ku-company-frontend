"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EditJobModal, { EditableJob } from "@/components/EditJobModal";
import { buildInit } from "@/api/base";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_URL_BASE = `${BASE_URL}/api/company/job-postings`;
const API_URL_GET_ALL = `${API_URL_BASE}/all`;

async function fetchAuthedJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, buildInit({ credentials: "include", ...init }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isCompany = useMemo(() => (user?.role || "").toLowerCase().includes("company"), [user]);

  const [createOpen, setCreateOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function toBackendJobType(label?: string): string | undefined {
    if (!label) return undefined;
    const t = label.replace(/\s+/g, '').toLowerCase();
    if (t.includes('fulltime')) return 'FullTime';
    if (t.includes('parttime')) return 'PartTime';
    if (t.includes('intern')) return 'Internship';
    if (t.includes('contract')) return 'Contract';
    if (['FullTime','PartTime','Internship','Contract'].includes(label)) return label;
    return undefined;
  }

  // ---------------------------
  // GET: load jobs
  // ---------------------------
  useEffect(() => {
    if (!isReady) return; // wait for auth
    if (!isCompany) {
      // Not authorized: route away
      router.replace("/");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        // Backend defines GET all at /api/company/job-postings/all
        const headers: HeadersInit = user?.access_token
          ? { Authorization: `Bearer ${user.access_token}` }
          : {};
        const data = await fetchAuthedJson(API_URL_GET_ALL, { method: "GET", headers });
        setJobs(data.data || data || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isReady, isCompany, router]);

  // ---------------------------
  // POST: create job
  // ---------------------------
  const handleAddJob = async (job: any) => {
    try {
      const body = {
        description: job.details,
        jobType: toBackendJobType(job.jobType),
        position: job.title,
        available_position: job.positionsAvailable,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
      };
      const data = await fetchAuthedJson(API_URL_BASE, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });

      const newJob = data.data || data;
      setJobs((prev) => [newJob, ...prev]);
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to add job:", err);
      alert("Failed to add job posting.");
    }
  };

  // ---------------------------
  // PATCH: update job
  // ---------------------------
  const handleSaveEdit = async (updated: EditableJob) => {
    if (editIndex === null) return;
    const job = jobs[editIndex];
    try {
      const body = {
        description: updated.details,
        jobType: toBackendJobType(updated.jobType),
        position: updated.title,
        available_position: updated.positionsAvailable,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
      };
      const data = await fetchAuthedJson(`${API_URL_BASE}/${job.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const updatedJob = data.data || data;
      setJobs((prev) => prev.map((j, i) => (i === editIndex ? updatedJob : j)));
      closeEdit();
    } catch (err) {
      console.error("Failed to update job:", err);
      alert("Failed to update job posting.");
    }
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditIndex(null);
  };

  const editInitial: EditableJob | null =
    editIndex !== null
      ? {
          title: jobs[editIndex]?.position ?? "",
          jobType: jobs[editIndex]?.jobType ?? "",
          details: jobs[editIndex]?.description ?? "",
          positionsAvailable: Number(jobs[editIndex]?.available_position ?? 1),
        }
      : null;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Job Openings</h1>

      <button
        onClick={() => setCreateOpen(true)}
        className="rounded-[30] px-4 py-2 font-semibold text-white" style={{ backgroundColor: '#5D9252' }}
      >
        + Post a Job
      </button>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">No job postings yet.</p>
        ) : (
          jobs.map((job: any, i: number) => (
            <div key={job.id || i} className="rounded-2xl border justify-center items-center bg-gray-50 p-5 shadow-sm min-h-28 md:min-h-30">
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="mt-1 text-xl font-extrabold">
                    {job.position || "Untitled"}
                  </div>
                  <div className="mt-1 text-xs font-semibold tracking-wide text-gray-700">
                    {(job.jobType || "").toString().toUpperCase() || "FULL TIME"}
                    <span className="mx-2 text-gray-300">|</span>
                    Positions: {job.available_position ?? 1}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Example right-side meta; placeholders until backend fields exist */}
                  <div className="text-sm text-gray-800">
                    {job.location || "REMOTE"}
                    <span className="mx-2 text-gray-300">|</span>
                    {job.country || "THAILAND"}
                  </div>
                  <button
                    onClick={() => openEdit(i)}
                    className="rounded-full border px-3 py-1 text-sm font-medium hover:bg-gray-100"
                    style={{ borderColor: "#5D9252", color: "#2c4d2a" }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Job Modal */}
      <EditJobModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        initial={{ title: "", position: "", details: "", positionsAvailable: 1, jobType: "Full Time" }}
        onSave={handleAddJob}
        brandColor="#5D9252"
        mode="create"
      />

      <EditJobModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={editInitial}
        onSave={handleSaveEdit}
        brandColor="#5D9252"
      />
    </div>
  );
}



