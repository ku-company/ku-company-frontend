"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/ui/card";
import Button from "@/ui/button";
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
  const [verified, setVerified] = useState<boolean>(false);

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

  async function handleApplyAll() {
    if (!selectedResumeId) {
      alert("Please choose a resume first.");
      return;
    }
    if (items.length === 0) {
      alert("Your list is empty.");
      return;
    }
    setSubmitting(true);
    try {
      const resumeId = parseInt(selectedResumeId, 10);
      const ids = items.map((j) => j.id);
      await applyJobsBulk(resumeId, ids);
      alert("Applied to all selected jobs.");
      clear();
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
      <div className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Apply List</h1>
        <p className="text-sm text-gray-600">Select a resume, review jobs, then apply to all.</p>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="text-sm font-medium">Resume</div>
        </CardHeader>
        <CardContent>
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
            disabled={!verified}
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Selected Jobs ({items.length})</h2>
            {items.length > 0 && (
              <button onClick={clear} className="text-sm text-red-600 hover:underline">Clear all</button>
            )}
          </div>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-gray-600">No jobs selected. Go to Find Job and add some.</div>
          ) : (
            items.map((job) => (
              <div key={job.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{job.position}</div>
                    <div className="text-xs text-gray-600">{job.company?.company_name}     {job.company?.location}</div>
                    <div className="mt-1 text-xs text-gray-500">{job.jobType}</div>
                  </div>
                  <button onClick={() => remove(job.id)} className="text-xs rounded-full border px-2 py-1 hover:bg-gray-50">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button disabled={submitting || items.length === 0 || !selectedResumeId || !verified} onClick={handleApplyAll} loading={submitting}>
          Apply All
        </Button>
      </div>
    </main>
  );
}
