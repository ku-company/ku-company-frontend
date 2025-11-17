"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { buildInit, API_BASE } from "@/api/base";
import { useAuth } from "@/context/AuthContext";
import {
  listResumes,
  uploadResume,
  type ResumeItem,
} from "@/api/resume";
import { applyToJob } from "@/api/jobs";

const GREEN = "#5b8f5b";
const BASE_URL = API_BASE;
const APPLY_JOB_STORAGE_KEY = "ku-company/apply/selected-job";

type Job = {
  id: number;
  job_title?: string;
  position?: string;
  jobType?: string;
  work_place?: string | null;
  company_name?: string | null;
  company_user_id?: number;
  company_location?: string | null;
  location?: string | null;
};

export default function ApplyingJobPage() {
  const params = useParams<{ id: string }>();
  const idStr = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = idStr ? parseInt(idStr, 10) : NaN;

  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canApply = (user?.role || "").toLowerCase() === "student";

  // Load cached job
  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    try {
      const raw = sessionStorage.getItem(APPLY_JOB_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const storedJob = parsed?.job;

      if (storedJob?.id === id) {
        setJob((prev) => prev ?? storedJob);
      }
    } catch {}
  }, [id]);

  // Load job + resumes
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Load job
        if (id && !Number.isNaN(id)) {
          const res = await fetch(
            `${BASE_URL}/api/job-postings/${id}`,
            buildInit({ credentials: "include" })
          );

          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

          const item = json.job_posting || json.data || json;

          if (alive) {
            setJob(item);
            sessionStorage.setItem(
              APPLY_JOB_STORAGE_KEY,
              JSON.stringify({ job: item, cachedAt: Date.now() })
            );
          }
        }

        // Load resumes
        if (canApply) {
          const list = await listResumes();

          if (alive) {
            setResumes(list);
            if (list.length > 0) {
              setSelectedResumeId(list[0].id);
            }
          }
        }
      } catch (e) {
        console.error("Load apply data failed:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, canApply]);

  const title = job?.job_title || job?.position || "Job";
  const submitDisabled = submitting || !selectedResumeId;

  // -----------------------------
  // UPLOAD RESUME (FIXED)
  // -----------------------------
  async function handleUploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Backend requires PDF only
    if (file.type !== "application/pdf") {
      alert("Please upload PDF only.");
      return;
    }

    try {
      await uploadResume(file);

      // Refresh list from backend
      const newList = await listResumes();
      setResumes(newList);

      if (newList.length > 0) {
        setSelectedResumeId(newList[0].id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload resume");
    }
  }

  // -----------------------------
  // APPLY JOB
  // -----------------------------
  async function handleApply() {
    if (!id || Number.isNaN(id)) return;
    if (!selectedResumeId) return;

    try {
      setSubmitting(true);

      await applyToJob(id, selectedResumeId);

      alert("Application submitted successfully.");
      router.push("/status");
    } catch (e: any) {
      alert(e?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------
  // NOT STUDENT
  // -----------------------------
  if (!canApply) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border p-6">
          You must be a student to apply.
        </div>
      </main>
    );
  }

  // -----------------------------
  // PAGE UI
  // -----------------------------
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Applying Job</h1>

      {/* Job Header */}
      <div
        className="rounded-2xl border-2 bg-white p-5 shadow-sm"
        style={{ borderColor: GREEN }}
      >
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full border bg-emerald-50 text-emerald-700 grid place-items-center">
            <span className="font-semibold">
              {(job?.company_name || "?").slice(0, 1).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xl font-semibold">{title}</div>

              {job?.jobType && (
                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs bg-white">
                  {job.jobType}
                </span>
              )}

              {job?.work_place && (
                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs bg-white">
                  {job.work_place}
                </span>
              )}
            </div>

            <div className="text-gray-600 text-sm">{job?.company_name}</div>

            <div className="text-gray-500 flex items-center gap-1 text-sm">
              <MapPinIcon className="h-4 w-4" />
              {job?.location ?? job?.company_location}
            </div>
          </div>
        </div>
      </div>

      {/* Resume Section */}
      <section
        className="mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm"
        style={{ borderColor: GREEN }}
      >
        <h2 className="text-lg font-semibold">Resumé File</h2>

        {/* Upload resume */}
        <div className="mt-4">
          <label
            htmlFor="resume-upload"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
          >
            📄 Upload Resume
          </label>

          <input
            id="resume-upload"
            type="file"
            className="hidden"
            onChange={handleUploadResume}
            accept="application/pdf"
          />
        </div>

        {/* Resume list */}
        <div className="mt-4 flex flex-col gap-3">
          {resumes.length === 0 && (
            <div className="text-gray-500 text-sm">No résumé found.</div>
          )}

          {resumes.map((r) => (
            <label
              key={r.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                className="h-4 w-4"
                checked={selectedResumeId === r.id}
                onChange={() => setSelectedResumeId(r.id)}
              />

              <div className="text-sm font-medium">
                {r.name?.length > 80 ? r.name.slice(0, 80) + "..." : r.name}
              </div>
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <Link
            href="/find-job"
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            disabled={submitDisabled}
            onClick={handleApply}
            className="rounded-full px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            Apply
          </button>
        </div>
      </section>
    </main>
  );
}
