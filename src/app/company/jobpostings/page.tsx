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
const BRAND_GREEN = "#5b8f5b";

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
  const isCompany = useMemo(
    () => (user?.role || "").toLowerCase().includes("company"),
    [user]
  );

  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // ────────────────────────────── Load All Jobs ──────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    if (!isCompany) {
      router.replace("/");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = user?.access_token
          ? { Authorization: `Bearer ${user.access_token}` }
          : {};
        const data = await fetchAuthedJson(API_URL_GET_ALL, {
          method: "GET",
          headers,
        });
        setJobs(data.data || data || []);
      } catch (err) {
        console.error("❌ Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isReady, isCompany, router]);

  // ────────────────────────────── Add Job ──────────────────────────────
  const handleAddJob = async (job: any) => {
    try {
      const body = {
        description: job.details,
        jobType: job.jobType,
        position: job.title,
        available_position: job.positionsAvailable,
      };
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token
          ? { Authorization: `Bearer ${user.access_token}` }
          : {}),
      };
      const data = await fetchAuthedJson(API_URL_BASE, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });
      const newJob = data.data || data;
      setJobs((prev) => [newJob, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error("❌ Failed to add job:", err);
      alert("Failed to add job posting.");
    }
  };

  // ────────────────────────────── Edit Job ──────────────────────────────
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
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token
          ? { Authorization: `Bearer ${user.access_token}` }
          : {}),
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

  // ────────────────────────────── Render ──────────────────────────────
  return (
    <main className="min-h-screen bg-[#f7f9f7] py-10 font-sans">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5b8f5b] tracking-tight">
              Company Job Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your job postings and edit details easily.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-sm bg-[#5b8f5b] text-white rounded-full hover:bg-[#4a7a4a]"
            >
              + Post a Job
            </button>
          )}
        </div>

        {/* Post Form */}
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#5b8f5b]">
                New Job Posting
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-xs btn-ghost text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <JobPostForm onSubmit={handleAddJob} />
          </div>
        )}

        {/* Job List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-gray-500 text-center py-10">
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center p-10 border border-emerald-100 bg-emerald-50/60 text-[#5b8f5b] rounded-2xl">
              <p className="font-medium">No job postings yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first job listing using the “Post a Job” button.
              </p>
            </div>
          ) : (
            jobs.map((job: any, i: number) => (
              <div
                key={job.id || i}
                className="card bg-white border border-gray-100 shadow-sm hover:shadow-md transition rounded-2xl"
              >
                <div className="card-body p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#5b8f5b]">
                        {job.position || "Untitled"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {job.jobType || "—"}
                      </p>
                      <p className="mt-2 text-gray-800">
                        {job.description || "No description provided."}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        <b>Positions Available:</b>{" "}
                        {job.available_position || 1}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(i)}
                      className="btn btn-sm btn-outline border-[#5b8f5b] text-[#5b8f5b] hover:bg-[#5b8f5b] hover:text-white rounded-full"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EditJobModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={editInitial}
        onSave={handleSaveEdit}
        brandColor={BRAND_GREEN}
      />
    </main>
  );
}
