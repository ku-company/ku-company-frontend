"use client";

import { useEffect, useMemo, useState } from "react";
import JobPostForm from "@/components/JobPostForm";
import EditJobModal, { EditableJob } from "@/components/EditJobModal";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api/company/job-postings`;
const REFRESH_URL = `${BASE_URL}/api/token/refresh/`;

// Helper: fetch with auth + auto token refresh
async function fetchWithAuth(url: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  // Try refresh on 401
  if (res.status === 401) {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) throw new Error("Session expired. Please log in again.");

    const refreshRes = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshRes.ok) throw new Error("Session expired. Please log in again.");

    const data = await refreshRes.json();
    const newAccess = data.access;
    localStorage.setItem("accessToken", newAccess);

    headers.set("Authorization", `Bearer ${newAccess}`);
    res = await fetch(url, { ...options, headers });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }

  return res.json();
}

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("token")
        : null,
    []
  );

  // ---------------------------
  // GET: load jobs
  // ---------------------------
  useEffect(() => {
    const loadJobs = async () => {
      if (!token) return setLoading(false);
      try {
        const data = await fetchWithAuth(
          API_URL,
          { method: "GET", headers: { "Content-Type": "application/json" } },
          token
        );
        setJobs(data.data || data || []);
      } catch (err: any) {
        console.error("❌ Failed to fetch jobs:", err);
        if (err.message.includes("Session expired")) {
          alert(err.message);
          localStorage.clear();
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [token]);

  // ---------------------------
  // POST: create job
  // ---------------------------
  const handleAddJob = async (job: any) => {
    if (!token) {
      alert("⚠️ Token not found. Please log in again.");
      return;
    }
    try {
      const body = {
        description: job.details,
        jobType: job.jobType, // ✅ จาก dropdown ใน form
        position: job.title,
        available_position: job.positionsAvailable,
      };

      const data = await fetchWithAuth(
        API_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        token
      );

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
    if (editIndex === null || !token) return;
    const job = jobs[editIndex];
    try {
      const body = {
        description: updated.details,
        jobType: updated.jobType,
        position: updated.title,
        available_position: updated.positionsAvailable,
      };

      const data = await fetchWithAuth(
        `${API_URL}/${job.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        token
      );

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
