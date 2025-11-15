"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { buildInit } from "@/api/base";
import { useAuth } from "@/context/AuthContext";
import { getMyStudentProfile, patchMyStudentProfile, type StudentProfile } from "@/api/studentprofile";
import { listResumes, uploadResume, type ResumeItem } from "@/api/resume";
import { applyToJob } from "@/api/jobs";

const GREEN = "#5b8f5b";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  type Mode = "upload" | "existing" | "none";
  const [mode, setMode] = useState<Mode>("upload");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canApply = (user?.role || "").toLowerCase() === "student";

  // Load job, profile, and resumes
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // Job
        if (id && !Number.isNaN(id)) {
          const res = await fetch(`${BASE_URL}/api/job-postings/${id}`, buildInit({ credentials: "include" }));
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
          const item = json.job_posting || json.data || json;
          if (alive) setJob(item);
        }

        // Profile (student)
        if (canApply) {
          try {
            const p = await getMyStudentProfile();
            if (alive) {
              setProfile(p);
              setFirstName(p.first_name || "");
              setLastName(p.last_name || "");
              setEmail(p.email || user?.email || "");
              setPhone(p.phone || "");
            }
          } catch {}

          try {
            const list = await listResumes();
            if (alive) {
              setResumes(list);
              if (list.length > 0) setSelectedResumeId(list[0].id);
            }
          } catch {}
        }
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, canApply]);

  const title = job?.job_title || job?.position || "Job";

  const submitDisabled = useMemo(() => {
    if (submitting) return true;
    if (mode === "upload") return !file;
    if (mode === "existing") return !selectedResumeId;
    return true; // none -> disable
  }, [mode, file, selectedResumeId, submitting]);

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      await patchMyStudentProfile({
        summary: profile?.bio || undefined,
        contactInfo: profile?.contactInfo || undefined,
      });
      alert("Saved basic details (demo). You can manage full profile on your profile page.");
    } catch (e: any) {
      alert(e?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleApply() {
    if (!id || Number.isNaN(id)) return;
    try {
      setSubmitting(true);
      let resumeId: number | null = null;
      if (mode === "upload") {
        if (!file) return;
        const up = await uploadResume(file);
        resumeId = up.id;
      } else if (mode === "existing") {
        resumeId = selectedResumeId!;
      } else {
        return; // none: do nothing
      }
      if (!resumeId) return;
      await applyToJob(id, resumeId);
      alert("Application submitted successfully.");
      router.push("/status");
    } catch (e: any) {
      alert(e?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canApply) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-2xl border p-6">You must be a student to apply.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-semibold mb-4">Applying Job</h1>

      {/* Job header */}
      <div className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: GREEN }}>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border bg-emerald-50 text-emerald-700 grid place-items-center flex-shrink-0">
            <span className="font-semibold">{(job?.company_name || "?").slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-semibold">{title}</div>
              {job?.jobType && (
                <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs">
                  {job.jobType}
                </span>
              )}
              {job?.work_place && (
                <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs">
                  {job.work_place}
                </span>
              )}
            </div>
            <div className="mt-1 text-gray-600 flex items-center gap-1 text-sm">
              <BuildingOfficeIcon className="h-4 w-4" />
              {job?.company_name}
            </div>
            <div className="text-gray-500 flex items-center gap-1 text-sm">
              <MapPinIcon className="h-4 w-4" />
              {job?.location ?? job?.company_location}
            </div>
          </div>
        </div>
      </div>

      {/* Personal details */}
      <section className="mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: GREEN }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <button
            onClick={handleSaveProfile}
            className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={savingProfile}
          >
            Save
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">First name</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email address</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Last name</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Phone number</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Resume section */}
      <section className="mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: GREEN }}>
        <h2 className="text-lg font-semibold">Resumé File</h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <input type="radio" name="mode" checked={mode === 'upload'} onChange={() => setMode('upload')} />
            <div className="font-medium">Upload a resumé</div>
          </label>
          {mode === "upload" && (
            <div className="pl-7">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              <div className="text-xs text-gray-500">Accepted file types: pdf. Max 10MB.</div>
            </div>
          )}

          <label className="mt-2 flex items-center gap-3 rounded-lg border px-4 py-3">
            <input type="radio" name="mode" checked={mode === 'existing'} onChange={() => setMode('existing')} />
            <div className="font-medium">Select a resumé</div>
          </label>
          {mode === "existing" && (
            <div className="pl-7">
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={selectedResumeId ?? ''}
                onChange={(e) => setSelectedResumeId(e.target.value ? parseInt(e.target.value, 10) : null)}
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name || r.file_url}</option>
                ))}
              </select>
            </div>
          )}

          <label className="mt-2 flex items-center gap-3 rounded-lg border px-4 py-3">
            <input type="radio" name="mode" checked={mode === 'none'} onChange={() => setMode('none')} />
            <div className="font-medium">Don't include a resumé</div>
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/find-job" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">Cancel</Link>
          <button
            disabled={submitDisabled}
            onClick={handleApply}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            style={{ backgroundColor: GREEN }}
          >
            Apply
          </button>
        </div>
      </section>
    </main>
  );
}

