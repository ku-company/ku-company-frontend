"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import JobPostForm from "@/components/JobPostForm";
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

  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
        const data = await fetchAuthedJson(API_URL_GET_ALL, { method: "GET" });
        setJobs(data.data || data || []);
      } catch (err) {
        console.error("❌ Failed to fetch jobs:", err);
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
        jobType: job.jobType, // ✅ จาก dropdown ใน form
        position: job.title,
        available_position: job.positionsAvailable,
      };

      const data = await fetchAuthedJson(API_URL_BASE, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const newJob = data.data || data;
      setJobs((prev) => [newJob, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error("❌ Failed to add job:", err);
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
        jobType: updated.jobType,
        position: updated.title,
        available_position: updated.positionsAvailable,
      };

      const data = await fetchAuthedJson(`${API_URL_BASE}/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const updatedJob = data.data || data;
      setJobs((prev) => prev.map((j, i) => (i === editIndex ? updatedJob : j)));
      closeEdit();
    } catch (err) {
      console.error("❌ Failed to update job:", err);
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
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Job Openings</h1>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
        >
          + Post a Job
        </button>
      )}

      {showForm && (
        <div className="mt-4">
          <JobPostForm onSubmit={handleAddJob} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">No job postings yet.</p>
        ) : (
          jobs.map((job: any, i: number) => (
            <div
              key={job.id || i}
              className="bg-white rounded-md border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {job.position || "Untitled"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {job.jobType || "—"}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(i)}
                  className="rounded-full border px-3 py-1 text-sm font-medium hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
              <p className="mt-2 text-gray-800">
                {job.description || "No description"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Positions Available: {job.available_position}
              </p>
            </div>
          ))
        )}
      </div>

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
