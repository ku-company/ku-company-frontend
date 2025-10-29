"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { buildInit } from "@/api/base";
import Markdown from "@/components/Markdown";
import ApplyModal from "@/components/ApplyModal";
import { useAuth } from "@/context/AuthContext";
import { useApplyCart } from "@/context/ApplyCartContext";
import { listResumes } from "@/api/resume";
import { listMyApplications } from "@/api/applications";
import { applyToJob } from "@/api/jobs";

const GREEN = "#5b8f5b";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Job = {
  id: number;
  job_title: string;
  position: string;
  description: string;
  jobType: string;
  available_position: number;
  company_name?: string | null;
  company_user_id?: number;
  company_location?: string | null;
  location?: string | null;
  work_place?: string | null;
  minimum_expected_salary?: number | null;
  maximum_expected_salary?: number | null;
};

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user } = useAuth();
  const { add, contains } = useApplyCart();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [resumes, setResumes] = useState<{ id: string; name: string }[]>([]);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/job-postings/${id}`, buildInit({ credentials: "include" }));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        const item = json.job_posting || json.data || json;
        if (alive) setJob(item);
        setError(null);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load job");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Load resumes and applied state for students
  useEffect(() => {
    (async () => {
      if (!user || (user.role || "").toLowerCase() !== "student" || !job?.id) return;
      try {
        const r = await listResumes();
        const mapped = (r || []).map((x: any) => ({ id: String(x.id), name: x.name || "Unnamed Resume" }));
        setResumes(mapped);
      } catch {}
      try {
        const apps = await listMyApplications();
        const has = (apps || []).some((a: any) => a?.job_id === job.id || a?.job_post?.id === job.id);
        setApplied(has);
      } catch {}
    })();
  }, [user, job?.id]);

  async function handleApply(payload: { mode: "existing"; resumeId?: string }) {
    if (!job?.id) return;
    const rid = payload.resumeId ? parseInt(payload.resumeId, 10) : NaN;
    if (!rid) { alert("Please select a resume."); return; }
    try {
      await applyToJob(job.id, rid);
      setApplied(true);
      setIsApplyOpen(false);
      alert("Application submitted successfully.");
    } catch (err: any) {
      console.error("Apply failed", err);
      alert(typeof err?.message === "string" ? err.message : "Failed to submit application.");
    }
  }

  if (!id) return <div className="p-6">Missing id</div>;
  if (loading) return <div className="p-6 text-gray-600">Loading job…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!job) return <div className="p-6 text-gray-600">Job not found.</div>;

  const canApply = (user?.role || "").toLowerCase() === "student";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-3">
        <Link href="/find-job" className="text-sm text-emerald-700 hover:underline">← Back to Find Job</Link>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
        <div className="space-y-2">
          <div className="text-2xl font-semibold">{job.job_title || job.position}</div>
          <div className="text-base text-gray-600 break-words flex items-center gap-1">
            <BuildingOfficeIcon className="h-4 w-4" />
            {job.company_user_id ? (
              <Link className="hover:underline cursor-pointer" href={`/profile/${job.company_user_id}`}>{job.company_name}</Link>
            ) : (
              job.company_name
            )}
          </div>
          <div className="text-sm text-gray-500 break-words flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            {job.location ?? job.company_location}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-700">
          <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5">
            <span className="font-medium">{job.jobType || '-'}</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5">
            <span className="font-medium">{job.work_place || '-'}</span>
          </span>
        </div>

        <div className="mt-2 grid gap-1 text-sm text-gray-600">
          <div>Available Positions: {job.available_position}</div>
          <div>
            Expected Salary: {
              typeof job.minimum_expected_salary === 'number' && typeof job.maximum_expected_salary === 'number'
                ? `${job.minimum_expected_salary.toLocaleString()} - ${job.maximum_expected_salary.toLocaleString()}`
                : '-'
            }
          </div>
        </div>

        <Markdown className="mt-4 text-base text-gray-700" content={job.description} />

        {canApply && (
          <div className="mt-6 flex justify-end">
            {(() => {
              const isInCart = contains(job.id);
              return (
                <div className="flex gap-2">
                  <button
                    disabled={applied}
                    onClick={!applied ? () => setIsApplyOpen(true) : undefined}
                    className={`rounded-full px-6 py-2 text-sm font-semibold text-white ${applied ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: GREEN }}
                  >
                    {applied ? 'APPLIED' : 'APPLY'}
                  </button>
                  <button
                    disabled={applied || isInCart}
                    onClick={() => add({
                      id: job.id,
                      jobType: job.jobType,
                      position: job.position,
                      job_title: job.job_title,
                      available_position: job.available_position,
                      company_name: job.company_name || undefined,
                      company_location: job.company_location || undefined,
                    })}
                    className={`rounded-full border px-4 py-2 text-sm ${applied || isInCart ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    {isInCart ? 'ADDED' : 'ADD TO LIST'}
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {canApply && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSubmit={handleApply as any}
          resumes={resumes}
          jobTitle={job?.job_title || job?.position}
          brandColor={GREEN}
        />
      )}
    </main>
  );
}
